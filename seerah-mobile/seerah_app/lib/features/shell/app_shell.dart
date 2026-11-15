import 'package:seerah_app/l10n/salah_phrases.dart';
import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
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
    if (loc.startsWith('/salah')) return 0;
    if (loc.startsWith('/quran')) return 1;
    if (loc.startsWith('/account')) return 3;
    // Seerah (hub, lessons, resources, references, progress, pricing and
    // any other non-tab shell route) is the default tab.
    return 2;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(courseLangProvider);
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
                border: Border(
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
                      iconTheme: WidgetStateProperty.all(
                        IconThemeData(
                          size: compact ? 22 : 23,
                          color: AppColors.gold,
                        ),
                      ),
                    ),
                    child: NavigationBar(
                      selectedIndex: idx,
                      onDestinationSelected: (i) {
                        HapticFeedback.selectionClick();
                        // All four tabs are free to open. Seerah still
                        // paywalls individual parts (except the sample);
                        // Home / Quran / Salah stay fully usable without
                        // a plan.
                        switch (i) {
                          case 0:
                            context.go('/salah');
                            break;
                          case 1:
                            context.go('/quran');
                            break;
                          case 2:
                            context.go('/course');
                            break;
                          case 3:
                            context.go('/account');
                            break;
                        }
                      },
                      labelBehavior: compact
                          ? NavigationDestinationLabelBehavior.alwaysHide
                          : NavigationDestinationLabelBehavior.alwaysShow,
                      destinations: [
                        NavigationDestination(
                          icon: const Icon(Icons.mosque_outlined),
                          selectedIcon: Icon(
                            Icons.mosque_rounded,
                            color: AppColors.gold,
                          ),
                          label: translateSalah(lang, t(lang, 'navSalah')),
                          tooltip: translateSalah(lang, t(lang, 'navSalah')),
                        ),
                        NavigationDestination(
                          icon: const Icon(Icons.auto_stories_outlined),
                          selectedIcon: Icon(
                            Icons.auto_stories_rounded,
                            color: AppColors.gold,
                          ),
                          label: translateSalah(lang, t(lang, 'navQuran')),
                          tooltip: translateSalah(lang, t(lang, 'navQuran')),
                        ),
                        NavigationDestination(
                          icon: const Icon(Icons.menu_book_outlined),
                          selectedIcon: Icon(
                            Icons.menu_book_rounded,
                            color: AppColors.gold,
                          ),
                          label: t(lang, 'navSeerah'),
                          tooltip: t(lang, 'navSeerah'),
                        ),
                        NavigationDestination(
                          icon: const Icon(Icons.person_outline_rounded),
                          selectedIcon: Icon(
                            Icons.person_rounded,
                            color: AppColors.gold,
                          ),
                          label: t(lang, 'account'),
                          tooltip: t(lang, 'account'),
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
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: AppColors.gold, width: 1),
      ),
      icon: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: AppColors.gold.withValues(alpha: 0.12),
          shape: BoxShape.circle,
        ),
        child: Icon(Icons.lock_outline_rounded, color: AppColors.gold),
      ),
      title: Text(
        t(lang, 'unlockFullAccess'),
        textAlign: TextAlign.center,
        style: TextStyle(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w700,
        ),
      ),
      content: Text(
        t(lang, 'lockedNavBody'),
        textAlign: TextAlign.center,
        style: TextStyle(color: AppColors.textSecondary, height: 1.5),
      ),
      actionsAlignment: MainAxisAlignment.center,
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: Text(t(lang, 'cancel'),
              style: TextStyle(color: AppColors.textMuted)),
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
