import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/signup_screen.dart';
import '../../features/shell/app_shell.dart';
import '../../features/home/screens/landing_screen.dart';
import '../../features/home/screens/welcome_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/course/screens/course_screen.dart';
import '../../features/course/screens/part_screen.dart';
import '../../features/resources/screens/resources_screen.dart';
import '../../features/reference/screens/reference_screen.dart';
import '../../features/reference/screens/reference_detail_screen.dart';
import '../../features/progress/screens/progress_screen.dart';
import '../../features/pricing/screens/pricing_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/quiz/screens/quiz_history_screen.dart';
import '../../features/certificate/screens/certificate_screen.dart';
import '../../features/profiles/screens/profiles_screen.dart';
import '../data/parts_data.dart';

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
      final isAnonymous = authState.isAnonymous;
      final loc = state.uri.path;

      final authRoutes = ['/login', '/signup'];
      final isOnAuth = authRoutes.contains(loc);

      // /signup upgrades an anonymous guest to a real email/password account
      // (same user id, so any purchase already made — or made later — stays
      // attached). It must be reachable at any time, purchased or not: Apple
      // Guideline 5.1.1(v) requires account creation to be optional and
      // available whenever the user wants it, not gated behind a purchase.
      // Only fully logged-out (no session at all) visitors are bounced to
      // /landing, since /signup upgrades an *existing* guest session.
      if (loc == '/signup' && !isLoggedIn) return '/landing';

      // Part 1 is always free — allow logged-out users through directly.
      final isFreePartRoute = loc == '/part/1';

      // Logged-out routing:
      // - /welcome and /landing are always allowed (welcome = first screen, landing = plan picker)
      // - /part/1 allowed (free preview)
      // - Auth routes always allowed
      // - / (splash) → redirect to welcome screen on first open
      // - Everything else (locked content) → plan picker (/landing)
      if (!isLoggedIn && !isOnAuth && !isFreePartRoute) {
        if (loc == '/welcome' || loc == '/landing') return null;
        if (loc == '/') return '/welcome';
        return '/landing';
      }

      // Logged-in on splash/welcome → dashboard.
      // Keep unpaid users on /landing so guest checkout can finish StoreKit
      // (Apple 2.1(b) / 5.1.1(v)). Sending them to /dashboard mid-buy was
      // disposing the paywall before buy() ran.
      if (isLoggedIn && (loc == '/' || loc == '/welcome')) {
        return '/dashboard';
      }
      if (isLoggedIn && loc == '/landing' && authState.hasAccess) {
        return '/dashboard';
      }

      // A guest/anonymous account with access may visit /signup to upgrade.
      // A real account is bounced away from both /login and /signup.
      if (isLoggedIn && !isAnonymous && (loc == '/login' || loc == '/signup')) {
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
        path: '/welcome',
        builder: (ctx, state) => const WelcomeScreen(),
      ),
      GoRoute(
        path: '/landing',
        builder: (ctx, state) => const LandingScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (ctx, state) =>
            LoginScreen(prefillEmail: state.uri.queryParameters['email']),
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
        path: '/profiles',
        builder: (ctx, state) => const ProfilesScreen(),
      ),
      GoRoute(
        path: '/quiz-history',
        builder: (ctx, state) => const QuizHistoryScreen(),
      ),
      GoRoute(
        path: '/certificate',
        builder: (ctx, state) => const CertificateScreen(),
      ),
      GoRoute(
        path: '/part/:partNumber',
        builder: (ctx, state) {
          final raw = state.pathParameters['partNumber'];
          final parsed = int.tryParse(raw ?? '');
          // A malformed/out-of-range deep link (e.g. "/part/abc", "/part/-5",
          // "/part/9999") used to silently clamp to Part 1 or the last part
          // with no indication anything was wrong. Show the same "not found"
          // UI as an unmatched route instead, so a broken/typo'd link is
          // visibly broken rather than quietly landing somewhere unintended.
          if (parsed == null || parsed < 1 || parsed > PARTS.length) {
            return const _NotFoundScreen();
          }
          final tab = state.uri.queryParameters['tab'];
          return PartScreen(partNumber: parsed, initialTab: tab);
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
    errorBuilder: (ctx, state) => const _NotFoundScreen(),
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

/// Shown for both unmatched routes (GoRouter's errorBuilder) and
/// well-formed-but-invalid path parameters (e.g. an out-of-range part
/// number), so both cases give the user the same clear, actionable signal.
class _NotFoundScreen extends StatelessWidget {
  const _NotFoundScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.grey),
            const SizedBox(height: 16),
            Text('Page not found', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => context.go('/dashboard'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    );
  }
}
