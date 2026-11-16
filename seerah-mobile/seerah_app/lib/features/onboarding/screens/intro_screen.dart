import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers/onboarding_provider.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/providers/app_theme_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/theme_options.dart';
import '../../../core/utils/system_insets.dart';
import '../../../l10n/app_strings.dart';

/// Forced, one-time intro funnel shown before the app is usable — see
/// onboarding_provider.dart for how app_router routes here and leaves.
///
/// Opens on a language picker — selecting one immediately calls
/// [CourseLangNotifier.setLang], which is the single source of truth every
/// `Text` in the app already watches (see localized_text.dart), so the
/// rest of this funnel AND the app itself switch language right away, not
/// just a label on this one screen. Then four feature pages (Salah/Adhan,
/// Quran, Seerah, 15 languages) and a forced theme-pick page.
///
/// Fresh installs get "Welcome" framing on the feature pages; a device
/// updating into this build gets the same pages with "What's new" framing
/// instead (same body copy either way — these ARE new to a returning user
/// too, since they're the whole reason this funnel exists). The theme page
/// at the end must be passed through before continuing — the user's
/// existing theme (if any) is already pre-selected, so "forced" means
/// "must see this screen," not "must pick something different."
class IntroScreen extends ConsumerStatefulWidget {
  const IntroScreen({super.key});

  @override
  ConsumerState<IntroScreen> createState() => _IntroScreenState();
}

class _IntroScreenState extends ConsumerState<IntroScreen> {
  final _controller = PageController();
  int _page = 0;

  static const _pageCount = 6; // 1 language + 4 feature pages + 1 theme page

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _next() {
    HapticFeedback.selectionClick();
    if (_page == _pageCount - 1) {
      _finish();
      return;
    }
    _controller.nextPage(
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
    );
  }

  void _back() {
    if (_page == 0) return;
    HapticFeedback.selectionClick();
    _controller.previousPage(
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
    );
  }

  Future<void> _finish() async {
    await markOnboardingIntroSeen(ref);
    if (!mounted) return;
    context.go('/salah');
  }

  @override
  Widget build(BuildContext context) {
    final isNewInstall = ref.watch(onboardingIsNewInstallProvider);
    final lang = ref.watch(courseLangProvider);
    final isLast = _page == _pageCount - 1;

    return PopScope(
      // Can't back out of the funnel to nowhere (there's nothing behind it
      // on the nav stack — it's the very first route) — the in-page Back
      // button is the only way to move backward, and only between pages.
      canPop: false,
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Column(
            children: [
              const SizedBox(height: 12),
              SizedBox(
                height: 20,
                child: _page == 0
                    ? null
                    : Text(
                        isNewInstall
                            ? 'Welcome to The Muslim Man'
                            : "What's New in This Update",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.1,
                        ),
                      ).animate().fadeIn(duration: 300.ms),
              ),
              const SizedBox(height: 14),
              _Dots(count: _pageCount, index: _page),
              Expanded(
                child: PageView(
                  controller: _controller,
                  physics: const NeverScrollableScrollPhysics(),
                  onPageChanged: (i) => setState(() => _page = i),
                  children: [
                    const _LanguagePage(),
                    _FeaturePage(
                      icon: Icons.access_time_filled_rounded,
                      iconColor: const Color(0xFF5AAE8A),
                      isNew: !isNewInstall,
                      title: 'Prayer Times & Adhan',
                      description:
                          'Accurate prayer times for your location, the '
                          'call to prayer when it\'s time, reminders, and '
                          'Qibla direction — all built in.',
                    ),
                    _FeaturePage(
                      icon: Icons.menu_book_rounded,
                      iconColor: const Color(0xFFD4A017),
                      isNew: !isNewInstall,
                      title: 'The Full Quran',
                      description:
                          'Read the Quran in Arabic with translation and '
                          'audio recitation, right inside the app.',
                    ),
                    _FeaturePage(
                      icon: Icons.auto_stories_outlined,
                      iconColor: const Color(0xFF5A90B0),
                      isNew: !isNewInstall,
                      title: 'The Seerah, Part by Part',
                      description:
                          'Walk through the life of the Prophet Muhammad ﷺ '
                          '— video, audio, text, quizzes, and more.',
                    ),
                    _FeaturePage(
                      icon: Icons.language_rounded,
                      iconColor: const Color(0xFFC5A3E8),
                      isNew: !isNewInstall,
                      title: '15 Languages',
                      description:
                          'Salah, Quran, and the Seerah are all available '
                          'in 15 languages, including Arabic, Urdu, French, '
                          'and more.',
                    ),
                    const _ThemePage(),
                  ],
                ),
              ),
              Padding(
                padding: EdgeInsets.fromLTRB(
                  24,
                  8,
                  24,
                  16 + bottomSystemInset(context),
                ),
                child: Row(
                  children: [
                    if (_page > 0)
                      TextButton(
                        onPressed: _back,
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.textMuted,
                        ),
                        child: Text(t(lang, 'back')),
                      ),
                    const Spacer(),
                    SizedBox(
                      width: 150,
                      child: ElevatedButton(
                        onPressed: _next,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 15),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          elevation: 0,
                          shadowColor: Colors.transparent,
                        ),
                        child: Text(
                          isLast ? 'Get Started' : t(lang, 'next'),
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Page indicator dots ──────────────────────────────────────────────────

class _Dots extends StatelessWidget {
  final int count;
  final int index;
  const _Dots({required this.count, required this.index});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(count, (i) {
        final active = i == index;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          margin: const EdgeInsets.symmetric(horizontal: 3),
          width: active ? 20 : 6,
          height: 6,
          decoration: BoxDecoration(
            color: active ? AppColors.gold : AppColors.border,
            borderRadius: BorderRadius.circular(3),
          ),
        );
      }),
    );
  }
}

// ── Feature page ──────────────────────────────────────────────────────────

class _FeaturePage extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final bool isNew;
  final String title;
  final String description;

  const _FeaturePage({
    required this.icon,
    required this.iconColor,
    required this.isNew,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isNew) ...[
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: AppColors.goldFaded,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
                ),
                child: Text(
                  'NEW',
                  style: TextStyle(
                    color: AppColors.gold,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
              const SizedBox(height: 22),
            ],
            Container(
              width: 84,
              height: 84,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.14),
                shape: BoxShape.circle,
                border: Border.all(color: iconColor.withValues(alpha: 0.3)),
              ),
              child: Icon(icon, color: iconColor, size: 38),
            ),
            const SizedBox(height: 28),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 23,
                fontWeight: FontWeight.w800,
                height: 1.25,
              ),
            ),
            const SizedBox(height: 14),
            Text(
              description,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14.5,
                height: 1.55,
              ),
            ),
          ],
        ),
      ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.05, end: 0),
    );
  }
}

// ── Language pick page ───────────────────────────────────────────────────

/// First page of the funnel. Selecting a language calls
/// [CourseLangNotifier.setLang] immediately — same call the Account/
/// Settings language switcher makes — so it's not just cosmetic on this
/// screen: every other `Text` in the app (including the rest of this very
/// funnel) re-renders in that language right away, and it's persisted the
/// same as any other language change. Defaults to whatever's already
/// selected (English on a fresh install), so — like the theme page —
/// "forced" means "must see this screen," not "must pick something else."
class _LanguagePage extends ConsumerWidget {
  const _LanguagePage();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(courseLangProvider);
    return Column(
      children: [
        const SizedBox(height: 8),
        Container(
          width: 84,
          height: 84,
          decoration: BoxDecoration(
            color: AppColors.gold.withValues(alpha: 0.14),
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
          ),
          child: Icon(
            Icons.language_rounded,
            color: AppColors.gold,
            size: 38,
          ),
        ),
        const SizedBox(height: 22),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            children: [
              Text(
                'Choose Your Language',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 23,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'The app will be shown in this language. You can always '
                'change it later in Settings.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
            itemCount: kCourseLangOptions.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final option = kCourseLangOptions[i];
              final isSelected = option.code == selected;
              return InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () {
                  HapticFeedback.selectionClick();
                  ref.read(courseLangProvider.notifier).setLang(option.code);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected ? AppColors.gold : AppColors.border,
                      width: isSelected ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Text(
                        option.flag,
                        style: const TextStyle(fontSize: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          option.label,
                          style: TextStyle(
                            color: isSelected
                                ? AppColors.gold
                                : AppColors.textPrimary,
                            fontSize: 14.5,
                            fontWeight: isSelected
                                ? FontWeight.w700
                                : FontWeight.w500,
                          ),
                        ),
                      ),
                      if (isSelected)
                        Icon(
                          Icons.check_circle_rounded,
                          color: AppColors.gold,
                          size: 20,
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// ── Theme pick page ──────────────────────────────────────────────────────

class _ThemePage extends ConsumerWidget {
  const _ThemePage();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(appThemeProvider);
    final lang = ref.watch(courseLangProvider);
    return Column(
      children: [
        const SizedBox(height: 8),
        Container(
          width: 84,
          height: 84,
          decoration: BoxDecoration(
            color: AppColors.gold.withValues(alpha: 0.14),
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
          ),
          child: Icon(Icons.palette_outlined, color: AppColors.gold, size: 38),
        ),
        const SizedBox(height: 22),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            children: [
              Text(
                'Make It Yours',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 23,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Pick a color theme to get started. You can always change '
                'it later in Settings.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
            child: GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: kAppThemeOptions.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 2.4,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
              ),
              itemBuilder: (context, i) {
                final option = kAppThemeOptions[i];
                final isSelected = option.id == selected;
                return InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () {
                    HapticFeedback.selectionClick();
                    ref.read(appThemeProvider.notifier).setTheme(option.id);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: option.background,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isSelected ? option.accent : option.cardNav,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            color: option.accent,
                            shape: BoxShape.circle,
                          ),
                          child: isSelected
                              ? Icon(
                                  Icons.check_rounded,
                                  size: 14,
                                  color:
                                      option.accent.computeLuminance() > 0.5
                                      ? Colors.black
                                      : Colors.white,
                                )
                              : null,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            t(lang, option.labelKey),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: option.mainText,
                              fontSize: 12,
                              fontWeight: isSelected
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}
