import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/data/parts_data.dart';
import '../../../core/models/part_model.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/profiles_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_logo.dart';
import '../../../core/widgets/ui_kit.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.user;
    final hasAccess = auth.hasAccess;
    final firstName = _firstName(user?.name);
    final progressAsync = ref.watch(progressProvider);
    final profilesState = ref.watch(profilesProvider).valueOrNull;
    final activeProfile = profilesState?.activeProfile;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        titleSpacing: 16,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const AppLogo(size: 28, borderRadius: 8),
            const SizedBox(width: 10),
            const Text('Complete Seerah'),
          ],
        ),
        actions: [
          // Profile switcher — taps go directly to profile picker if multi-profile
          GestureDetector(
            onTap: () {
              if (profilesState != null && profilesState.hasMultipleProfiles) {
                context.push('/profiles');
              } else {
                context.push('/profile');
              }
            },
            child: Container(
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.card,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.border),
              ),
              child: activeProfile?.avatar != null && activeProfile!.avatar!.isNotEmpty
                  ? Text(activeProfile.avatar!,
                      style: const TextStyle(fontSize: 16),
                      textAlign: TextAlign.center)
                  : const Icon(Icons.person_outline_rounded, size: 20, color: AppColors.textPrimary),
            ),
          ),
        ],
      ),
      body: AppGradientBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(0, 4, 0, 32),
            children: [
              // ── Welcome hero ───────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: _WelcomeCard(firstName: firstName, hasAccess: hasAccess)
                    .animate().fadeIn(duration: 400.ms).slideY(begin: -0.05, end: 0),
              ),

              // ── At-a-glance stats strip ────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: progressAsync.when(
                    loading: () => Row(children: [
                      _InlineStat(value: '100', label: 'Parts', color: AppColors.gold),
                      _StatDivider(),
                      const _InlineStat(value: '8', label: 'Eras', color: AppColors.success),
                      _StatDivider(),
                      const _InlineStat(value: '8', label: 'Resources', color: Color(0xFF5A90B0)),
                      _StatDivider(),
                      const _InlineStat(value: '∞', label: 'Reference', color: Color(0xFF4AA87E)),
                    ]),
                    error: (_, __) => Row(children: [
                      _InlineStat(value: '100', label: 'Parts', color: AppColors.gold),
                      _StatDivider(),
                      const _InlineStat(value: '8', label: 'Eras', color: AppColors.success),
                      _StatDivider(),
                      const _InlineStat(value: '8', label: 'Resources', color: Color(0xFF5A90B0)),
                      _StatDivider(),
                      const _InlineStat(value: '∞', label: 'Reference', color: Color(0xFF4AA87E)),
                    ]),
                    data: (progress) => Row(
                      children: [
                        _InlineStat(
                          value: '${progress.totalViewed}',
                          label: 'Studied',
                          color: AppColors.gold,
                        ),
                        _StatDivider(),
                        _InlineStat(
                          value: '${progress.totalCompleted}',
                          label: 'Completed',
                          color: AppColors.success,
                        ),
                        _StatDivider(),
                        const _InlineStat(value: '8', label: 'Resources', color: Color(0xFF5A90B0)),
                        _StatDivider(),
                        const _InlineStat(value: '∞', label: 'Reference', color: Color(0xFF4AA87E)),
                      ],
                    ),
                  ),
                ).animate(delay: 70.ms).fadeIn(duration: 400.ms),
              ),

              // ── Continue learning ──────────────────────────────────────────
              const SectionHeader(
                title: 'Continue Learning',
                subtitle: 'Pick up where you left off',
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _ContinueLearningCard(hasAccess: hasAccess, progressAsync: progressAsync)
                    .animate(delay: 120.ms).fadeIn(duration: 400.ms),
              ),

              // ── Quick access ───────────────────────────────────────────────
              const SectionHeader(title: 'Quick Access'),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _QuickAccessGrid()
                    .animate(delay: 160.ms).fadeIn(duration: 400.ms),
              ),

              // ── Upgrade prompt ─────────────────────────────────────────────
              if (!hasAccess) ...[
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _UpgradeBanner()
                      .animate(delay: 200.ms).fadeIn(duration: 400.ms),
                ),
              ],

              // ── Era overview ───────────────────────────────────────────────
              const SectionHeader(
                title: 'Course Overview',
                subtitle: 'All 8 eras of the Seerah',
              ),
              _EraOverviewList(hasAccess: hasAccess)
                  .animate(delay: 240.ms).fadeIn(duration: 400.ms),
            ],
          ),
        ),
      ),
    );
  }

  String _firstName(String? name) {
    if (name == null || name.isEmpty) return 'Student';
    return name.trim().split(' ').first;
  }
}

// ── Welcome hero card ─────────────────────────────────────────────────────────

class _WelcomeCard extends StatelessWidget {
  final String firstName;
  final bool hasAccess;
  const _WelcomeCard({required this.firstName, required this.hasAccess});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: AppDecorations.goldHero(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const GoldBadge('Complete Seerah'),
              const Spacer(),
              Text('✦',
                  style: TextStyle(
                    color: AppColors.gold.withValues(alpha: 0.3),
                    fontSize: 20,
                  )),
            ],
          ),
          const SizedBox(height: 16),
          Text('As-salamu alaykum,',
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              )),
          const SizedBox(height: 2),
          Text(firstName,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 28,
                fontWeight: FontWeight.w800,
                height: 1.0,
                letterSpacing: -0.6,
              )),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Text(
                  hasAccess
                      ? 'Continue your journey through the life of the Prophet ﷺ.'
                      : 'Part 1 is free — begin the Seerah today.',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                    height: 1.45,
                  ),
                ),
              ),
              if (hasAccess) ...[
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.check_circle_rounded, color: AppColors.success, size: 11),
                      SizedBox(width: 3),
                      Text('Full Access',
                          style: TextStyle(
                              color: AppColors.success,
                              fontSize: 10,
                              fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

// ── Continue learning card ────────────────────────────────────────────────────

class _ContinueLearningCard extends StatelessWidget {
  final bool hasAccess;
  final AsyncValue<ProgressState> progressAsync;
  const _ContinueLearningCard({required this.hasAccess, required this.progressAsync});

  @override
  Widget build(BuildContext context) {
    // Use the last visited part from progress; fall back to Part 1 for new users.
    final lastPartNumber = progressAsync.valueOrNull?.lastPartNumber ?? 1;
    final partNum = lastPartNumber.clamp(1, PARTS.length);
    // Determine which part to show next: if user visited lastPart and has
    // access, suggest the next one (unless they're at the last part).
    final isFirstVisit = progressAsync.valueOrNull?.totalViewed == 0;
    final nextPartNum = (!isFirstVisit && hasAccess && partNum < PARTS.length)
        ? partNum + 1
        : partNum;
    final PartModel nextPart = PARTS.firstWhere(
      (p) => p.partNumber == nextPartNum,
      orElse: () => PARTS.first,
    );
    final nextEraColor = AppColors.forEra(nextPart.era);

    final label = isFirstVisit
        ? (hasAccess ? 'Start here' : 'Free — Start Here')
        : (nextPartNum == partNum ? 'Continue' : 'Up next');

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push('/part/$nextPartNum'),
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: AppDecorations.eraAccent(nextEraColor),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: nextEraColor.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: nextEraColor.withValues(alpha: 0.4)),
                ),
                child: Center(
                  child: Text('$nextPartNum',
                    style: TextStyle(color: nextEraColor, fontSize: 20, fontWeight: FontWeight.w800)),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$label — ${nextPart.era}',
                      style: const TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 4),
                    Text(nextPart.title,
                      style: const TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w700),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 2),
                    Text(nextPart.subtitle,
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.gold.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
                ),
                child: const Icon(Icons.play_arrow_rounded, color: AppColors.gold, size: 20),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Quick access grid ─────────────────────────────────────────────────────────

class _QuickAccessGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.menu_book_rounded, 'Lessons', '/course', AppColors.gold),
      (Icons.folder_rounded, 'Resources', '/resources', const Color(0xFF5A90B0)),
      (Icons.library_books_rounded, 'Reference', '/reference', const Color(0xFF4AA87E)),
      (Icons.insights_rounded, 'My Progress', '/progress', const Color(0xFFB08040)),
    ];

    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 2.1,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: items.map((item) {
        return Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => context.go(item.$3),
            borderRadius: BorderRadius.circular(14),
              child: Ink(
                  decoration: AppDecorations.card(borderColor: item.$4.withValues(alpha: 0.25)),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: item.$4.withValues(alpha: 0.14),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(item.$1, color: item.$4, size: 20),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(item.$2,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 2,
                        ),
                      ),
                      Icon(Icons.arrow_forward_ios_rounded,
                          color: item.$4.withValues(alpha: 0.45), size: 11),
                    ],
                  ),
                ),
          ),
        );
      }).toList(),
    );
  }
}

// ── Inline stat helpers ───────────────────────────────────────────────────────

class _InlineStat extends StatelessWidget {
  final String value;
  final String label;
  final Color color;
  const _InlineStat({required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(value,
            style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 3),
          Text(label,
            style: const TextStyle(
              color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _StatDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(width: 1, height: 30, color: AppColors.border);
  }
}

// ── Upgrade banner ────────────────────────────────────────────────────────────

class _UpgradeBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppDecorations.goldHero(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.gold.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.lock_open_rounded, color: AppColors.gold, size: 20),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text('Unlock All 100 Parts',
                  style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Text(
            'Get lifetime access to the full Seerah course — videos, reading notes, flashcards, and quizzes for every part.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => context.go('/pricing'),
              child: const Text('View Plans'),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Era overview list ─────────────────────────────────────────────────────────

class _EraOverviewList extends StatelessWidget {
  final bool hasAccess;
  const _EraOverviewList({required this.hasAccess});

  @override
  Widget build(BuildContext context) {
    final groups = getEraGroups();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Column(
          children: groups.asMap().entries.map((entry) {
            final i = entry.key;
            final isLast = i == groups.length - 1;
            final group = entry.value;
            final era = group['era'] as EraModel;
            final parts = group['parts'] as List;
            final color = AppColors.forEra(era.id);
            return Column(
              children: [
                Material(
                  color: AppColors.card,
                  child: InkWell(
                    onTap: () => context.go('/course'),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 13),
                      child: Row(
                        children: [
                          Container(
                            width: 36, height: 36,
                            decoration: BoxDecoration(
                              color: color.withValues(alpha: 0.16),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(
                              child: Text('${i + 1}',
                                style: TextStyle(
                                  color: color, fontSize: 14,
                                  fontWeight: FontWeight.w800)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(era.name,
                                  style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text('${parts.length} parts',
                                  style: TextStyle(
                                    color: color, fontSize: 12,
                                    fontWeight: FontWeight.w500)),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right_rounded,
                            color: AppColors.textMuted, size: 18),
                        ],
                      ),
                    ),
                  ),
                ),
                if (!isLast)
                  const Divider(height: 1, thickness: 1,
                    color: AppColors.border, indent: 64),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }
}
