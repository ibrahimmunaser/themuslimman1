import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:in_app_purchase_storekit/in_app_purchase_storekit.dart';
import 'core/network/api_client.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/iap_provider.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';

Future<void> main() async {
  // Preserve the native splash until init is complete.
  final widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  // Prefer StoreKit 1 receipts while the backend still accepts classic
  // verifyReceipt payloads. StoreKit 2 (plugin default) sends a JWS that
  // our server also handles, but SK1 is the safer path for App Review.
  if (!kIsWeb && Platform.isIOS) {
    try {
      await InAppPurchaseStoreKitPlatform.enableStoreKit1();
    } catch (e) {
      debugPrint('[IAP] enableStoreKit1 failed (continuing with StoreKit 2): $e');
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
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    statusBarBrightness: Brightness.dark,
    systemNavigationBarColor: AppColors.surface,
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);

  // Initialize Dio + restore secure cookies before any provider reads the API.
  // Wrapped in try-finally so the native splash is always removed even if
  // init throws — prevents an infinite splash hang on startup failure.
  try {
    await ApiClient.instance.init();
  } finally {
    FlutterNativeSplash.remove();
  }

  runApp(const ProviderScope(child: SeerahApp()));
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
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // B5 fix: eagerly initialise IAPNotifier at app startup so the purchase
    // stream is attached before any screen opens. This ensures iOS subscription
    // renewal transactions and Android pending purchases delivered on launch
    // are processed even if the user never visits the pricing screen.
    ref.read(iapProvider);
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
          ..showSnackBar(SnackBar(content: Text(notice), backgroundColor: Colors.red.shade700));
        ref.read(authProvider.notifier).consumeSessionExpiredNotice();
      }
    });

    return MaterialApp.router(
      title: 'The Muslim Man',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      scaffoldMessengerKey: _scaffoldMessengerKey,
      routerConfig: router,
      // Cap text scale to prevent accessibility font sizes from breaking
      // fixed-height layouts. 1.15x was so tight it effectively defeated
      // Dynamic Type (barely above default); 1.3x gives users who bumped
      // their system font size a real improvement while still fitting our
      // existing fixed-size rows/icons without requiring a full redesign.
      builder: (context, child) {
        final mq = MediaQuery.of(context);
        return MediaQuery(
          data: mq.copyWith(
            textScaler: mq.textScaler.clamp(
              minScaleFactor: 0.85,
              maxScaleFactor: 1.3,
            ),
          ),
          child: child!,
        );
      },
    );
  }
}
