import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/onboarding_provider.dart';
import '../providers/part_provider.dart';
import '../../l10n/app_strings.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/signup_screen.dart';
import '../../features/onboarding/screens/intro_screen.dart';
import '../../features/shell/app_shell.dart';
import '../../features/home/screens/landing_screen.dart';
import '../../features/home/screens/welcome_screen.dart';
import '../../features/profile/screens/account_screen.dart';
import '../../features/course/screens/course_screen.dart';
import '../../features/course/screens/seerah_hub_screen.dart';
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
import '../../features/salah/salah_section.dart';
import '../../features/salah/quran_section.dart';
import '../../features/salah/navigation.dart'
    show rootNavigatorKey, salahNavigatorKey, quranNavigatorKey;
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
    navigatorKey: rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: notifier,
    redirect: (context, state) {
      final loc = state.uri.path;

      // Forced one-time intro/"what's new" + theme-picker funnel — see
      // onboarding_provider.dart. Checked before auth even loads (it has
      // nothing to do with login state) and takes priority over every
      // other redirect below, so a brand-new install or a device updating
      // into this build can't land anywhere else — including /login or
      // /signup via a stale deep link — until it's completed. IntroScreen
      // itself calls markOnboardingIntroSeen() + context.go() to leave,
      // which flips the provider and makes this check fall through on the
      // very next navigation with no extra listener wiring needed.
      if (ref.read(onboardingPendingProvider) && loc != '/intro') {
        return '/intro';
      }

      final authState = ref.read(authProvider);

      if (authState.isLoading) return null;

      final isLoggedIn = authState.isLoggedIn;
      final isAnonymous = authState.isAnonymous;

      // /signup upgrades an anonymous guest to a real email/password account
      // (same user id, so any purchase already made — or made later — stays
      // attached). It must be reachable at any time, purchased or not: Apple
      // Guideline 5.1.1(v) requires account creation to be optional and
      // available whenever the user wants it, not gated behind a purchase.
      // Only fully logged-out (no session at all) visitors are bounced to
      // /landing, since /signup upgrades an *existing* guest session.
      if (loc == '/signup' && !isLoggedIn) return '/landing';

      // Splash lands on the Salah tab — signed in or not, paid or not, fresh
      // install or returning device — with the bottom tabs visible from the
      // very first frame. The one-time marketing WelcomeScreen no longer
      // auto-shows here (it used to gate '/' on a fresh install, hiding the
      // bottom tabs behind a forced full-screen takeover); it's now only
      // reached manually, e.g. Profile's "Welcome Tour". A signed-out/guest
      // user who taps the Seerah tab instead sees that same welcome content
      // inlined above the free-sample hub (see SeerahHubScreen) — still with
      // bottom tabs visible, which is the whole point of this change.
      // Mirrors the website otherwise: a guest sees the full dashboard
      // immediately (the free part unlocked, every other part shown locked)
      // with no forced login wall; only opening locked content prompts a
      // purchase (PartScreen's own paywall, or the Pricing/Landing screens).
      if (loc == '/dashboard') return '/course';

      if (loc == '/') return '/salah';

      // Account-only screens read/write personal data (profile, learner
      // profiles, quiz history, certificate), so they still need at least a
      // session — guest or real. Everything else — dashboard, lessons,
      // resources, reference, progress, pricing, and every /part/:n — is
      // browsable with no session at all; per-content locking happens at
      // the screen level (hasAccess), not here.
      const accountOnlyRoutes = [
        '/profile',
        '/profiles',
        '/quiz-history',
        '/certificate',
      ];
      if (!isLoggedIn && accountOnlyRoutes.contains(loc)) return '/login';

      // Keep unpaid users on /landing so guest checkout can finish StoreKit
      // (Apple 2.1(b) / 5.1.1(v)). Sending them to /dashboard mid-buy was
      // disposing the paywall before buy() ran. (/welcome has no equivalent
      // bounce: unlike /landing, it's never auto-shown, so a logged-in user
      // can only land there deliberately — e.g. Profile's "Welcome Tour" —
      // and should be allowed to see it.)
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
        path: '/intro',
        builder: (ctx, state) => const IntroScreen(),
      ),
      GoRoute(
        path: '/landing',
        builder: (ctx, state) => const LandingScreen(),
      ),

      // ── Shell with bottom nav ──────────────────────────────────────────────
      ShellRoute(
        builder: (ctx, state, child) =>
            _ShellBackHandler(child: AppShell(child: child)),
        routes: [
          // Sign in / create account need to stay reachable without ever
          // dropping the bottom tabs — same as every other shell screen —
          // so they live here rather than as full-screen routes. (They used
          // to be full-screen, which hid the tabs the whole time a guest
          // was signing in/up; nothing about auth itself needs that.)
          GoRoute(
            path: '/login',
            builder: (ctx, state) =>
                LoginScreen(prefillEmail: state.uri.queryParameters['email']),
          ),
          GoRoute(
            path: '/signup',
            builder: (ctx, state) => const SignupScreen(),
          ),
          GoRoute(
            path: '/account',
            builder: (ctx, state) => const AccountScreen(),
          ),
          GoRoute(
            path: '/course',
            builder: (ctx, state) => const SeerahHubScreen(),
          ),
          GoRoute(
            path: '/lessons',
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
          GoRoute(
            path: '/quran',
            builder: (ctx, state) => const QuranSection(),
          ),
          // Prayer times, reminders, App Guard, Qibla — merged in from the
          // standalone "Allah Is Calling" app. Free for every user.
          // Quran lives on its own /quran tab so it isn't stacked on Salah.
          GoRoute(
            path: '/salah',
            builder: (ctx, state) => const SalahSection(),
          ),
          // A part's overview (Watch/Listen/Read/Slides/etc. menu) is reached
          // from the Seerah tab (hub tiles, continue-learning card, welcome
          // intro's "Watch the first Revelation" CTA) and should keep the
          // bottom tabs visible, same as every other tab destination. Inside
          // PartScreen, actually opening an asset (video, read, slides, ...)
          // still goes full-screen on its own: that's an imperative
          // `Navigator.of(context).push(MaterialPageRoute(...))` on the
          // shared root navigator, which covers AppShell entirely — so video
          // playback still hides the tabs exactly as it should.
          GoRoute(
            path: '/part/:partNumber',
            builder: (ctx, state) {
              final raw = state.pathParameters['partNumber'];
              final parsed = int.tryParse(raw ?? '');
              // A malformed/out-of-range deep link (e.g. "/part/abc",
              // "/part/-5", "/part/9999") used to silently clamp to Part 1 or
              // the last part with no indication anything was wrong. Show
              // the same "not found" UI as an unmatched route instead, so a
              // broken/typo'd link is visibly broken rather than quietly
              // landing somewhere unintended.
              if (parsed == null || parsed < 1 || parsed > PARTS.length) {
                return const _NotFoundScreen();
              }
              final tab = state.uri.queryParameters['tab'];
              return PartScreen(partNumber: parsed, initialTab: tab);
            },
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
        path: '/reference/:sectionId',
        builder: (ctx, state) {
          final id = state.pathParameters['sectionId'] ?? '';
          return ReferenceDetailScreen(sectionId: id);
        },
      ),
    ],
    errorBuilder: (ctx, state) {
      // GoRouter funnels BOTH a genuinely unmatched location AND an
      // exception thrown from redirect/build into this same errorBuilder —
      // the resulting screen looks identical either way, which makes a
      // thrown-exception case look like a plain "bad URL" with no way to
      // tell them apart from a screenshot. Log both pieces of context so a
      // future report of this screen can be diagnosed from logcat instead
      // of guessed at.
      debugPrint(
        'GoRouter errorBuilder: uri=${state.uri} '
        'matchedLocation=${state.matchedLocation} error=${state.error}',
      );
      return const _NotFoundScreen();
    },
  );
});

/// Routes the phone's hardware/gesture back button into whichever of the
/// Salah or Quran tabs' own nested [Navigator]s (`salahNavigatorKey`,
/// `quranNavigatorKey` — see SalahSection/QuranSection) is currently a few
/// screens deep, so back pops e.g. Settings -> Home instead of exiting the
/// whole app.
///
/// This can NOT be done with a plain [NavigatorPopHandler]/[PopScope] placed
/// inside SalahSection/QuranSection themselves, even though that's the
/// textbook pattern for a nested-Navigator-under-a-bottom-nav-bar. The
/// reason is specific to go_router: `ShellRoute` builds its own internal
/// Navigator for whichever GoRoute is active ("All ShellRoutes build a
/// Navigator by default" — go_router's own docs), so there are actually
/// *three* Navigators stacked here: go_router's root Navigator, go_router's
/// ShellRoute-internal Navigator (wrapping `child`, i.e. SalahSection /
/// QuranSection / etc.), and our own raw salahNavigatorKey/quranNavigatorKey
/// Navigator nested inside that. When the system back button fires,
/// go_router's `GoRouterDelegate.popRoute()` — not Flutter's normal
/// Navigator.maybePop chain — decides which Navigator to call `maybePop()`
/// on, by walking ONLY the Navigators *it* manages (root + any ShellRoute
/// navigatorKey) and picking one only if its plain `canPop()` (just a
/// stack-length check) is already true. Our raw nested Navigator is
/// completely invisible to that walk, and the ShellRoute's own internal
/// Navigator's `canPop()` is always false here (switching tabs uses `go()`,
/// which replaces rather than pushes, so that Navigator only ever has one
/// page) — so go_router always ends up calling `maybePop()` on the ROOT
/// Navigator instead, whose current route is this ShellRoute's page. A
/// PopScope registered any deeper (e.g. inside SalahSection) binds to the
/// *wrong* ModalRoute and is simply never consulted.
/// Placing the handler here, wrapping the ShellRoute.builder's own output,
/// puts it on exactly the page go_router's root Navigator does consult.
/// [NavigationNotification]s bubbling up from salahNavigatorKey/
/// quranNavigatorKey still reach it correctly (every Navigator — including
/// go_router's own ShellRoute-internal one — relays a merged notification
/// from its descendants), so [NavigatorPopHandler] works fine as the
/// mechanism; it just has to live at this outer layer, not the inner one.
class _ShellBackHandler extends StatelessWidget {
  final Widget child;
  const _ShellBackHandler({required this.child});

  @override
  Widget build(BuildContext context) {
    return NavigatorPopHandler(
      onPopWithResult: (result) {
        if (salahNavigatorKey.currentState?.canPop() ?? false) {
          salahNavigatorKey.currentState!.maybePop(result);
          return;
        }
        if (quranNavigatorKey.currentState?.canPop() ?? false) {
          quranNavigatorKey.currentState!.maybePop(result);
        }
      },
      child: child,
    );
  }
}

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
class _NotFoundScreen extends ConsumerWidget {
  const _NotFoundScreen();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(courseLangProvider);
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.grey),
            const SizedBox(height: 16),
            Text(t(lang, 'pageNotFound'), style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => context.go('/dashboard'),
              child: Text(t(lang, 'goHome')),
            ),
          ],
        ),
      ),
    );
  }
}
