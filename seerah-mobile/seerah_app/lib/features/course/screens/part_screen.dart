import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/data/parts_data.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../widgets/video_tab.dart';
import '../widgets/read_tab.dart';
import '../widgets/flashcards_tab.dart';
import '../widgets/quiz_tab.dart';

class PartScreen extends ConsumerWidget {
  final int partNumber;
  const PartScreen({super.key, required this.partNumber});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final part = PARTS.firstWhere(
      (p) => p.partNumber == partNumber,
      orElse: () => PARTS.first,
    );
    final eraColor = AppColors.forEra(part.era);

    // Bug 3 fix: check access before rendering any paid content.
    // Part 1 is free; Parts 2-100 require a paid subscription.
    // This prevents all 4 tab widgets from mounting and firing API calls
    // for users who don't have access.
    final authState = ref.watch(authProvider);
    final isPaidPart = partNumber > 1;
    final hasAccess = authState.hasAccess;

    if (isPaidPart && !hasAccess) {
      return _PaywallScreen(
        partNumber: partNumber,
        eraColor: eraColor,
        partTitle: part.title,
      );
    }

    return DefaultTabController(
      length: 4,
      child: Scaffold(
        body: NestedScrollView(
          headerSliverBuilder: (ctx, _) => [
            SliverAppBar(
              expandedHeight: 160,
              pinned: true,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => context.pop(),
              ),
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        eraColor.withOpacity(0.2),
                        AppColors.background,
                      ],
                    ),
                  ),
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: eraColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: eraColor.withOpacity(0.4)),
                        ),
                        child: Text(
                          'Part $partNumber • ${_eraName(part.era)}',
                          style: TextStyle(color: eraColor, fontSize: 11, fontWeight: FontWeight.w500),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        part.title,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          height: 1.25,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        part.subtitle,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],
                  ),
                ),
              ),
              bottom: TabBar(
                tabs: const [
                  Tab(icon: Icon(Icons.play_circle_outline, size: 18), text: 'Watch'),
                  Tab(icon: Icon(Icons.menu_book_outlined, size: 18), text: 'Read'),
                  Tab(icon: Icon(Icons.style_outlined, size: 18), text: 'Cards'),
                  Tab(icon: Icon(Icons.quiz_outlined, size: 18), text: 'Quiz'),
                ],
                labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                unselectedLabelStyle: const TextStyle(fontSize: 11),
                indicatorColor: eraColor,
                labelColor: eraColor,
              ),
            ),
          ],
          body: TabBarView(
            children: [
              VideoTab(partNumber: partNumber),
              ReadTab(partNumber: partNumber),
              FlashcardsTab(partNumber: partNumber),
              QuizTab(partNumber: partNumber),
            ],
          ),
        ),
        bottomNavigationBar: _PartNavBar(partNumber: partNumber),
      ),
    );
  }

  String _eraName(String era) {
    final found = ERAS.where((e) => e.id == era).toList();
    return found.isNotEmpty ? found.first.name : era;
  }
}

// ── Paywall ──────────────────────────────────────────────────────────────────

class _PaywallScreen extends StatelessWidget {
  final int partNumber;
  final Color eraColor;
  final String partTitle;

  const _PaywallScreen({
    required this.partNumber,
    required this.eraColor,
    required this.partTitle,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: Text('Part $partNumber'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.goldFaded,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(Icons.lock_outline, size: 40, color: AppColors.gold),
              ),
              const SizedBox(height: 24),
              Text(
                partTitle,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              const Text(
                'This part requires a full-access subscription.\nUnlock all 100 parts of the Seerah course.',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                  height: 1.6,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => context.go('/pricing'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.gold,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'View Plans',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.pop(),
                child: const Text(
                  'Go Back',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Part navigation bar ───────────────────────────────────────────────────────

class _PartNavBar extends StatelessWidget {
  final int partNumber;
  const _PartNavBar({required this.partNumber});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          if (partNumber > 1)
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => context.pushReplacement('/part/${partNumber - 1}'),
                icon: const Icon(Icons.arrow_back, size: 16),
                label: const Text('Previous'),
              ),
            ),
          if (partNumber > 1) const SizedBox(width: 12),
          if (partNumber < 100)
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => context.pushReplacement('/part/${partNumber + 1}'),
                icon: const Text('Next'),
                label: const Icon(Icons.arrow_forward, size: 16),
              ),
            ),
        ],
      ),
    );
  }
}
