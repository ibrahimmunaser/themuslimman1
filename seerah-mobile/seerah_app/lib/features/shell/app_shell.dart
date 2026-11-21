import 'dart:math' as math;

import 'package:seerah_app/l10n/salah_phrases.dart';
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
      // No BackdropFilter blur here on purpose: this is a Scaffold
      // bottomNavigationBar, so the body is laid out *above* it and never
      // extends underneath. The only thing behind the bar is the flat
      // scaffold background, so a sigma-24 blur changed nothing visually
      // while still costing a full-width GPU backdrop-blur pass on every
      // frame — most noticeable on mid/low-end Android while scrolling.
      bottomNavigationBar: RepaintBoundary(
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.surface.withValues(alpha: 0.88),
            border: Border(
              top: BorderSide(color: AppColors.border, width: 0.5),
            ),
          ),
          // iPhone has no software buttons, just a thin home indicator
          // drawn over the bar — but it still needs its own lift so the
          // icons/labels float clearly above it (matching native iOS tab
          // bars, e.g. Books/App Store) instead of sitting flush against
          // the physical bottom edge, right where the indicator's swipe
          // gesture lives. Android's 3-button/gesture bar is handled by
          // its own inset below. NavigationBar's own SafeArea stays
          // removed so neither inset can be applied twice.
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
            padding: EdgeInsets.only(
              bottom: _androidNavInset(context) + _iosNavInset(context),
            ),
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
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                      color: selected ? AppColors.gold : AppColors.textMuted,
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
    );
  }
}

/// Space the tab labels need to clear Android's system navigation buttons.
/// iOS returns 0 here — its lift is computed separately by [_iosNavInset]
/// so the two platforms' insets never fight each other.
double _androidNavInset(BuildContext context) {
  if (defaultTargetPlatform != TargetPlatform.android) return 0;
  return bottomSystemInset(context);
}

/// Space the tab bar needs to float above iOS's home-indicator gesture
/// area, matching native iOS tab bars (Books, App Store, Instagram, …)
/// instead of sitting flush against the physical bottom edge where it
/// gets visually clipped by the indicator. Reads the live safe-area inset
/// from [MediaQuery] rather than any hardcoded per-model value, so it
/// adapts automatically across every iPhone size — SE (no indicator, 0),
/// standard/Pro/Pro Max and Dynamic Island models (~34pt) — without
/// needing device-specific lookups that would need updating every time a
/// new iPhone ships. Android returns 0: its own inset is [_androidNavInset].
double _iosNavInset(BuildContext context) {
  if (defaultTargetPlatform != TargetPlatform.iOS) return 0;
  final media = MediaQuery.of(context);
  return math.max(media.viewPadding.bottom, media.padding.bottom);
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
          child: Text(
            t(lang, 'cancel'),
            style: TextStyle(color: AppColors.textMuted),
          ),
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
