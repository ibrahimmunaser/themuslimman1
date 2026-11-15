import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/profile_avatar_button.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../l10n/app_strings.dart';
import '../widgets/continue_learning_card.dart';
import '../widgets/prophet_facts_section.dart';
import '../widgets/seerah_welcome_intro.dart';

/// First screen of the Seerah tab: free sample (when locked) plus the
/// four course destinations that used to live on the bottom bar.
///
/// A signed-out/guest visitor (no real account yet) also sees the
/// marketing "Complete Seerah" welcome content ([SeerahWelcomeIntro]) above
/// all of this — inline, with the bottom tabs still visible, rather than as
/// the old forced full-screen WelcomeScreen that used to gate the whole app
/// on launch (see app_router.dart). A real signed-in account skips straight
/// to the hub below, same as before.
class SeerahHubScreen extends ConsumerWidget {
  const SeerahHubScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(courseLangProvider);
    final auth = ref.watch(authProvider);
    final hasAccess = auth.hasAccess;
    final progressAsync = ref.watch(progressProvider);
    final showWelcomeIntro = !auth.isLoggedIn || auth.isAnonymous;
    // Signed-out/anonymous guests already get a "Watch the First Revelation
    // — Free" CTA inside SeerahWelcomeIntro above, which leads to the same
    // free-sample part. Showing the Free sample card too made that content
    // appear twice on the same first page, and made the welcome intro's CTA
    // feel redundant rather than like the one path in. Signed-in accounts
    // without access (showWelcomeIntro == false) still see this card as
    // their only route to the free sample.
    final showFreeSample = !hasAccess && !showWelcomeIntro;

    final items = [
      (
        Icons.menu_book_rounded,
        t(lang, 'lessons'),
        '/lessons',
        AppColors.gold,
      ),
      (
        Icons.folder_rounded,
        t(lang, 'resources'),
        '/resources',
        const Color(0xFF5A90B0),
      ),
      (
        Icons.library_books_rounded,
        t(lang, 'references'),
        '/reference',
        const Color(0xFF4AA87E),
      ),
      (
        Icons.insights_rounded,
        t(lang, 'navProgress'),
        '/progress',
        const Color(0xFFB08040),
      ),
    ];

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text(t(lang, 'navSeerah')),
        // Language switching already lives on the Account page
        // (AppLangSwitcherRow), so no need to duplicate it here too.
        actions: const [ProfileAvatarButton()],
      ),
      body: AppGradientBackground(
        child: SafeArea(
          bottom: false,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (showWelcomeIntro) ...[
                  const SeerahWelcomeIntro(),
                  const SizedBox(height: 28),
                ],
                if (showFreeSample) ...[
                  Text(
                    t(lang, 'freeSample'),
                    style: TextStyle(
                      color: AppColors.gold,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 10),
                  ContinueLearningCard(
                    hasAccess: hasAccess,
                    progressAsync: progressAsync,
                    lang: lang,
                  ),
                  const SizedBox(height: 18),
                ],
                // Lessons/Resources/References/Progress (and the facts
                // section below) are course navigation — meaningless without
                // an account, and would otherwise sit right under the
                // welcome intro's own "Already have access? Sign in" link as
                // if they were already unlocked. Signed-in accounts (with or
                // without purchased access) still see them as before.
                if (!showWelcomeIntro) ...[
                  for (var i = 0; i < items.length; i++) ...[
                    if (i > 0) const SizedBox(height: 12),
                    SizedBox(
                      height: 76,
                      child: _HubTile(item: items[i], highlight: i == 0),
                    ),
                  ],
                  const SizedBox(height: 20),
                  ProphetFactsSection(lang: lang),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _HubTile extends StatelessWidget {
  const _HubTile({required this.item, this.highlight = false});

  final (IconData, String, String, Color) item;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push(item.$3),
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: AppDecorations.card(
            borderColor: highlight ? AppColors.gold : Colors.white24,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: item.$4.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(item.$1, color: item.$4, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  item.$2,
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const Icon(Icons.chevron_right_rounded,
                  color: Colors.white54, size: 24),
            ],
          ),
        ),
      ),
    );
  }
}
