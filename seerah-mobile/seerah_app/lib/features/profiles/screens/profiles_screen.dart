import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/profile_model.dart';
import '../../../core/providers/profiles_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/system_insets.dart';
import '../../../core/widgets/adaptive_icons.dart';
import '../../../core/widgets/ui_kit.dart';

// ── Profile picker (Netflix-style) ────────────────────────────────────────────

class ProfilesScreen extends ConsumerStatefulWidget {
  const ProfilesScreen({super.key});

  @override
  ConsumerState<ProfilesScreen> createState() => _ProfilesScreenState();
}

class _ProfilesScreenState extends ConsumerState<ProfilesScreen> {
  /// When true, tapping a profile opens rename/delete instead of switching.
  bool _managing = false;

  @override
  Widget build(BuildContext context) {
    final profilesAsync = ref.watch(profilesProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text(_managing ? 'Manage Profiles' : 'Who\'s Learning?'),
        actions: [
          TextButton(
            onPressed: () => setState(() => _managing = !_managing),
            child: Text(
              _managing ? 'Done' : 'Edit',
              style: const TextStyle(
                color: AppColors.gold,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      body: AppGradientBackground(
        // Audit H10 fix: SafeArea's default bottom inset
        // (MediaQuery.padding.bottom) can report 0 on some Android devices
        // even while the 3-button nav bar still overlaps content — bottom
        // is handled explicitly via bottomSystemInset() in _buildGrid
        // instead, matching every other bottom-inset spot in the app.
        child: SafeArea(
          bottom: false,
          child: profilesAsync.when(
            data: (state) => _buildGrid(state),
            loading: () => const Center(child: CircularProgressIndicator.adaptive()),
            error: (e, _) => Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline, color: AppColors.textMuted, size: 40),
                  const SizedBox(height: 12),
                  const Text('Could not load profiles',
                      style: TextStyle(color: AppColors.textSecondary)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => ref.invalidate(profilesProvider),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGrid(ProfilesState state) {
    final profiles = state.profiles;
    final items = [
      ...profiles,
      if (!_managing && state.canAddMore) null, // null = "Add Profile" slot
    ];

    return Column(
      children: [
        if (_managing)
          const Padding(
            padding: EdgeInsets.fromLTRB(24, 4, 24, 0),
            child: Text(
              'Tap a profile to rename or remove it.',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
              textAlign: TextAlign.center,
            ),
          ),
        const SizedBox(height: 12),
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 24,
              crossAxisSpacing: 16,
              childAspectRatio: 0.72,
            ),
            itemCount: items.length,
            itemBuilder: (context, i) {
              final profile = items[i];
              if (profile == null) {
                return _AddProfileTile(
                  onTap: () => _showAddDialog(context, ref),
                ).animate().fadeIn(duration: 300.ms, delay: (i * 60).ms);
              }
              return _ProfileTile(
                profile: profile,
                managing: _managing,
                onTap: () {
                  if (_managing) {
                    _showEditSheet(context, ref, profile, state);
                  } else {
                    _selectProfile(context, ref, profile);
                  }
                },
                onLongPress: () => _showEditSheet(context, ref, profile, state),
              ).animate().fadeIn(duration: 300.ms, delay: (i * 60).ms);
            },
          ),
        ),

        // Family plan upsell if on individual plan
        if (!state.canAddMore && state.profileLimit == 1)
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
            child: Material(
              color: AppColors.goldFaded,
              borderRadius: BorderRadius.circular(12),
              child: InkWell(
                // push preserves the back-stack this screen was reached
                // through (profile_screen/dashboard both use push to get
                // here) — matches every other paywall entry point in the app.
                onTap: () => context.push('/pricing'),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.family_restroom_rounded, color: AppColors.gold, size: 22),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Upgrade to Family Access',
                            style: TextStyle(color: AppColors.gold, fontSize: 14, fontWeight: FontWeight.w700)),
                          Text('Add up to 5 learner profiles',
                            style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                        ],
                      ),
                    ),
                    const ForwardChevronIcon(color: AppColors.gold, size: 20),
                  ],
                ),
                ),
              ),
            ),
          ),
        SizedBox(height: bottomSystemInset(context)),
      ],
    );
  }

  Future<void> _selectProfile(
      BuildContext context, WidgetRef ref, ProfileModel profile) async {
    if (profile.isActive) {
      // Already active — just go back
      if (context.canPop()) context.pop();
      else context.go('/dashboard');
      return;
    }

    final error = await ref.read(profilesProvider.notifier).switchProfile(profile.id);
    if (error != null && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: Colors.red));
      return;
    }

    // Refresh progress after switching — reset() (not invalidate()) so the
    // dashboard we're about to pop back to never renders even one frame of
    // the previous profile's progress (see ProgressNotifier.reset doc).
    await ref.read(progressProvider.notifier).reset();

    if (!context.mounted) return;
    if (context.canPop()) context.pop();
    else context.go('/dashboard');
  }

  Future<void> _showAddDialog(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController();
    try {
      await _showAddDialogInner(context, ref, controller);
    } finally {
      controller.dispose();
    }
  }

  Future<void> _showAddDialogInner(
      BuildContext context, WidgetRef ref, TextEditingController controller) async {
    String? selectedAvatar = '📖';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          backgroundColor: AppColors.card,
          title: const Text('New Learner Profile',
            style: TextStyle(color: AppColors.textPrimary, fontSize: 17, fontWeight: FontWeight.w700)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Avatar picker
              Wrap(
                spacing: 8, runSpacing: 8,
                children: [
                  ('📖', 'Book'), ('🌙', 'Moon'), ('⭐', 'Star'), ('🌸', 'Flower'),
                  ('🕌', 'Mosque'), ('🦁', 'Lion'), ('🌿', 'Leaf'), ('🎯', 'Target'),
                  ('🏆', 'Trophy'), ('💫', 'Sparkle'),
                ].map((e) {
                  final emoji = e.$1;
                  final label = e.$2;
                  final selected = selectedAvatar == emoji;
                  // A bare GestureDetector+emoji gives VoiceOver/TalkBack no
                  // indication this is a tappable, selectable option — just
                  // the raw glyph's name read once with no "selected" state,
                  // so a screen reader user could not tell which avatar (if
                  // any) was currently chosen before saving the profile.
                  return Semantics(
                    button: true,
                    selected: selected,
                    label: '$label avatar',
                    child: GestureDetector(
                      onTap: () => setState(() => selectedAvatar = emoji),
                      child: Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          color: selected
                              ? AppColors.gold.withValues(alpha: 0.2)
                              : AppColors.border.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: selected ? AppColors.gold : Colors.transparent,
                            width: 2,
                          ),
                        ),
                        child: Center(
                          child: ExcludeSemantics(
                            child: Text(emoji, style: const TextStyle(fontSize: 20)),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: controller,
                autofocus: true,
                maxLength: 50,
                style: const TextStyle(color: AppColors.textPrimary),
                decoration: InputDecoration(
                  hintText: 'Learner name',
                  hintStyle: const TextStyle(color: AppColors.textMuted),
                  filled: true,
                  fillColor: AppColors.border.withValues(alpha: 0.3),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none,
                  ),
                  counterStyle: const TextStyle(color: AppColors.textMuted),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel', style: TextStyle(color: AppColors.textSecondary)),
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Add', style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );

    if (confirmed != true || !context.mounted) return;
    final name = controller.text.trim();
    if (name.isEmpty) return;

    final error = await ref.read(profilesProvider.notifier).createProfile(name, avatar: selectedAvatar);
    if (error != null && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: Colors.red));
    }
  }

  void _showEditSheet(BuildContext context, WidgetRef ref, ProfileModel profile, ProfilesState state) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => _ProfileEditSheet(profile: profile, state: state),
    );
  }
}

// ── Profile tile ──────────────────────────────────────────────────────────────

class _ProfileTile extends StatelessWidget {
  final ProfileModel profile;
  final bool managing;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  const _ProfileTile({
    required this.profile,
    required this.managing,
    required this.onTap,
    required this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        borderRadius: BorderRadius.circular(16),
        child: Column(
        children: [
          Stack(
            children: [
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(
                  color: profile.isActive
                      ? AppColors.gold.withValues(alpha: 0.2)
                      : AppColors.border.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: profile.isActive ? AppColors.gold : Colors.transparent,
                    width: 2.5,
                  ),
                ),
                child: Center(
                  child: profile.avatar != null && profile.avatar!.isNotEmpty
                      ? Text(profile.avatar!, style: const TextStyle(fontSize: 36))
                      : Text(
                          profile.displayName.isNotEmpty
                              ? profile.displayName[0].toUpperCase()
                              : '?',
                          style: const TextStyle(
                            fontSize: 32, color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                        ),
                ),
              ),
              if (managing)
                Positioned(
                  right: 0, top: 0,
                  child: Container(
                    width: 22, height: 22,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.border),
                    ),
                    child: const Icon(Icons.edit_rounded, size: 12, color: AppColors.gold),
                  ),
                )
              else if (profile.isActive)
                Positioned(
                  right: 4, bottom: 4,
                  child: Container(
                    width: 18, height: 18,
                    decoration: const BoxDecoration(
                      color: AppColors.gold,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check_rounded, size: 12, color: Colors.black),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            profile.displayName,
            style: TextStyle(
              color: profile.isActive ? AppColors.textPrimary : AppColors.textSecondary,
              fontSize: 13,
              fontWeight: profile.isActive ? FontWeight.w700 : FontWeight.w500,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
          if (profile.partsStudied > 0)
            Text(
              '${profile.partsStudied} parts',
              style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
            ),
        ],
        ),
      ),
    );
  }
}

class _AddProfileTile extends StatelessWidget {
  final VoidCallback onTap;
  const _AddProfileTile({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Column(
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                color: AppColors.border.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppColors.border.withValues(alpha: 0.5),
                  width: 2,
                  strokeAlign: BorderSide.strokeAlignInside,
                ),
              ),
              child: const Center(
                child: Icon(Icons.add_rounded, color: AppColors.textMuted, size: 32),
              ),
            ),
            const SizedBox(height: 8),
            const Text('Add Profile',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Edit bottom sheet ─────────────────────────────────────────────────────────

class _ProfileEditSheet extends ConsumerStatefulWidget {
  final ProfileModel profile;
  final ProfilesState state;
  const _ProfileEditSheet({required this.profile, required this.state});

  @override
  ConsumerState<_ProfileEditSheet> createState() => _ProfileEditSheetState();
}

class _ProfileEditSheetState extends ConsumerState<_ProfileEditSheet> {
  late final TextEditingController _nameCtrl;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.profile.displayName);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final canDelete = !widget.profile.isDefault && widget.state.profiles.length > 1;
    return Padding(
      // Audit H10 fix: MediaQuery.paddingOf(context).bottom alone can report
      // 0 on some Android devices even while the 3-button nav bar still
      // overlaps this sheet — bottomSystemInset() is the shared helper with
      // the fallback for exactly that case (viewInsets.bottom for the
      // keyboard is unaffected and kept as-is).
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom +
            bottomSystemInset(context),
        left: 20, right: 20, top: 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(width: 36, height: 4,
              decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
          ),
          const SizedBox(height: 18),
          Text('Edit Profile',
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 17, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          TextField(
            controller: _nameCtrl,
            maxLength: 50,
            style: const TextStyle(color: AppColors.textPrimary),
            decoration: InputDecoration(
              labelText: 'Name',
              labelStyle: const TextStyle(color: AppColors.textMuted),
              filled: true,
              fillColor: AppColors.border.withValues(alpha: 0.2),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none,
              ),
              counterStyle: const TextStyle(color: AppColors.textMuted),
            ),
          ),
          const SizedBox(height: 12),
          if (_loading)
            const Center(child: Padding(
              padding: EdgeInsets.all(16),
              child: CircularProgressIndicator.adaptive(strokeWidth: 2),
            ))
          else ...[
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _save,
                child: const Text('Save', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
            if (canDelete) ...[
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: const BorderSide(color: Colors.red),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: _confirmDelete,
                  child: const Text('Delete Profile'),
                ),
              ),
            ],
          ],
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Future<void> _save() async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) return;
    setState(() => _loading = true);
    final error = await ref.read(profilesProvider.notifier).renameProfile(widget.profile.id, name);
    if (!mounted) return;
    setState(() => _loading = false);
    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: Colors.red));
    } else {
      Navigator.pop(context);
    }
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.card,
        title: const Text('Delete Profile?',
          style: TextStyle(color: AppColors.textPrimary)),
        content: Text(
          'This will permanently delete "${widget.profile.displayName}" and all their progress.',
          style: const TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _loading = true);
    final error = await ref.read(profilesProvider.notifier).deleteProfile(widget.profile.id);
    if (!mounted) return;
    setState(() => _loading = false);
    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: Colors.red));
    } else {
      Navigator.pop(context);
    }
  }
}
