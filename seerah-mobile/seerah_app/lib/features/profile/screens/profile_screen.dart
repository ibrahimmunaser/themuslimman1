import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/network/cookie_helper.dart' as cookies;
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui_kit.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: AppGradientBackground(child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Avatar & info
          Center(
            child: Column(
              children: [
                Container(
                  width: 80, height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.goldFaded,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.gold, width: 1.5),
                  ),
                  child: Center(
                    child: Text(
                      _initials(user?.name, user?.email),
                      style: const TextStyle(
                        color: AppColors.gold,
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                if (user?.name != null)
                  Text(user!.name!, style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 4),
                Text(
                  user?.email ?? 'Student',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: auth.hasAccess ? AppColors.success.withValues(alpha: 0.1) : AppColors.goldFaded,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: auth.hasAccess ? AppColors.success.withValues(alpha: 0.5) : AppColors.gold.withValues(alpha: 0.4),
                    ),
                  ),
                  child: Text(
                    auth.hasAccess ? 'Full Access' : 'Free',
                    style: TextStyle(
                      color: auth.hasAccess ? AppColors.success : AppColors.gold,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1, end: 0),
          ),

          const SizedBox(height: 32),

          // Account settings
          _SectionHeader('Account'),
          _SettingsItem(
            icon: Icons.lock_outline,
            label: 'Change Password',
            onTap: () => _launchUrl('${AppConstants.baseUrl}/change-password', context),
          ),
          _SettingsItem(
            icon: Icons.receipt_outlined,
            label: 'Billing & Subscription',
            onTap: () => _launchUrl('${AppConstants.baseUrl}/billing', context),
          ),

          const SizedBox(height: 20),

          _SectionHeader('Support'),
          _SettingsItem(
            icon: Icons.help_outline,
            label: 'Help & FAQ',
            onTap: () => _launchUrl('${AppConstants.baseUrl}/help', context),
          ),
          _SettingsItem(
            icon: Icons.contact_support_outlined,
            label: 'Contact Us',
            onTap: () => _launchUrl('${AppConstants.baseUrl}/contact', context),
          ),

          const SizedBox(height: 20),

          _SectionHeader('Legal'),
          _SettingsItem(
            icon: Icons.policy_outlined,
            label: 'Privacy Policy',
            onTap: () => _launchUrl('${AppConstants.baseUrl}/privacy', context),
          ),
          _SettingsItem(
            icon: Icons.gavel_outlined,
            label: 'Terms of Service',
            onTap: () => _launchUrl('${AppConstants.baseUrl}/terms', context),
          ),

          const SizedBox(height: 32),

          // Logout
          OutlinedButton.icon(
            onPressed: () => _confirmLogout(context, ref),
            icon: const Icon(Icons.logout, size: 18),
            label: const Text('Sign Out'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.error,
              side: const BorderSide(color: AppColors.error),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ).animate(delay: 200.ms).fadeIn(duration: 400.ms),

          const SizedBox(height: 16),
          Center(
            child: Text('Version ${AppConstants.appVersion}',
              style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
          ),
          const SizedBox(height: 40),
        ],
      )),
    );
  }

  String _initials(String? name, String? email) {
    if (name != null && name.isNotEmpty) {
      final parts = name.trim().split(' ');
      if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      return name[0].toUpperCase();
    }
    if (email != null && email.isNotEmpty) return email[0].toUpperCase();
    return 'U';
  }

  void _launchUrl(String url, [BuildContext? context]) {
    if (context == null || !context.mounted) return;
    final title = _titleForUrl(url);
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => _InAppWebScreen(url: url, title: title),
      ),
    );
  }

  String _titleForUrl(String url) {
    if (url.contains('change-password')) return 'Change Password';
    if (url.contains('billing'))         return 'Billing & Subscription';
    if (url.contains('help'))            return 'Help & FAQ';
    if (url.contains('contact'))         return 'Contact Us';
    if (url.contains('privacy'))         return 'Privacy Policy';
    if (url.contains('terms'))           return 'Terms of Service';
    return 'themuslimman.com';
  }

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Sign Out?', style: TextStyle(color: AppColors.textPrimary)),
        content: const Text('You will need to sign in again.',
          style: TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign Out', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(authProvider.notifier).logout();
    }
  }
}

// ── In-app WebView screen ─────────────────────────────────────────────────────

class _InAppWebScreen extends StatefulWidget {
  final String url;
  final String title;
  const _InAppWebScreen({required this.url, required this.title});

  @override
  State<_InAppWebScreen> createState() => _InAppWebScreenState();
}

class _InAppWebScreenState extends State<_InAppWebScreen> {
  late final WebViewController _ctrl;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _ctrl = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(AppColors.background)
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (_) { if (mounted) setState(() => _loading = true); },
        onPageFinished: (_) async {
          if (mounted) setState(() => _loading = false);
          // Hide the desktop sidebar and the floating mobile "Menu" button so
          // the page feels like a native app screen rather than a browser tab.
          await _ctrl.runJavaScript('''
            (function() {
              var s = document.createElement('style');
              s.textContent = [
                /* Floating mobile Menu/Account trigger */
                '[aria-controls="mobile-drawer"] { display: none !important; }',
                /* Drawer overlay and the sidebar itself */
                '#mobile-drawer, [aria-label="mobile-drawer"] { display: none !important; }',
                /* Desktop sidebar (aside that is a flex sibling of main) */
                'aside { display: none !important; }',
                /* Let main fill the full width */
                'main { margin-left: 0 !important; padding-left: 0 !important; width: 100% !important; }',
                /* Remove any fixed-position overlay backdrop */
                '.lg\\\\:hidden.fixed.inset-0 { display: none !important; }'
              ].join(' ');
              document.head.appendChild(s);
            })();
          ''');
        },
      ));
    _injectCookiesAndLoad();
  }

  Future<void> _injectCookiesAndLoad() async {
    // Copy the app's auth session cookies into the WebView so the user
    // doesn't have to sign in again.
    final jar = cookies.getCurrentCookies();
    final cookieManager = WebViewCookieManager();
    final domain = Uri.parse(AppConstants.baseUrl).host;
    for (final entry in jar.entries) {
      await cookieManager.setCookie(WebViewCookie(
        name: entry.key,
        value: entry.value,
        domain: domain,
        path: '/',
      ));
    }
    await _ctrl.loadRequest(Uri.parse(widget.url));
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
        title: Text(widget.title,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
        centerTitle: false,
        elevation: 0,
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

// ─────────────────────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(title, style: const TextStyle(
        color: AppColors.textMuted,
        fontSize: 12,
        fontWeight: FontWeight.w600,
        letterSpacing: 1,
      )),
    );
  }
}

class _SettingsItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _SettingsItem({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: ListTile(
        leading: Icon(icon, color: AppColors.textSecondary, size: 20),
        title: Text(label, style: const TextStyle(color: AppColors.textPrimary, fontSize: 15)),
        trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted, size: 20),
        onTap: onTap,
        tileColor: AppColors.card,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: const BorderSide(color: AppColors.border),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      ),
    );
  }
}
