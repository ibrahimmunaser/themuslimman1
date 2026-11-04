import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/part_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/system_insets.dart';
import '../../l10n/app_strings.dart';

class AppShell extends ConsumerWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  int _currentIndex(BuildContext context) {
    final loc = GoRouterState.of(context).uri.path;
    if (loc.startsWith('/dashboard')) return 0;
    if (loc.startsWith('/course')) return 1;
    if (loc.startsWith('/resources')) return 2;
    if (loc.startsWith('/reference')) return 3;
    if (loc.startsWith('/progress')) return 4;
    // Pricing isn't one of the 5 primary tabs — it used to fall under
    // "Lessons" (index 1), which wrongly implied the user was viewing course
    // content while actually looking at a paywall/upsell screen. Fall
    // through to the neutral Home tab instead of a misleading selection.
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(courseLangProvider);
    final auth = ref.watch(authProvider);
    final hasAccess = auth.hasAccess;
    final idx = _currentIndex(context);
    final width = MediaQuery.sizeOf(context).width;
    final compact = width < 380;
    // Labels are hidden in compact mode, so only the fixed-size icon governs
    // height there. When labels are shown, grow the bar with Dynamic Type so
    // scaled label text (up to the app's 1.3x ceiling) doesn't get clipped.
    final textScale = MediaQuery.textScalerOf(context).scale(1.0);
    final navHeight = compact
        ? 60.0
        : 64.0 + (textScale - 1.0).clamp(0.0, 0.3) * 20;

    return Scaffold(
      body: child,
      bottomNavigationBar: RepaintBoundary(
        child: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.surface.withValues(alpha: 0.88),
                border: const Border(
                  top: BorderSide(color: AppColors.border, width: 0.5),
                ),
              ),
              // iPhone has no software buttons, only a thin home indicator drawn
              // over the bar. Lifting the tabs there leaves an empty band.
              // Android's 3-button bar covers the labels, so only Android
              // gets the inset. NavigationBar's own SafeArea stays removed
              // so it cannot add a second gap.
              //
              // NavigationBar's `build()` wraps its content in a bare
              // `SafeArea(...)` that protects ALL FOUR sides by default, not
              // just the bottom. Only ever stripping `removeBottom` here left
              // the ambient status-bar `MediaQuery.padding.top` (~24-55dp
              // depending on device) intact, so that SafeArea kept inserting
              // it as blank space ABOVE the icon row every time — this was
              // the actual, long-recurring "empty space above the tab bar"
              // bug (confirmed live via Flutter's debugPaint on a Pixel 9
              // emulator: the gap's height matched the status bar exactly).
              // Stripping all four sides removes every such reservation.
              child: Padding(
                padding: EdgeInsets.only(bottom: _androidNavInset(context)),
                child: MediaQuery.removePadding(
                  context: context,
                  removeTop: true,
                  removeBottom: true,
                  removeLeft: true,
                  removeRight: true,
                  child: NavigationBarTheme(
                    data: NavigationBarThemeData(
                      height: navHeight,
                      backgroundColor: Colors.transparent,
                      indicatorColor: AppColors.gold.withValues(alpha: 0.14),
                      indicatorShape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      labelTextStyle: WidgetStateProperty.resolveWith((states) {
                        final selected = states.contains(WidgetState.selected);
                        return TextStyle(
                          fontSize: compact ? 10 : 10.5,
                          fontWeight: selected
                              ? FontWeight.w700
                              : FontWeight.w500,
                          color: selected
                              ? AppColors.gold
                              : AppColors.textMuted,
                        );
                      }),
                      iconTheme: WidgetStateProperty.resolveWith((states) {
                        final selected = states.contains(WidgetState.selected);
                        return IconThemeData(
                          size: compact ? 22 : 23,
                          color: selected
                              ? AppColors.gold
                              : AppColors.textMuted,
                        );
                      }),
                    ),
                    child: NavigationBar(
                      selectedIndex: idx,
                      onDestinationSelected: (i) {
                        HapticFeedback.selectionClick();
                        // Home (0) is always free — Part 15's "First
                        // Revelation" CTA on the dashboard is enough for a
                        // new user. Every other tab requires a plan.
                        if (i != 0 && !hasAccess) {
                          showLockedNavDialog(context, ref, lang);
                          return;
                        }
                        switch (i) {
                          case 0:
                            context.go('/dashboard');
                            break;
                          case 1:
                            context.go('/course');
                            break;
                          case 2:
                            context.go('/resources');
                            break;
                          case 3:
                            context.go('/reference');
                            break;
                          case 4:
                            context.go('/progress');
                            break;
                        }
                      },
                      labelBehavior: compact
                          ? NavigationDestinationLabelBehavior.alwaysHide
                          : NavigationDestinationLabelBehavior.alwaysShow,
                      destinations: [
                        NavigationDestination(
                          icon: const Icon(Icons.home_outlined),
                          selectedIcon: const Icon(
                            Icons.home_rounded,
                            color: AppColors.gold,
                          ),
                          label: t(lang, 'navHome'),
                          tooltip: t(lang, 'navHome'),
                        ),
                        NavigationDestination(
                          icon: const Icon(Icons.menu_book_outlined),
                          selectedIcon: const Icon(
                            Icons.menu_book_rounded,
                            color: AppColors.gold,
                          ),
                          label: t(lang, 'navLessons'),
                          tooltip: t(lang, 'navLessons'),
                        ),
                        NavigationDestination(
                          icon: const Icon(Icons.folder_outlined),
                          selectedIcon: const Icon(
                            Icons.folder_rounded,
                            color: AppColors.gold,
                          ),
                          label: t(lang, 'navResources'),
                          tooltip: t(lang, 'navResources'),
                        ),
                        NavigationDestination(
                          icon: const Icon(Icons.library_books_outlined),
                          selectedIcon: const Icon(
                            Icons.library_books_rounded,
                            color: AppColors.gold,
                          ),
                          label: t(lang, 'navReference'),
                          tooltip: t(lang, 'navReference'),
                        ),
                        NavigationDestination(
                          icon: const Icon(Icons.insights_outlined),
                          selectedIcon: const Icon(
                            Icons.insights_rounded,
                            color: AppColors.gold,
                          ),
                          label: t(lang, 'navProgress'),
                          tooltip: t(lang, 'navProgress'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Space the tab labels need to clear Android's system navigation buttons.
/// iOS returns 0 so the bar stays on the screen edge.
double _androidNavInset(BuildContext context) {
  if (defaultTargetPlatform != TargetPlatform.android) return 0;
  return bottomSystemInset(context);
}

/// Shown when a user with no active plan taps Lessons/Resources/Reference/
/// Progress — from the bottom nav OR the dashboard's Quick Access grid, both
/// of which lead to the same screens. Those tabs are fully gated (not just
/// their individual locked content) behind a plan. Home (and Part 15 from
/// it) stays free so a brand-new user still has something to do immediately.
void showLockedNavDialog(BuildContext context, WidgetRef ref, String lang) {
  showDialog<void>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      icon: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: AppColors.gold.withValues(alpha: 0.12),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.lock_outline_rounded, color: AppColors.gold),
      ),
      title: Text(
        t(lang, 'unlockFullAccess'),
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w700,
        ),
      ),
      content: Text(
        t(lang, 'lockedNavBody'),
        textAlign: TextAlign.center,
        style: const TextStyle(color: AppColors.textSecondary, height: 1.5),
      ),
      actionsAlignment: MainAxisAlignment.center,
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: Text(t(lang, 'cancel'),
              style: const TextStyle(color: AppColors.textMuted)),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.gold,
            foregroundColor: Colors.black,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          onPressed: () {
            Navigator.of(dialogContext).pop();
            final isLoggedIn = ref.read(authProvider).isLoggedIn;
            context.push(isLoggedIn ? '/pricing' : '/landing');
          },
          child: Text(t(lang, 'viewPlans')),
        ),
      ],
    ),
  );
}
