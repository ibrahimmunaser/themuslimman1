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
import 'core/network/api_client.dart';
import 'core/providers/app_theme_provider.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/iap_provider.dart';
import 'core/providers/part_provider.dart';
import 'core/providers/welcome_provider.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'features/salah/salah_section.dart';
import 'features/salah/state/app_controller.dart';

Future<void> main() async {
  // Preserve the native splash until init is complete.
  final widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);
  await initializeDateFormatting();

  // Prefer StoreKit 1 receipts while the backend still accepts classic
  // verifyReceipt payloads. StoreKit 2 (plugin default) sends a JWS that
  // our server also handles, but SK1 is the safer path for App Review.
  if (!kIsWeb && Platform.isIOS) {
    try {
      await InAppPurchaseStoreKitPlatform.enableStoreKit1();
    } catch (e) {
      debugPrint(
        '[IAP] enableStoreKit1 failed (continuing with StoreKit 2): $e',
      );
    }
  }

  // AppTheme.dark's appBarTheme.systemOverlayStyle only takes effect once a
  // screen with an AppBar builds — any screen with no AppBar (e.g. a
  // full-bleed tab body, a bottom-sheet-only screen, or simply whatever
  // renders first before the first AppBar mounts) previously fell back to
  // Android's OS default system navigation bar (typically light/white with
  // dark icons), clashing hard with this app's permanently-dark theme —
  // Android's persistent on-screen nav bar makes this visible on far more
  // screens than iOS's home indicator (which has no color of its own to
  // mismatch). Setting it once here at startup gives every screen a
  // correctly-themed baseline; AppBarTheme's own systemOverlayStyle still
  // takes over (harmlessly re-asserting the same values) on any screen that
  // has an AppBar.
  // Load the persisted theme choice into AppColors before anything (this
  // call included) reads it, so the startup system bars and first frame
  // already reflect it instead of flashing Black & Gold first.
  await loadAppThemeFromPrefs();

  SystemChrome.setSystemUIOverlayStyle(
    SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: AppColors.isDark ? Brightness.light : Brightness.dark,
      statusBarBrightness: AppColors.isDark ? Brightness.dark : Brightness.light,
      systemNavigationBarColor: AppColors.surface,
      systemNavigationBarIconBrightness: AppColors.isDark ? Brightness.light : Brightness.dark,
    ),
  );

  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  // Initialize Dio + restore secure cookies before any provider reads the API.
  // Wrapped in try-finally so the native splash is always removed even if
  // init throws — prevents an infinite splash hang on startup failure.
  bool hasSeenWelcome = true;
  try {
    await ApiClient.instance.init();
    // Read before FlutterNativeSplash.remove() so app_router's redirect can
    // decide /welcome vs /dashboard on the very first frame — see
    // welcome_provider.dart's doc comment.
    hasSeenWelcome = await loadHasSeenWelcome();
  } finally {
    FlutterNativeSplash.remove();
  }

  runApp(
    ProviderScope(
      overrides: [
        welcomeSeenProvider.overrideWith((ref) => hasSeenWelcome),
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
    unawaited(
      loadSalahLangFromPrefs().then((_) {
        return SalahBootstrap.ensure().then((controller) {
          if (mounted) setState(() => _salahController = controller);
        });
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
          key: ValueKey('theme-$themeId'),
          child: child!,
        );
        final wrapped =
            controller == null
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
