import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/signup_screen.dart';
import '../../features/shell/app_shell.dart';
import '../../features/home/screens/landing_screen.dart';
import '../../features/course/screens/course_screen.dart';
import '../../features/course/screens/part_screen.dart';
import '../../features/pricing/screens/pricing_screen.dart';
import '../../features/profile/screens/profile_screen.dart';

/// Listens to auth state changes and notifies GoRouter to re-evaluate redirects.
/// Keeps the GoRouter instance stable (Bug 1 fix: no new GoRouter per auth event).
class _RouterNotifier extends ChangeNotifier {
  final Ref _ref;
  _RouterNotifier(this._ref) {
    _ref.listen(authProvider, (_, __) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _RouterNotifier(ref);
  // Ensure the ChangeNotifier is disposed when the provider is torn down.
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
        return authState.hasAccess ? '/course' : '/pricing';
      }
      // Logged-in on landing: route by access
      if (isLoggedIn && loc == '/landing') {
        return authState.hasAccess ? '/course' : '/pricing';
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
      ShellRoute(
        builder: (ctx, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/course',
            builder: (ctx, state) => const CourseScreen(),
          ),
          GoRoute(
            path: '/pricing',
            builder: (ctx, state) => const PricingScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (ctx, state) => const ProfileScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/part/:partNumber',
        builder: (ctx, state) {
          // Bug 7 fix: use tryParse to prevent crash on invalid param
          final n = int.tryParse(state.pathParameters['partNumber'] ?? '') ?? 1;
          final clamped = n.clamp(1, 100);
          return PartScreen(partNumber: clamped);
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
              onPressed: () => ctx.go('/'),
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
