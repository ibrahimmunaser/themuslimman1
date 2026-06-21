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
    if (loc.startsWith('/pricing'))   return 1; // fallback to lessons tab
    if (loc.startsWith('/profile'))   return 0; // profile is accessible via header
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final idx = _currentIndex(context);
    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: AppColors.border)),
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
          backgroundColor: AppColors.surface,
          indicatorColor: AppColors.goldFaded,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home, color: AppColors.gold),
              label: 'Home',
            ),
            NavigationDestination(
              icon: Icon(Icons.menu_book_outlined),
              selectedIcon: Icon(Icons.menu_book, color: AppColors.gold),
              label: 'Lessons',
            ),
            NavigationDestination(
              icon: Icon(Icons.folder_outlined),
              selectedIcon: Icon(Icons.folder, color: AppColors.gold),
              label: 'Resources',
            ),
            NavigationDestination(
              icon: Icon(Icons.library_books_outlined),
              selectedIcon: Icon(Icons.library_books, color: AppColors.gold),
              label: 'Reference',
            ),
            NavigationDestination(
              icon: Icon(Icons.bar_chart_outlined),
              selectedIcon: Icon(Icons.bar_chart, color: AppColors.gold),
              label: 'Progress',
            ),
          ],
        ),
      ),
    );
  }
}
