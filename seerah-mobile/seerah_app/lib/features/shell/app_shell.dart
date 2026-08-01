import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/system_insets.dart';

class AppShell extends StatelessWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  int _currentIndex(BuildContext context) {
    final loc = GoRouterState.of(context).uri.path;
    if (loc.startsWith('/dashboard')) return 0;
    if (loc.startsWith('/course'))    return 1;
    if (loc.startsWith('/resources')) return 2;
    if (loc.startsWith('/reference')) return 3;
    if (loc.startsWith('/progress'))  return 4;
    // Pricing isn't one of the 5 primary tabs — it used to fall under
    // "Lessons" (index 1), which wrongly implied the user was viewing course
    // content while actually looking at a paywall/upsell screen. Fall
    // through to the neutral Home tab instead of a misleading selection.
    return 0;
  }

  @override
  Widget build(BuildContext context) {
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
                border: const Border(top: BorderSide(color: AppColors.border, width: 0.5)),
              ),
              // Audit H10 fix: SafeArea here relies on MediaQuery.padding,
              // which bottomSystemInset's own doc comment notes some Android
              // devices report as 0 even while the 3-button nav bar still
              // overlaps content — those devices rendered this bar's icons
              // partially hidden behind the system nav bar. Use the same
              // helper every other bottom-inset spot in this app uses so
              // behavior is consistent across all of them.
              child: Padding(
                padding: EdgeInsets.only(bottom: bottomSystemInset(context)),
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
                    iconTheme: WidgetStateProperty.resolveWith((states) {
                      final selected = states.contains(WidgetState.selected);
                      return IconThemeData(
                        size: compact ? 22 : 23,
                        color: selected ? AppColors.gold : AppColors.textMuted,
                      );
                    }),
                  ),
                  child: NavigationBar(
                    selectedIndex: idx,
                    onDestinationSelected: (i) {
                      HapticFeedback.selectionClick();
                      switch (i) {
                        case 0: context.go('/dashboard'); break;
                        case 1: context.go('/course'); break;
                        case 2: context.go('/resources'); break;
                        case 3: context.go('/reference'); break;
                        case 4: context.go('/progress'); break;
                      }
                    },
                    labelBehavior: compact
                        ? NavigationDestinationLabelBehavior.alwaysHide
                        : NavigationDestinationLabelBehavior.alwaysShow,
                    destinations: const [
                      NavigationDestination(
                        icon: Icon(Icons.home_outlined),
                        selectedIcon: Icon(Icons.home_rounded, color: AppColors.gold),
                        label: 'Home',
                        tooltip: 'Home',
                      ),
                      NavigationDestination(
                        icon: Icon(Icons.menu_book_outlined),
                        selectedIcon: Icon(Icons.menu_book_rounded, color: AppColors.gold),
                        label: 'Lessons',
                        tooltip: 'Lessons',
                      ),
                      NavigationDestination(
                        icon: Icon(Icons.folder_outlined),
                        selectedIcon: Icon(Icons.folder_rounded, color: AppColors.gold),
                        label: 'Resources',
                        tooltip: 'Resources',
                      ),
                      NavigationDestination(
                        icon: Icon(Icons.library_books_outlined),
                        selectedIcon: Icon(Icons.library_books_rounded, color: AppColors.gold),
                        label: 'Reference',
                        tooltip: 'Reference',
                      ),
                      NavigationDestination(
                        icon: Icon(Icons.insights_outlined),
                        selectedIcon: Icon(Icons.insights_rounded, color: AppColors.gold),
                        label: 'Progress',
                        tooltip: 'Progress',
                      ),
                    ],
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
