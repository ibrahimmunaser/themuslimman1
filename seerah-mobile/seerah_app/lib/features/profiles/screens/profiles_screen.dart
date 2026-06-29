import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/profile_model.dart';
import '../../../core/providers/profiles_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui_kit.dart';

// ── Profile picker (Netflix-style) ────────────────────────────────────────────

class ProfilesScreen extends ConsumerWidget {
  const ProfilesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profilesAsync = ref.watch(profilesProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Who\'s Learning?'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/profile-settings'),
            tooltip: 'Manage profiles',
          ),
        ],
      ),
      body: AppGradientBackground(
        child: SafeArea(
          child: profilesAsync.when(
            data: (state) => _buildGrid(context, ref, state),
            loading: () => const Center(child: CircularProgressIndicator()),
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

  Widget _buildGrid(BuildContext context, WidgetRef ref, ProfilesState state) {
    final profiles = state.profiles;
    final items = [
      ...profiles,
      if (state.canAddMore) null, // null = "Add Profile" slot
    ];

    return Column(
      children: [
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
                onTap: () => _selectProfile(context, ref, profile),
                onLongPress: () => _showEditSheet(context, ref, profile, state),
              ).animate().fadeIn(duration: 300.ms, delay: (i * 60).ms);
            },
          ),
        ),

        // Family plan upsell if on individual plan
        if (!state.canAddMore && state.profileLimit == 1)
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
            child: GestureDetector(
              onTap: () => context.go('/pricing'),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.goldFaded,
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
                    const Icon(Icons.chevron_right_rounded, color: AppColors.gold, size: 20),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }

  Future<void> _selectProfile(
      BuildContext context, WidgetRef ref, ProfileModel profile) async {
    if (profile.isActive) {
      // Already active — just go back
      if (context.canPop()) context.pop();
      else context.go('/home');
      return;
    }

    final error = await ref.read(profilesProvider.notifier).switchProfile(profile.id);
    if (error != null && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: Colors.red));
      return;
    }

    // Refresh progress after switching
    ref.invalidate(progressProvider);

    if (!context.mounted) return;
    if (context.canPop()) context.pop();
    else context.go('/home');
  }

  Future<void> _showAddDialog(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController();
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
                children: ['📖', '🌙', '⭐', '🌸', '🕌', '🦁', '🌿', '🎯', '🏆', '💫']
                    .map((e) => GestureDetector(
                      onTap: () => setState(() => selectedAvatar = e),
                      child: Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(
                          color: selectedAvatar == e
                              ? AppColors.gold.withValues(alpha: 0.2)
                              : AppColors.border.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: selectedAvatar == e ? AppColors.gold : Colors.transparent,
                            width: 2,
                          ),
                        ),
                        child: Center(child: Text(e, style: const TextStyle(fontSize: 20))),
                      ),
                    ))
                    .toList(),
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
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  const _ProfileTile({required this.profile, required this.onTap, required this.onLongPress});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      onLongPress: onLongPress,
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
              if (profile.isActive)
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
    );
  }
}

class _AddProfileTile extends StatelessWidget {
  final VoidCallback onTap;
  const _AddProfileTile({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
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
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
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
              child: CircularProgressIndicator(strokeWidth: 2),
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
