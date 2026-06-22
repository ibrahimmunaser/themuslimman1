import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';

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
    if (loc.startsWith('/pricing'))   return 1;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final idx = _currentIndex(context);
    final width = MediaQuery.sizeOf(context).width;
    final compact = width < 380;

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: const Border(top: BorderSide(color: AppColors.border)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.35),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: NavigationBarTheme(
            data: NavigationBarThemeData(
              height: compact ? 64 : 68,
              backgroundColor: Colors.transparent,
              indicatorColor: AppColors.gold.withValues(alpha: 0.16),
              labelTextStyle: WidgetStateProperty.resolveWith((states) {
                final selected = states.contains(WidgetState.selected);
                return TextStyle(
                  fontSize: compact ? 10 : 11,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected ? AppColors.gold : AppColors.textMuted,
                );
              }),
              iconTheme: WidgetStateProperty.resolveWith((states) {
                final selected = states.contains(WidgetState.selected);
                return IconThemeData(
                  size: compact ? 22 : 24,
                  color: selected ? AppColors.gold : AppColors.textMuted,
                );
              }),
            ),
            child: NavigationBar(
              selectedIndex: idx,
              onDestinationSelected: (i) {
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
              destinations: [
                NavigationDestination(
                  icon: const Icon(Icons.home_outlined),
                  selectedIcon: const Icon(Icons.home_rounded, color: AppColors.gold),
                  label: 'Home',
                  tooltip: 'Home',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.menu_book_outlined),
                  selectedIcon: const Icon(Icons.menu_book_rounded, color: AppColors.gold),
                  label: 'Lessons',
                  tooltip: 'Lessons',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.folder_outlined),
                  selectedIcon: const Icon(Icons.folder_rounded, color: AppColors.gold),
                  label: 'Resources',
                  tooltip: 'Resources',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.library_books_outlined),
                  selectedIcon: const Icon(Icons.library_books_rounded, color: AppColors.gold),
                  label: 'Reference',
                  tooltip: 'Reference',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.insights_outlined),
                  selectedIcon: const Icon(Icons.insights_rounded, color: AppColors.gold),
                  label: 'Progress',
                  tooltip: 'Progress',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
