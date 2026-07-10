import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../theme/app_colors.dart';

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
        onPageStarted: (_) {
          if (mounted) setState(() => _loading = true);
        },
        onPageFinished: (_) {
          if (mounted) setState(() => _loading = false);
        },
      ))
      ..loadRequest(Uri.parse(widget.url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(_title,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.border),
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _ctrl),
          if (_loading)
            const Center(child: CircularProgressIndicator(color: AppColors.gold)),
        ],
      ),
    );
  }
}
