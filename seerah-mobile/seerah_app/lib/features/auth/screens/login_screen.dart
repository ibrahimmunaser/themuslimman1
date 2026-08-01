import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/iap_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/system_insets.dart';
import '../../../core/utils/webview_nav_policy.dart';
import '../../../core/widgets/adaptive_icons.dart';
import '../../../core/widgets/app_logo.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../core/widgets/webview_error_overlay.dart';
import '../widgets/auth_field.dart';

class LoginScreen extends ConsumerStatefulWidget {
  final String? prefillEmail;
  const LoginScreen({super.key, this.prefillEmail});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _emailCtrl;
  final _passCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _emailCtrl = TextEditingController(text: widget.prefillEmail ?? '');
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  void _openForgotPassword(BuildContext context) {
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => _ForgotPasswordScreen()));
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    // Guest who already purchased must upgrade in-place (same user id) —
    // signing into a *different* email orphans the Play/App Store purchase
    // on the abandoned guest forever (cleanup skips purchase-holders).
    final prior = ref.read(authProvider);
    if (prior.isAnonymous && prior.hasAccess) {
      if (!mounted) return;
      final choice = await showDialog<String>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: AppColors.surface,
          title: const Text('Purchase on this device'),
          content: const Text(
            'This guest session already has course access. Signing into a '
            'different account will leave that purchase on the guest.\n\n'
            'Create an account instead to keep your purchase, or cancel.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, 'cancel'),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx, 'signup'),
              child: const Text('Create Account'),
            ),
          ],
        ),
      );
      if (!mounted) return;
      if (choice == 'signup') {
        context.go('/signup');
        return;
      }
      setState(() => _loading = false);
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });
    final err = await ref
        .read(authProvider.notifier)
        .login(_emailCtrl.text, _passCtrl.text);
    if (!mounted) return;
    if (err != null) {
      setState(() {
        _error = err;
        _loading = false;
      });
      return;
    }
    // Signed in — but deliberately do NOT push this device's cached local
    // progress to the server here. Unlike upgradeAccount() (same user id,
    // safe to push), login() can switch to a COMPLETELY DIFFERENT account
    // than whoever/whatever was last using this device (e.g. a family
    // member signing into their own account on a shared iPad after a guest
    // browsed a few parts). Blindly pushing here would permanently merge
    // that unrelated activity into this account's real progress. Instead,
    // invalidate progressProvider so it rebuilds fresh against the
    // newly-authenticated account — ProgressNotifier._syncFromServer already
    // discards any local cache that doesn't match the server's active
    // profile rather than unioning it in.
    ref.invalidate(progressProvider);
    // Reconciling a store purchase made on this device/install is still
    // safe regardless of whose progress was cached locally — it's tied to
    // the receipt/transaction, not the local progress cache.
    unawaited(ref.read(iapProvider.notifier).restorePurchases());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AppGradientBackground(
        child: SafeArea(
          bottom: false,
          child: SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(24, 0, 24, 24 + bottomSystemInset(context)),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 8),
                  // This screen has no AppBar (full-bleed gradient background),
                  // so without an explicit back affordance a user who pushed
                  // here from Welcome/Landing had no way back except the OS
                  // swipe-back gesture — easy to miss, and Android has no
                  // equivalent gesture at all on some devices/OS versions.
                  Align(
                    alignment: Alignment.topLeft,
                    child: IconButton(
                      icon: const BackIcon(size: 20),
                      tooltip: 'Back',
                      onPressed: () => context.canPop()
                          ? context.pop()
                          : context.go('/landing'),
                    ),
                  ),
                  const SizedBox(height: 40),
                  // Logo / Brand
                  Column(
                    children: [
                      const AppLogo(size: 48),
                      const SizedBox(height: 20),
                      Text(
                        'Sign in to Seerah',
                        style: Theme.of(context).textTheme.displayMedium,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Sign in only if you already have access on another device. Purchasing does not require an account.',
                        style: Theme.of(context).textTheme.bodyMedium,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.2, end: 0),

                  const SizedBox(height: 48),

                  // Fields
                  AuthField(
                    label: 'Email',
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    validator: (v) => (v == null || !v.contains('@'))
                        ? 'Enter a valid email'
                        : null,
                  ),
                  const SizedBox(height: 16),
                  AuthField(
                    label: 'Password',
                    controller: _passCtrl,
                    obscure: true,
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) => _submit(),
                    validator: (v) => (v == null || v.length < 8)
                        ? 'Password must be at least 8 characters'
                        : null,
                  ),

                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => _openForgotPassword(context),
                      child: const Text('Forgot password?'),
                    ),
                  ),

                  if (_error != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.error.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: AppColors.error.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Text(
                        _error!,
                        style: const TextStyle(
                          color: AppColors.error,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 24),

                  ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    child: _loading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator.adaptive(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.black,
                              ),
                            ),
                          )
                        : const Text('Sign In'),
                  ),

                  const SizedBox(height: 24),
                  // Apple Guideline 5.1.1(v): do not funnel new users into
                  // registration before purchase. Sign-up is optional and later.
                  // push, not go — consistent with every other "View Plans" /
                  // paywall entry point in the app; .go() here wiped the entire
                  // back stack, so bouncing between Login and Landing a few
                  // times left no way back to wherever the user started.
                  TextButton(
                    onPressed: () => context.push('/landing'),
                    child: const Text(
                      'Want to purchase? No account needed — view plans',
                      textAlign: TextAlign.center,
                    ),
                  ),
                ].animate(interval: 60.ms).fadeIn(duration: 300.ms).slideY(begin: 0.1, end: 0),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ForgotPasswordScreen extends StatefulWidget {
  @override
  State<_ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<_ForgotPasswordScreen> {
  late final WebViewController _ctrl;
  bool _loading = true;
  bool _hasError = false;
  Timer? _loadTimeout;

  // Without this, a hung connection (dead server, captive Wi-Fi portal, a
  // stalled TLS handshake) that never fires onPageFinished/onWebResourceError
  // left the user staring at an infinite spinner with no way to recover.
  void _armLoadTimeout() {
    _loadTimeout?.cancel();
    _loadTimeout = Timer(const Duration(seconds: 20), () {
      if (mounted && _loading) {
        setState(() {
          _loading = false;
          _hasError = true;
        });
      }
    });
  }

  @override
  void initState() {
    super.initState();
    _ctrl = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(AppColors.background)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (request) {
            if (shouldBlockInAppPurchaseNavigation(request.url)) {
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
          onPageStarted: (_) {
            if (mounted)
              setState(() {
                _loading = true;
                _hasError = false;
              });
            _armLoadTimeout();
          },
          onPageFinished: (_) async {
            _loadTimeout?.cancel();
            if (mounted) setState(() => _loading = false);
            await _ctrl.runJavaScript('''
            (function() {
              var s = document.createElement('style');
              s.textContent = '[aria-controls="mobile-drawer"] { display: none !important; } aside { display: none !important; } main { margin-left: 0 !important; width: 100% !important; }';
              document.head.appendChild(s);
            })();
          ''');
          },
          onWebResourceError: (error) {
            if (error.isForMainFrame ?? true) {
              _loadTimeout?.cancel();
              if (mounted)
                setState(() {
                  _loading = false;
                  _hasError = true;
                });
            }
          },
        ),
      )
      ..loadRequest(Uri.parse('${AppConstants.baseUrl}/forgot-password'));
    _armLoadTimeout();
  }

  @override
  void dispose() {
    _loadTimeout?.cancel();
    super.dispose();
  }

  void _retry() {
    setState(() {
      _hasError = false;
      _loading = true;
    });
    _ctrl.reload();
    _armLoadTimeout();
  }

  // See legal_web_screen.dart's identical helper — same rationale: a plain
  // AppBar back button / bare pop() bypasses the WebView's in-page history,
  // which Android's hardware back button and edge-swipe gesture both expect
  // to step through first (e.g. from the "check your email" confirmation
  // step back to the forgot-password form).
  Future<void> _handleBack(BuildContext context) async {
    if (await _ctrl.canGoBack()) {
      await _ctrl.goBack();
    } else if (context.mounted) {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        await _handleBack(context);
      },
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.surface,
          leading: IconButton(
            icon: const BackIcon(size: 20),
            tooltip: 'Back',
            onPressed: () => _handleBack(context),
          ),
          title: const Text(
            'Forgot Password',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
          ),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(1),
            child: Container(height: 1, color: AppColors.border),
          ),
        ),
        body: _hasError
            ? WebViewErrorOverlay(onRetry: _retry)
            : Stack(
                children: [
                  WebViewWidget(controller: _ctrl),
                  if (_loading)
                    const Center(
                      child: CircularProgressIndicator(color: AppColors.gold),
                    ),
                ],
              ),
      ),
    );
  }
}
