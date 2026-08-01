import 'dart:async';
import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/network/cookie_helper.dart' as cookies;
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/profiles_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/system_insets.dart';
import '../../../core/utils/webview_nav_policy.dart';
import '../../../core/widgets/adaptive_icons.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../core/widgets/webview_error_overlay.dart';

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
          padding: EdgeInsets.fromLTRB(20, 0, 20, 40 + bottomSystemInset(context)),
          children: [
            const SizedBox(height: 28),

            // ── Avatar & identity ──────────────────────────────────────────
            _AvatarSection(user: user, hasAccess: auth.hasAccess, isAnonymous: auth.isAnonymous)
                .animate()
                .fadeIn(duration: 450.ms)
                .slideY(begin: -0.08, end: 0),

            const SizedBox(height: 24),

            // ── Guest upgrade nudge — fully optional, never required ───────
            if (auth.isAnonymous)
              _GuestUpgradeCard(onTap: () => context.push('/signup'))
                  .animate(delay: 20.ms)
                  .fadeIn(duration: 350.ms),

            // ── Verify email nudge — real accounts only ─────────────────────
            // Audit H6 fix: this comment previously claimed mobile never
            // gates anything on emailVerified — that's false. The shared
            // backend (lib/part-access.ts's checkPartAccess, used by every
            // part-content API both web and mobile call) blocks ALL part
            // content for any non-anonymous, unverified account regardless
            // of hasAccess. A real account that upgraded before completing a
            // purchase would hit that wall the moment they tried to open a
            // part they just paid for — /api/mobile-purchases/verify now
            // auto-verifies the email as soon as a purchase grants access
            // (mirroring the exemption /api/auth/upgrade-account already
            // applies when access existed at upgrade time), which is why
            // this banner should rarely be seen by anyone who's actually paid.
            if (!auth.isAnonymous && user != null && !user.emailVerified)
              const Padding(
                padding: EdgeInsets.only(top: 12),
                child: _VerifyEmailBanner(),
              ).animate(delay: 20.ms).fadeIn(duration: 350.ms),

            const SizedBox(height: 24),

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
              if (!auth.isAnonymous)
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
                onTap: () => _openBilling(context, auth),
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
                label: 'Terms of Use (EULA)',
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

            const SizedBox(height: 12),

            // ── Delete account ─────────────────────────────────────────────
            Center(
              child: TextButton(
                onPressed: () => _confirmDelete(context, ref, auth.isAnonymous),
                style: TextButton.styleFrom(foregroundColor: AppColors.textMuted),
                child: const Text('Delete Account',
                    style: TextStyle(fontSize: 13, decoration: TextDecoration.underline)),
              ),
            ).animate(delay: 250.ms).fadeIn(duration: 350.ms),

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

  // "stripe" | "google" | "apple" | null — see UserModel.purchasePlatform doc.
  // Routing this by the ACTUAL purchase platform (not just which OS the app
  // happens to be running on) matters both ways: a Google Play subscriber
  // must land in the Play Store subscription center, not Stripe's web
  // billing portal (which has no record of their purchase at all); and an
  // Apple subscriber must be told to use Settings, per Guideline 3.1.1 —
  // even if, say, they're now signed in on Android after buying on iOS.
  void _openBilling(BuildContext context, AuthState auth) {
    if (!context.mounted) return;
    final platform = auth.user?.purchasePlatform;

    if (platform == 'apple') {
      showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: AppColors.surface,
          title: const Text('Manage Subscription'),
          content: const Text(
            'Subscriptions purchased through the App Store are managed through '
            'your Apple ID.\n\n'
            'On your device: Settings → [Your Name] → Subscriptions.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('OK'),
            ),
          ],
        ),
      );
      return;
    }

    if (platform == 'google') {
      _openPlayStoreSubscriptions(context);
      return;
    }

    if (!auth.hasAccess) {
      context.push('/pricing');
      return;
    }
    // Stripe (web) purchase, or a legacy access grant with no traceable
    // purchase row — the Stripe web billing portal is the correct place to
    // manage it. This isn't the "alternative purchasing mechanism"
    // Guideline 3.1.1 is about even when shown on iOS: the purchase itself
    // already happened outside Apple's IAP, so there's nothing for Apple to
    // manage in the first place.
    _launch('${AppConstants.baseUrl}/billing?app=1', context);
  }

  Future<void> _openPlayStoreSubscriptions(BuildContext context) async {
    final uri = Uri.parse(
      'https://play.google.com/store/account/subscriptions?package=com.themuslimman.seerah',
    );
    try {
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (launched) return;
    } catch (_) {}
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Could not open the Play Store. Open the Play Store app and check '
            'Menu → Payments & subscriptions → Subscriptions instead.'),
        behavior: SnackBarBehavior.floating,
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
    if (url.contains('terms')) return 'Terms of Use (EULA)';
    return 'themuslimman.com';
  }

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final isAnonymous = ref.read(authProvider).isAnonymous;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Sign Out?'),
        content: Text(
          isAnonymous
              ? "You're using a guest account with no email or password. "
                  'Signing out will permanently lose access on this device unless '
                  'you create an account first. Continue?'
              : 'You will need to sign in again.',
        ),
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

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref, bool isAnonymous) async {
    String? password;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppColors.surface,
          title: const Text('Delete Account?'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'This permanently deletes your account, progress, and any active '
                'subscription. This cannot be undone.'
                // Apple provides no server-side subscription cancellation API
                // (only the account/subscriber owns that, via Settings) — so
                // unlike Stripe/Google Play, deleting here can't touch an
                // active App Store subscription. Without this note, an iOS
                // subscriber who deletes their account would keep being
                // billed by Apple indefinitely with no record left anywhere
                // in the app to even show them what's still charging them.
                '${Platform.isIOS ? '\n\nIf you subscribed through the App Store, this does '
                    'NOT cancel Apple billing — please also cancel it in Settings > '
                    '[your name] > Subscriptions on this device.' : ''}',
              ),
              if (!isAnonymous) ...[
                const SizedBox(height: 16),
                TextField(
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Confirm your password'),
                  onChanged: (v) => setDialogState(() => password = v),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel')),
            TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Delete',
                  style: TextStyle(color: AppColors.error)),
            ),
          ],
        ),
      ),
    );
    if (confirmed != true) return;

    final error = await ref.read(authProvider.notifier).deleteAccount(password: password);
    if (!context.mounted) return;
    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), behavior: SnackBarBehavior.floating),
      );
      return;
    }
    context.go('/welcome');
  }
}

// ── Avatar section ─────────────────────────────────────────────────────────────

class _AvatarSection extends StatelessWidget {
  final dynamic user;
  final bool hasAccess;
  final bool isAnonymous;
  const _AvatarSection({required this.user, required this.hasAccess, this.isAnonymous = false});

  String _initials() {
    if (isAnonymous) return 'G';
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

          if (isAnonymous)
            const Text('Guest',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.4,
                ))
          else if (user?.name != null)
            Text(user!.name!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.4,
                )),

          const SizedBox(height: 4),
          Text(isAnonymous ? 'No account yet' : (user?.email ?? 'Student'),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
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

// ── Guest upgrade nudge ──────────────────────────────────────────────────────────

/// Entirely optional prompt shown to guest/anonymous accounts. Never blocks
/// access — Apple Guideline 5.1.1(v) requires registration to remain
/// optional and available "at any time", not forced.
class _GuestUpgradeCard extends StatelessWidget {
  final VoidCallback onTap;
  const _GuestUpgradeCard({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.goldFaded,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              const Icon(Icons.sync_rounded, color: AppColors.gold, size: 22),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Create an account (optional)',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Access your course from other devices. Your purchase '
                      'already works on this device without this.',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4),
                    ),
                  ],
                ),
              ),
              const ForwardChevronIcon(color: AppColors.gold, size: 14),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Verify email nudge ───────────────────────────────────────────────────────────

class _VerifyEmailBanner extends ConsumerStatefulWidget {
  const _VerifyEmailBanner();

  @override
  ConsumerState<_VerifyEmailBanner> createState() => _VerifyEmailBannerState();
}

class _VerifyEmailBannerState extends ConsumerState<_VerifyEmailBanner> {
  bool _sending = false;
  bool _sent = false;

  Future<void> _resend() async {
    setState(() => _sending = true);
    final error = await ref.read(authProvider.notifier).resendVerificationEmail();
    if (!mounted) return;
    setState(() => _sending = false);
    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), behavior: SnackBarBehavior.floating),
      );
      return;
    }
    setState(() => _sent = true);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.gold.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.mark_email_unread_outlined, color: AppColors.gold, size: 22),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Verify your email',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _sent
                      ? 'Verification email sent — check your inbox.'
                      : 'Needed to unlock course content, reset your password, and sign in on other devices.',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4),
                ),
                if (!_sent) ...[
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 32,
                    child: OutlinedButton(
                      onPressed: _sending ? null : _resend,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.gold,
                        side: BorderSide(color: AppColors.gold.withValues(alpha: 0.5)),
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: _sending
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.gold),
                            )
                          : const Text('Resend Email', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
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
                        const ForwardChevronIcon(
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
  bool _hasError = false;
  Timer? _loadTimeout;

  // Without this, a hung connection (dead server, captive Wi-Fi portal, a
  // stalled TLS handshake) that never fires onPageFinished/onWebResourceError
  // left the user staring at an infinite spinner with no way to recover.
  void _armLoadTimeout() {
    _loadTimeout?.cancel();
    _loadTimeout = Timer(const Duration(seconds: 20), () {
      if (mounted && _loading) setState(() { _loading = false; _hasError = true; });
    });
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
        onWebResourceError: (error) {
          if (error.isForMainFrame ?? true) {
            _loadTimeout?.cancel();
            if (mounted) setState(() { _loading = false; _hasError = true; });
          }
        },
        onPageFinished: (_) async {
          _loadTimeout?.cancel();
          if (mounted) setState(() => _loading = false);
          await _ctrl.runJavaScript('''
            (function() {
              var s = document.createElement('style');
              s.textContent = [
                '[aria-controls="mobile-drawer"] { display: none !important; }',
                '#mobile-drawer, [aria-label="mobile-drawer"] { display: none !important; }',
                'aside { display: none !important; }',
                'main { margin-left: 0 !important; padding-left: 0 !important; width: 100% !important; }',
                '.lg\\\\:hidden.fixed.inset-0 { display: none !important; }',
                'a[href*="/pricing"], a[href*="/checkout"], a[href*="/upgrade"] { display: none !important; }'
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
    _armLoadTimeout();
  }

  @override
  void dispose() {
    _loadTimeout?.cancel();
    super.dispose();
  }

  void _retry() {
    setState(() { _hasError = false; _loading = true; });
    _injectCookiesAndLoad();
  }

  // See legal_web_screen.dart's identical helper — same rationale: a plain
  // AppBar back button / bare pop() bypasses the WebView's in-page history,
  // which Android's hardware back button and edge-swipe gesture both expect
  // to step through first.
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
        title: Text(widget.title,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
        centerTitle: false,
        elevation: 0,
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
                    child: CircularProgressIndicator.adaptive(
                      valueColor: AlwaysStoppedAnimation(AppColors.gold),
                    ),
                  ),
              ],
            ),
      ),
    );
  }
}
