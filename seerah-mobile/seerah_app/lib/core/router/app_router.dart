import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/signup_screen.dart';
import '../../features/shell/app_shell.dart';
import '../../features/home/screens/landing_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/course/screens/course_screen.dart';
import '../../features/course/screens/part_screen.dart';
import '../../features/resources/screens/resources_screen.dart';
import '../../features/reference/screens/reference_screen.dart';
import '../../features/reference/screens/reference_detail_screen.dart';
import '../../features/progress/screens/progress_screen.dart';
import '../../features/pricing/screens/pricing_screen.dart';
import '../../features/profile/screens/profile_screen.dart';

/// Listens to auth state changes and notifies GoRouter to re-evaluate redirects.
class _RouterNotifier extends ChangeNotifier {
  final Ref _ref;
  _RouterNotifier(this._ref) {
    _ref.listen(authProvider, (_, __) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _RouterNotifier(ref);
  ref.onDispose(notifier.dispose);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = ref.read(authProvider);

      if (authState.isLoading) return null;

      final isLoggedIn = authState.isLoggedIn;
      final loc = state.uri.path;

      final authRoutes = ['/login', '/signup'];
      final isOnAuth = authRoutes.contains(loc);

      // Logged-out: push to landing except for auth screens
      if (!isLoggedIn && !isOnAuth && loc != '/landing') {
        return '/landing';
      }
      // Logged-in on auth pages: route by access
      if (isLoggedIn && isOnAuth) {
        return '/dashboard';
      }
      // Logged-in on landing: go to dashboard
      if (isLoggedIn && loc == '/landing') {
        return '/dashboard';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (ctx, state) => const _SplashScreen(),
      ),
      GoRoute(
        path: '/landing',
        builder: (ctx, state) => const LandingScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (ctx, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (ctx, state) => const SignupScreen(),
      ),

      // ── Shell with bottom nav ──────────────────────────────────────────────
      ShellRoute(
        builder: (ctx, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (ctx, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/course',
            builder: (ctx, state) => const CourseScreen(),
          ),
          GoRoute(
            path: '/resources',
            builder: (ctx, state) => const ResourcesScreen(),
          ),
          GoRoute(
            path: '/reference',
            builder: (ctx, state) => const ReferenceScreen(),
          ),
          GoRoute(
            path: '/progress',
            builder: (ctx, state) => const ProgressScreen(),
          ),
          GoRoute(
            path: '/pricing',
            builder: (ctx, state) => const PricingScreen(),
          ),
        ],
      ),

      // ── Full-screen routes (outside shell) ────────────────────────────────
      GoRoute(
        path: '/profile',
        builder: (ctx, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/part/:partNumber',
        builder: (ctx, state) {
          final n = int.tryParse(state.pathParameters['partNumber'] ?? '') ?? 1;
          return PartScreen(partNumber: n.clamp(1, 100));
        },
      ),
      GoRoute(
        path: '/reference/:sectionId',
        builder: (ctx, state) {
          final id = state.pathParameters['sectionId'] ?? '';
          return ReferenceDetailScreen(sectionId: id);
        },
      ),
    ],
    errorBuilder: (ctx, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.grey),
            const SizedBox(height: 16),
            Text('Page not found', style: Theme.of(ctx).textTheme.titleLarge),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => ctx.go('/dashboard'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
});

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
