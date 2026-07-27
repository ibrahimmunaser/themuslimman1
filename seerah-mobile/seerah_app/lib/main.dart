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

  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
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

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'The Muslim Man',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      routerConfig: router,
      // Cap text scale to prevent accessibility font sizes from breaking layouts.
      builder: (context, child) {
        final mq = MediaQuery.of(context);
        return MediaQuery(
          data: mq.copyWith(
            textScaler: mq.textScaler.clamp(
              minScaleFactor: 0.85,
              maxScaleFactor: 1.15,
            ),
          ),
          child: child!,
        );
      },
    );
  }
}
