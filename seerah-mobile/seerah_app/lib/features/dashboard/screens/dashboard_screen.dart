import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/data/parts_data.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_colors.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.user;
    final hasAccess = auth.hasAccess;
    final firstName = _firstName(user?.name);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Image.asset('assets/images/logo.png', height: 28, errorBuilder: (_, __, ___) =>
              const Text('☾', style: TextStyle(fontSize: 22, color: AppColors.gold))),
            const SizedBox(width: 8),
            const Text('Complete Seerah'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () => context.push('/profile'),
            tooltip: 'Profile',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Welcome header
          _WelcomeCard(firstName: firstName, hasAccess: hasAccess)
              .animate().fadeIn(duration: 400.ms).slideY(begin: -0.05, end: 0),

          const SizedBox(height: 16),

          // Stats row
          _StatsRow().animate(delay: 100.ms).fadeIn(duration: 400.ms),

          const SizedBox(height: 20),

          // Continue learning
          _SectionTitle('Continue Learning'),
          const SizedBox(height: 10),
          _ContinueLearningCard(hasAccess: hasAccess)
              .animate(delay: 150.ms).fadeIn(duration: 400.ms),

          const SizedBox(height: 20),

          // Quick access
          _SectionTitle('Quick Access'),
          const SizedBox(height: 10),
          _QuickAccessGrid()
              .animate(delay: 200.ms).fadeIn(duration: 400.ms),

          const SizedBox(height: 20),

          // Upgrade banner (free users only)
          if (!hasAccess) ...[
            _UpgradeBanner()
                .animate(delay: 250.ms).fadeIn(duration: 400.ms),
            const SizedBox(height: 20),
          ],

          // Recent parts
          _SectionTitle('All 8 Eras'),
          const SizedBox(height: 10),
          _EraOverviewList(hasAccess: hasAccess)
              .animate(delay: 300.ms).fadeIn(duration: 400.ms),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  String _firstName(String? name) {
    if (name == null || name.isEmpty) return 'Student';
    return name.trim().split(' ').first;
  }
}

// ── Welcome Card ──────────────────────────────────────────────────────────────

class _WelcomeCard extends StatelessWidget {
  final String firstName;
  final bool hasAccess;
  const _WelcomeCard({required this.firstName, required this.hasAccess});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.goldFaded, AppColors.surface],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.gold.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'As-salamu alaykum, $firstName ✦',
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            hasAccess
                ? 'Continue your journey through the Seerah of the Prophet ﷺ'
                : 'Part 1 is free — begin the life of the Prophet ﷺ today',
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Stats Row ─────────────────────────────────────────────────────────────────

class _StatsRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final stats = [
      {'value': '100', 'label': 'Parts'},
      {'value': '8',   'label': 'Eras'},
      {'value': '1,400+', 'label': 'Years'},
      {'value': '∞',   'label': 'Lessons'},
    ];

    return Row(
      children: stats.map((s) => Expanded(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              Text(s['value']!, style: const TextStyle(
                color: AppColors.gold,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              )),
              const SizedBox(height: 2),
              Text(s['label']!, style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 10,
                fontWeight: FontWeight.w500,
              )),
            ],
          ),
        ),
      )).toList(),
    );
  }
}

// ── Continue Learning Card ────────────────────────────────────────────────────

class _ContinueLearningCard extends StatelessWidget {
  final bool hasAccess;
  const _ContinueLearningCard({required this.hasAccess});

  @override
  Widget build(BuildContext context) {
    final part = PARTS.first; // Start with Part 1 for simplicity
    final eraColor = AppColors.forEra(part.era);

    return GestureDetector(
      onTap: () => context.push('/part/1'),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: eraColor.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(
                color: eraColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: eraColor.withOpacity(0.4)),
              ),
              child: Center(
                child: Text('1',
                  style: TextStyle(color: eraColor, fontSize: 18, fontWeight: FontWeight.w800)),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Start Here — Part 1 is Free',
                    style: TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(part.title,
                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text(part.subtitle,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                ],
              ),
            ),
            const Icon(Icons.play_circle_outline, color: AppColors.gold, size: 28),
          ],
        ),
      ),
    );
  }
}

// ── Quick Access Grid ─────────────────────────────────────────────────────────

class _QuickAccessGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final items = [
      {'icon': Icons.menu_book_outlined, 'label': 'All Lessons', 'route': '/course'},
      {'icon': Icons.folder_outlined, 'label': 'Resources', 'route': '/resources'},
      {'icon': Icons.library_books_outlined, 'label': 'Reference', 'route': '/reference'},
      {'icon': Icons.bar_chart_outlined, 'label': 'My Progress', 'route': '/progress'},
    ];

    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 2.5,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: items.map((item) {
        return GestureDetector(
          onTap: () => context.go(item['route'] as String),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                Icon(item['icon'] as IconData, color: AppColors.gold, size: 20),
                const SizedBox(width: 10),
                Text(item['label'] as String,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  )),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ── Upgrade Banner ────────────────────────────────────────────────────────────

class _UpgradeBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.goldDark.withOpacity(0.3), AppColors.goldFaded],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.gold.withOpacity(0.4)),
      ),
      child: Row(
        children: [
          const Icon(Icons.star, color: AppColors.gold, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('Unlock All 100 Parts',
                  style: TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w700)),
                SizedBox(height: 2),
                Text('Get lifetime access to the full Seerah course',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
          TextButton(
            onPressed: () => context.go('/pricing'),
            style: TextButton.styleFrom(
              backgroundColor: AppColors.gold,
              foregroundColor: AppColors.background,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text('View Plans', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

// ── Era Overview List ─────────────────────────────────────────────────────────

class _EraOverviewList extends StatelessWidget {
  final bool hasAccess;
  const _EraOverviewList({required this.hasAccess});

  @override
  Widget build(BuildContext context) {
    final groups = getEraGroups();
    return Column(
      children: groups.asMap().entries.map((entry) {
        final i = entry.key;
        final group = entry.value;
        final era = group['era'] as dynamic;
        final parts = group['parts'] as List;
        final color = AppColors.forEra(era.id as String);

        return GestureDetector(
          onTap: () => context.go('/course'),
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                Container(
                  width: 4, height: 40,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Era ${i + 1}: ${era.name}',
                        style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 2),
                      Text('${parts.length} parts',
                        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: AppColors.textMuted, size: 18),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(text, style: const TextStyle(
      color: AppColors.textPrimary,
      fontSize: 16,
      fontWeight: FontWeight.w700,
    ));
  }
}
