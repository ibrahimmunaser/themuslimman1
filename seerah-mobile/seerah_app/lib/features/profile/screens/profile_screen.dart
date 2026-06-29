import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/network/cookie_helper.dart' as cookies;
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/profiles_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui_kit.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.user;
    final profilesState = ref.watch(profilesProvider).valueOrNull;
    final activeProfile = profilesState?.activeProfile;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: AppGradientBackground(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
          children: [
            const SizedBox(height: 28),

            // ── Avatar & identity ──────────────────────────────────────────
            _AvatarSection(user: user, hasAccess: auth.hasAccess)
                .animate()
                .fadeIn(duration: 450.ms)
                .slideY(begin: -0.08, end: 0),

            const SizedBox(height: 36),

            // ── Learner profiles ───────────────────────────────────────────
            const _GroupLabel('Learner Profile'),
            _SettingsGroup(items: [
              _SettingsDatum(
                icon: Icons.person_outline_rounded,
                label: activeProfile?.displayName ?? 'My Profile',
                subtitle: activeProfile != null && (profilesState?.hasMultipleProfiles ?? false)
                    ? 'Tap to switch learner'
                    : null,
                color: const Color(0xFF9A7AB8),
                onTap: () => context.push('/profiles'),
              ),
              if (profilesState != null && (profilesState.canAddMore || profilesState.hasMultipleProfiles))
                _SettingsDatum(
                  icon: Icons.group_outlined,
                  label: 'Manage Profiles',
                  color: AppColors.gold,
                  onTap: () => context.push('/profiles'),
                ),
            ]).animate(delay: 40.ms).fadeIn(duration: 350.ms),

            const SizedBox(height: 20),

            // ── Account ────────────────────────────────────────────────────
            const _GroupLabel('Account'),
            _SettingsGroup(items: [
              _SettingsDatum(
                icon: Icons.lock_outline_rounded,
                label: 'Change Password',
                color: const Color(0xFF5A90B0),
                onTap: () => _launch('${AppConstants.baseUrl}/change-password', context),
              ),
              _SettingsDatum(
                icon: Icons.receipt_long_outlined,
                label: 'Billing & Subscription',
                color: AppColors.gold,
                onTap: () => _launch('${AppConstants.baseUrl}/billing', context),
              ),
            ]).animate(delay: 70.ms).fadeIn(duration: 350.ms),

            const SizedBox(height: 20),

            // ── Support ────────────────────────────────────────────────────
            const _GroupLabel('Support'),
            _SettingsGroup(items: [
              _SettingsDatum(
                icon: Icons.help_outline_rounded,
                label: 'Help & FAQ',
                color: const Color(0xFF4AA87E),
                onTap: () => _launch('${AppConstants.baseUrl}/help', context),
              ),
              _SettingsDatum(
                icon: Icons.chat_bubble_outline_rounded,
                label: 'Contact Us',
                color: const Color(0xFF8A7AB0),
                onTap: () => _launch('${AppConstants.baseUrl}/contact', context),
              ),
            ]).animate(delay: 120.ms).fadeIn(duration: 350.ms),

            const SizedBox(height: 20),

            // ── Legal ──────────────────────────────────────────────────────
            const _GroupLabel('Legal'),
            _SettingsGroup(items: [
              _SettingsDatum(
                icon: Icons.shield_outlined,
                label: 'Privacy Policy',
                color: AppColors.textMuted,
                onTap: () => _launch('${AppConstants.baseUrl}/privacy', context),
              ),
              _SettingsDatum(
                icon: Icons.gavel_outlined,
                label: 'Terms of Service',
                color: AppColors.textMuted,
                onTap: () => _launch('${AppConstants.baseUrl}/terms', context),
              ),
            ]).animate(delay: 170.ms).fadeIn(duration: 350.ms),

            const SizedBox(height: 32),

            // ── Sign out ───────────────────────────────────────────────────
            Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(14),
              child: InkWell(
                onTap: () => _confirmLogout(context, ref),
                borderRadius: BorderRadius.circular(14),
                child: Ink(
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.error.withValues(alpha: 0.35)),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.logout_rounded, color: AppColors.error, size: 18),
                      SizedBox(width: 8),
                      Text('Sign Out',
                          style: TextStyle(
                              color: AppColors.error,
                              fontSize: 15,
                              fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),
            ).animate(delay: 220.ms).fadeIn(duration: 350.ms),

            const SizedBox(height: 24),
            Center(
              child: Text('Version ${AppConstants.appVersion}',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
            ),
          ],
        ),
      ),
    );
  }

  void _launch(String url, BuildContext context) {
    if (!context.mounted) return;
    final title = _titleFor(url);
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => _InAppWebScreen(url: url, title: title),
    ));
  }

  String _titleFor(String url) {
    if (url.contains('change-password')) return 'Change Password';
    if (url.contains('billing')) return 'Billing & Subscription';
    if (url.contains('help')) return 'Help & FAQ';
    if (url.contains('contact')) return 'Contact Us';
    if (url.contains('privacy')) return 'Privacy Policy';
    if (url.contains('terms')) return 'Terms of Service';
    return 'themuslimman.com';
  }

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Sign Out?'),
        content: const Text('You will need to sign in again.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign Out',
                style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(authProvider.notifier).logout();
    }
  }
}

// ── Avatar section ─────────────────────────────────────────────────────────────

class _AvatarSection extends StatelessWidget {
  final dynamic user;
  final bool hasAccess;
  const _AvatarSection({required this.user, required this.hasAccess});

  String _initials() {
    final name = user?.name as String?;
    final email = user?.email as String?;
    if (name != null && name.isNotEmpty) {
      final parts = name.trim().split(' ');
      if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      return name[0].toUpperCase();
    }
    if (email != null && email.isNotEmpty) return email[0].toUpperCase();
    return 'U';
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        children: [
          // Gradient-ring avatar with glow
          Container(
            width: 92,
            height: 92,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.goldLight, AppColors.gold, AppColors.goldDark],
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.gold.withValues(alpha: 0.25),
                  blurRadius: 28,
                  spreadRadius: 1,
                ),
              ],
            ),
            padding: const EdgeInsets.all(2.5),
            child: Container(
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.surface,
              ),
              child: Center(
                child: Text(
                  _initials(),
                  style: const TextStyle(
                    color: AppColors.gold,
                    fontSize: 30,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -1,
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(height: 16),

          if (user?.name != null)
            Text(user!.name!,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.4,
                )),

          const SizedBox(height: 4),
          Text(user?.email ?? 'Student',
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 14)),

          const SizedBox(height: 12),

          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: hasAccess
                  ? AppColors.success.withValues(alpha: 0.1)
                  : AppColors.goldFaded,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: hasAccess
                    ? AppColors.success.withValues(alpha: 0.4)
                    : AppColors.gold.withValues(alpha: 0.35),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  hasAccess ? Icons.verified_rounded : Icons.star_rounded,
                  color: hasAccess ? AppColors.success : AppColors.gold,
                  size: 13,
                ),
                const SizedBox(width: 5),
                Text(
                  hasAccess ? 'Full Access' : 'Free Plan',
                  style: TextStyle(
                    color: hasAccess ? AppColors.success : AppColors.gold,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Settings helpers ────────────────────────────────────────────────────────────

class _GroupLabel extends StatelessWidget {
  final String text;
  const _GroupLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          color: AppColors.textMuted,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.9,
        ),
      ),
    );
  }
}

class _SettingsDatum {
  final IconData icon;
  final String label;
  final String? subtitle;
  final Color color;
  final VoidCallback onTap;
  const _SettingsDatum({
    required this.icon,
    required this.label,
    this.subtitle,
    required this.color,
    required this.onTap,
  });
}

class _SettingsGroup extends StatelessWidget {
  final List<_SettingsDatum> items;
  const _SettingsGroup({required this.items});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: Column(
        children: items.asMap().entries.map((entry) {
          final i = entry.key;
          final item = entry.value;
          final isLast = i == items.length - 1;
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Material(
                color: AppColors.card,
                child: InkWell(
                  onTap: item.onTap,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    child: Row(
                      children: [
                        Container(
                          width: 34,
                          height: 34,
                          decoration: BoxDecoration(
                            color: item.color.withValues(alpha: 0.14),
                            borderRadius: BorderRadius.circular(9),
                          ),
                          child: Icon(item.icon, color: item.color, size: 17),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(item.label,
                                  style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w500,
                                  )),
                              if (item.subtitle != null)
                                Text(item.subtitle!,
                                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right_rounded,
                            color: AppColors.textMuted, size: 18),
                      ],
                    ),
                  ),
                ),
              ),
              if (!isLast)
                Container(
                  height: 1,
                  color: AppColors.border,
                  margin: const EdgeInsets.only(left: 64),
                ),
            ],
          );
        }).toList(),
      ),
    );
  }
}

// ── In-app WebView ──────────────────────────────────────────────────────────────

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
        onPageStarted: (_) {
          if (mounted) setState(() => _loading = true);
        },
        onPageFinished: (_) async {
          if (mounted) setState(() => _loading = false);
          await _ctrl.runJavaScript('''
            (function() {
              var s = document.createElement('style');
              s.textContent = [
                '[aria-controls="mobile-drawer"] { display: none !important; }',
                '#mobile-drawer, [aria-label="mobile-drawer"] { display: none !important; }',
                'aside { display: none !important; }',
                'main { margin-left: 0 !important; padding-left: 0 !important; width: 100% !important; }',
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
