import 'dart:async';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../theme/app_colors.dart';
import '../utils/webview_nav_policy.dart';
import 'adaptive_icons.dart';
import 'webview_error_overlay.dart';

/// How long to wait for onPageFinished/onWebResourceError before giving up
/// and showing the retry overlay ourselves. Without this, a hung connection
/// (dead server, captive Wi-Fi portal swallowing the request, a stalled TLS
/// handshake) that never fires either callback left the user staring at an
/// infinite spinner with no way to recover short of force-closing the app —
/// neither _loading nor _hasError ever had a reason to change.
const _kWebViewLoadTimeout = Duration(seconds: 20);

/// Shared in-app browser for legal pages (Privacy Policy / Terms of Use).
/// Used anywhere the app needs a functional link to these pages, per Apple
/// Guideline 3.1.2(c) (subscriptions must link Privacy Policy + Terms of Use
/// (EULA) directly in the purchase flow).
class LegalWebScreen extends StatefulWidget {
  final String url;
  const LegalWebScreen({super.key, required this.url});

  @override
  State<LegalWebScreen> createState() => _LegalWebScreenState();
}

class _LegalWebScreenState extends State<LegalWebScreen> {
  late final WebViewController _ctrl;
  bool _loading = true;
  bool _hasError = false;
  Timer? _loadTimeout;

  void _armLoadTimeout() {
    _loadTimeout?.cancel();
    _loadTimeout = Timer(_kWebViewLoadTimeout, () {
      if (mounted && _loading) setState(() { _loading = false; _hasError = true; });
    });
  }

  String get _title {
    if (widget.url.contains('privacy')) return 'Privacy Policy';
    if (widget.url.contains('terms')) return 'Terms of Use (EULA)';
    return 'themuslimman.com';
  }

  @override
  void initState() {
    super.initState();
    _ctrl = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(AppColors.background)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (request) {
          if (shouldBlockInAppPurchaseNavigation(request.url)) {
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
        onPageStarted: (_) {
          if (mounted) setState(() { _loading = true; _hasError = false; });
          _armLoadTimeout();
        },
        onPageFinished: (_) {
          _loadTimeout?.cancel();
          if (mounted) setState(() => _loading = false);
        },
        onWebResourceError: (error) {
          if (error.isForMainFrame ?? true) {
            _loadTimeout?.cancel();
            if (mounted) setState(() { _loading = false; _hasError = true; });
          }
        },
      ))
      ..loadRequest(Uri.parse(widget.url));
    _armLoadTimeout();
  }

  @override
  void dispose() {
    _loadTimeout?.cancel();
    super.dispose();
  }

  void _retry() {
    setState(() { _hasError = false; _loading = true; });
    _ctrl.reload();
    _armLoadTimeout();
  }

  Future<void> _handleBack(BuildContext context) async {
    // A plain AppBar back button (or a bare Navigator.pop()) always pops the
    // whole native screen. On Android specifically, the hardware back button
    // and the edge-swipe gesture both route through this same pop path, so
    // without this check, a user who followed an in-page link on
    // themuslimman.com's privacy/terms pages (anchors, sub-sections) would
    // have system-back skip straight past their in-page history and out of
    // the screen entirely — surprising on Android where "go back one step"
    // is a strong, OS-wide user expectation. iOS has no equivalent
    // OS-level back gesture routed through the WebView, so this only
    // changes behavior where it was actually broken.
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
          title: Text(_title,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
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
                    const Center(child: CircularProgressIndicator(color: AppColors.gold)),
                ],
              ),
      ),
    );
  }
}
