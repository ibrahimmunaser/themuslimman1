import 'dart:async' show unawaited;
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:flutter/services.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:in_app_purchase_storekit/in_app_purchase_storekit.dart';
import 'package:provider/provider.dart' as provider_pkg;
import 'package:sentry_flutter/sentry_flutter.dart';
import 'core/app_log.dart';
import 'core/crash_guard.dart';
import 'core/error_reporter.dart';
import 'core/network/api_client.dart';
import 'core/providers/app_theme_provider.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/iap_provider.dart';
import 'core/providers/onboarding_provider.dart';
import 'core/providers/part_provider.dart';
import 'core/providers/welcome_provider.dart';
import 'core/router/app_router.dart';
import 'core/sentry_filter.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'features/salah/salah_section.dart';
import 'features/salah/state/app_controller.dart';

/// Prefer StoreKit 1 receipts while the backend still accepts classic
/// verifyReceipt payloads. StoreKit 2 (plugin default) sends a JWS that our
/// server also handles, but SK1 is the safer path for App Review. A no-op
/// off iOS; never throws.
Future<void> _enableStoreKit1IfNeeded() async {
  if (kIsWeb || !Platform.isIOS) return;
  try {
    // Deliberate: the backend verifies classic SK1 receipts. The plugin
    // marks this deprecated ("will be removed in the future"); when it
    // is removed, migrate verification to StoreKit 2 JWS instead.
    // ignore: deprecated_member_use
    await InAppPurchaseStoreKitPlatform.enableStoreKit1();
  } catch (e) {
    debugPrint('[IAP] enableStoreKit1 failed (continuing with StoreKit 2): $e');
  }
}

Future<void> main() async {
  // Preserve the native splash until init is complete.
  final widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  // First thing: catch every uncaught error (framework, async, platform
  // channel) so none of them can silently kill the app — see ErrorReporter.
  // This runs before SentryFlutter.init below so Sentry's own handlers wrap
  // (and still call) these, instead of replacing them.
  ErrorReporter.install();

  // Wraps the rest of startup + runApp. Besides reporting Dart-level
  // exceptions, this installs the native iOS/Android Sentry SDKs, which is
  // the main reason it's here: a crash before the Dart VM even starts, or
  // one the engine itself can't recover from (the unexplained "app closes
  // right after opening" reports), produces nothing in ErrorReporter's
  // local buffer because Dart never gets a chance to run — but the native
  // SDK still captures and uploads it on the next launch.
  await SentryFlutter.init((options) {
    options.dsn =
        'https://138e32c9d9df4fdbda362c6015692c47@o4512346187169792.ingest.us.sentry.io/4512473504088064';
    // Recommended default; lower this (e.g. 0.2) later if trace volume
    // becomes a cost concern once real users are on this build.
    options.tracesSampleRate = 1.0;
    // Offline / flaky-network failures aren't app bugs — keep them out of
    // the issue feed (see sentry_filter.dart for the rationale).
    options.beforeSend = dropTransientNetworkNoise;
  }, appRunner: _runApp);
}

Future<void> _runApp() async {
  // Forward every error ErrorReporter already buffers (framework errors,
  // platform-channel errors, and every guard() failure below) to Sentry
  // too, with the real error/stack for proper symbolication — rather than
  // only the stringified copy in the local buffer.
  ErrorReporter.onReport = (error, stack, entry) {
    unawaited(
      Sentry.captureException(
        error,
        stackTrace: stack,
        hint: Hint.withMap({'source': entry['source']}),
      ),
    );
  };

  // Must finish before anything reads courseLangProvider (lazily created on
  // first read, during SeerahApp's first build — see CrashGuard's doc
  // comment) so a reset here is already in place by the time it loads.
  await ErrorReporter.guard(
    'crash_guard',
    CrashGuard.checkAndMarkPending,
    null,
  );
  // Startup work that doesn't depend on each other runs concurrently instead
  // of as a chain of awaits. Previously date-symbol init, the StoreKit
  // switch, the theme-prefs read, the orientation lock, the secure-storage
  // cookie load (EncryptedSharedPreferences + Keystore init, easily the
  // slowest on Android) and the welcome-flag read each waited on the one
  // before it, all while the native splash was still up. Total time is now
  // the slowest single step rather than the sum of all of them.
  bool hasSeenWelcome = true;
  bool needsOnboarding = false;
  bool onboardingIsNewInstall = true;
  try {
    // Every step is individually guarded: a failure in one (e.g. secure
    // storage on a quirky device) is recorded and replaced by a safe
    // default instead of aborting main() before runApp, which used to
    // leave the user with a dead, never-rendering app.
    final results = await Future.wait<Object?>([
      ErrorReporter.guard('date_formatting', initializeDateFormatting, null),
      ErrorReporter.guard('storekit1', _enableStoreKit1IfNeeded, null),
      // Loads the persisted theme choice into AppColors before anything
      // (the system-bar style below included) reads it, so the startup
      // system bars and first frame already reflect it instead of flashing
      // Black & Gold first.
      ErrorReporter.guard('theme', loadAppThemeFromPrefs, null),
      ErrorReporter.guard(
        'orientation',
        () => SystemChrome.setPreferredOrientations([
          DeviceOrientation.portraitUp,
        ]),
        null,
      ),
      // Initialize Dio + restore secure cookies before any provider reads
      // the API.
      ErrorReporter.guard('api_client', ApiClient.instance.init, null),
      // Read before FlutterNativeSplash.remove() so app_router's redirect
      // can decide /welcome vs /dashboard on the very first frame — see
      // welcome_provider.dart's doc comment.
      ErrorReporter.guard<bool>('welcome', loadHasSeenWelcome, true),
      // Same reasoning as loadHasSeenWelcome() above, for the forced
      // intro/"what's new" + theme-picker funnel — see
      // onboarding_provider.dart.
      ErrorReporter.guard<({bool needsOnboarding, bool isNewInstall})>(
        'onboarding',
        loadOnboardingStartupInfo,
        (needsOnboarding: false, isNewInstall: true),
      ),
    ]);
    hasSeenWelcome = results[results.length - 2] as bool;
    final onboardingInfo =
        results.last as ({bool needsOnboarding, bool isNewInstall});
    needsOnboarding = onboardingInfo.needsOnboarding;
    onboardingIsNewInstall = onboardingInfo.isNewInstall;

    // AppTheme.dark's appBarTheme.systemOverlayStyle only takes effect once
    // a screen with an AppBar builds — any screen with no AppBar (e.g. a
    // full-bleed tab body, a bottom-sheet-only screen, or simply whatever
    // renders first before the first AppBar mounts) previously fell back to
    // Android's OS default system navigation bar (typically light/white
    // with dark icons), clashing hard with this app's permanently-dark
    // theme. Setting it once here at startup (after the persisted theme has
    // been applied to AppColors above) gives every screen a correctly-
    // themed baseline; AppBarTheme's own systemOverlayStyle still takes
    // over on any screen that has an AppBar.
    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: AppColors.isDark
            ? Brightness.light
            : Brightness.dark,
        statusBarBrightness: AppColors.isDark
            ? Brightness.dark
            : Brightness.light,
        systemNavigationBarColor: AppColors.surface,
        systemNavigationBarIconBrightness: AppColors.isDark
            ? Brightness.light
            : Brightness.dark,
      ),
    );
  } finally {
    // Always remove the splash, even if init throws — prevents an infinite
    // splash hang on startup failure.
    FlutterNativeSplash.remove();
  }

  runApp(
    ProviderScope(
      overrides: [
        welcomeSeenProvider.overrideWith((ref) => hasSeenWelcome),
        onboardingPendingProvider.overrideWith((ref) => needsOnboarding),
        onboardingIsNewInstallProvider.overrideWith(
          (ref) => onboardingIsNewInstall,
        ),
      ],
      child: const SeerahApp(),
    ),
  );
}

class SeerahApp extends ConsumerStatefulWidget {
  const SeerahApp({super.key});

  @override
  ConsumerState<SeerahApp> createState() => _SeerahAppState();
}

/// Observes the app lifecycle to re-check access when the user returns from
/// an external browser (e.g. after completing checkout).
class _SeerahAppState extends ConsumerState<SeerahApp>
    with WidgetsBindingObserver {
  AppController? _salahController;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // The first frame actually rendering is still the strongest "this
    // launch didn't crash at startup" signal for the in-app language-reset
    // recovery below — Sentry (see main.dart) now gives us real crash data
    // too, but doesn't replace this local recovery mechanism.
    // See CrashGuard's doc comment.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(CrashGuard.markSucceeded());
      if (CrashGuard.justRecoveredLanguage) {
        CrashGuard.justRecoveredLanguage = false;
        final messenger = _scaffoldMessengerKey.currentState;
        messenger
          ?..hideCurrentSnackBar()
          ..showSnackBar(
            const SnackBar(
              duration: Duration(seconds: 6),
              content: Text(
                'We reset the app language to English after it had '
                'trouble starting up. Please try changing the language '
                'again — if it keeps happening, let us know.',
              ),
            ),
          );
      }
    });
    // B5 fix: eagerly initialise IAPNotifier at app startup so the purchase
    // stream is attached before any screen opens. This ensures iOS subscription
    // renewal transactions and Android pending purchases delivered on launch
    // are processed even if the user never visits the pricing screen.
    ref.read(iapProvider);

    // Eagerly initialize the Salah controller (prayer-time calculation +
    // reminder/incoming-call-alarm scheduling) at app startup, exactly like
    // the IAPNotifier fix above — previously this only happened the first
    // time the user visited the Salah tab (SalahSection's FutureBuilder),
    // which never triggers on a cold start into any other tab. Since the
    // app's root route always lands on Seerah (see app_router.dart), a user
    // who doesn't visit Salah that session got no reminders scheduled at
    // all for that process lifetime, and once the scheduling policy's
    // rolling coverage window ran out, reminders silently stopped firing
    // forever — the root cause of "the call UI is not coming up
    // automatically". SalahBootstrap.ensure() is memoized, so SalahSection
    // reuses this exact instance with no duplicate work.
    //
    // loadSalahLangFromPrefs() MUST complete first: scheduling bakes in
    // notification title/body text using the salahLang global (no
    // BuildContext exists at schedule time), and CourseLangNotifier's own
    // load is async + lazily created on first read of courseLangProvider —
    // which doesn't happen until the first build() below, i.e. strictly
    // *after* this initState. Without this, every notification scheduled on
    // this cold start was silently baked in with the 'en' default instead of
    // the user's actual selected language, and stayed wrong until the next
    // reschedule.
    final bootStart = DateTime.now();
    unawaited(
      loadSalahLangFromPrefs().then((_) {
        return SalahBootstrap.ensure().then((controller) {
          // How long the Salah controller (prayer times + reminder
          // scheduling) took to come up. On slow phones this is the window
          // in which Quran screens had no controller (SEERAH-MOBILE-8).
          AppLog.info('Salah controller ready', {
            'boot_ms': DateTime.now().difference(bootStart).inMilliseconds,
          });
          if (mounted) setState(() => _salahController = controller);
        });
      }).catchError((Object e, StackTrace st) {
        AppLog.error('Salah controller failed to start', {
          'error_type': e.runtimeType.toString(),
          'error': e.toString(),
          'boot_ms': DateTime.now().difference(bootStart).inMilliseconds,
        });
        ErrorReporter.report(e, st, source: 'salah_bootstrap');
      }),
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(authProvider.notifier).refreshAccessOnResume();
    }
  }

  final _scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

  /// Keeps the routed content (the whole Navigator + every mounted screen)
  /// alive when the widget tree above it changes shape. Once the Salah
  /// controller finishes initializing, `builder:` below starts wrapping the
  /// content in a ChangeNotifierProvider. Without a GlobalKey on it, that
  /// one-level change made Flutter dispose and rebuild every screen on
  /// screen right after launch (a ValueKey only matches siblings, not a
  /// re-parented subtree). The GlobalKey lets the existing elements be
  /// reparented intact instead.
  final _routedContentKey = GlobalKey(debugLabel: 'routed-content');

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);

    // A background session check (not an explicit "Sign Out" tap) found the
    // session already invalid and had to log the user out. Surface why,
    // wherever they happen to be, instead of silently bouncing them to the
    // paywall with no explanation.
    ref.listen<AuthState>(authProvider, (prev, next) {
      final notice = next.sessionExpiredNotice;
      if (notice != null) {
        _scaffoldMessengerKey.currentState
          ?..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(
              content: Text(notice),
              backgroundColor: Colors.red.shade700,
            ),
          );
        ref.read(authProvider.notifier).consumeSessionExpiredNotice();
      }
    });

    // Drives app-wide RTL layout and locale (date/number formatting,
    // Cupertino/Material widget text direction) — courseLangProvider is the
    // single source of truth for language, already used by every
    // content-fetching provider (see part_provider.dart), so the UI chrome
    // now follows the exact same switch instead of staying English-only.
    final lang = ref.watch(courseLangProvider);
    final locale = Locale(lang);

    // AppColors' fields are plain mutable statics (not Riverpod state), so
    // picking a new theme on the Account screen doesn't itself trigger
    // widget rebuilds. themeId IS watched here, and keying a KeyedSubtree
    // around the routed content on it forces Flutter to fully unmount and
    // remount every currently-visible screen whenever it changes — the
    // simplest reliable way to make the whole app's chrome repaint, given
    // how many screens read AppColors.xxx directly instead of via
    // Theme.of(context).
    final themeId = ref.watch(appThemeProvider);

    return MaterialApp.router(
      title: 'The Muslim Man',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      scaffoldMessengerKey: _scaffoldMessengerKey,
      routerConfig: router,
      locale: locale,
      supportedLocales: const [
        Locale('en'),
        Locale('ar'),
        Locale('fr'),
        Locale('id'),
        Locale('ms'),
        Locale('zh'),
        Locale('ru'),
        Locale('sw'),
        Locale('es'),
        Locale('de'),
        Locale('tr'),
        Locale('hi'),
        Locale('ur'),
        Locale('bn'),
        Locale('fa'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      // Cap text scale to prevent accessibility font sizes from breaking
      // fixed-height layouts. 1.15x was so tight it effectively defeated
      // Dynamic Type (barely above default); 1.3x gives users who bumped
      // their system font size a real improvement while still fitting our
      // existing fixed-size rows/icons without requiring a full redesign.
      builder: (context, child) {
        final mq = MediaQuery.of(context);
        final controller = _salahController;
        // AppColors' fields are plain mutable statics (not Riverpod state),
        // so picking a new theme on the Account screen doesn't itself
        // trigger widget rebuilds. Keying this KeyedSubtree on the theme id
        // forces Flutter to fully unmount and remount every currently-
        // visible screen whenever it changes — the simplest reliable way to
        // repaint the whole app's chrome, given how many screens read
        // AppColors.xxx directly instead of via Theme.of(context).
        final themed = KeyedSubtree(
          key: _routedContentKey,
          child: KeyedSubtree(key: ValueKey('theme-$themeId'), child: child!),
        );
        final wrapped = controller == null
            ? themed
            : provider_pkg.ChangeNotifierProvider<AppController>.value(
                value: controller,
                // Root-level so the "Allah is calling" screen (pushed on
                // rootNavigatorKey — see navigation.dart) can always read
                // the controller, regardless of which bottom-nav tab's
                // subtree is mounted underneath. SalahSection's own
                // (redundant but harmless) local provider still wraps the
                // same single instance for its subtree.
                child: themed,
              );
        return MediaQuery(
          data: mq.copyWith(
            textScaler: mq.textScaler.clamp(
              minScaleFactor: 0.85,
              maxScaleFactor: 1.3,
            ),
          ),
          // Directionality wraps the whole router/navigator tree so every
          // screen mirrors into RTL for Arabic, Urdu, and Persian.
          child: Directionality(
            textDirection: isRtlCourseLang(lang)
                ? TextDirection.rtl
                : TextDirection.ltr,
            child: wrapped,
          ),
        );
      },
    );
  }
}
