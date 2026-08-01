import 'dart:async';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/iap_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/system_insets.dart';
import '../../../core/widgets/app_logo.dart';
import '../../../core/widgets/legal_web_screen.dart';
import '../../../core/widgets/ui_kit.dart';
import '../widgets/auth_field.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  String? _error;
  bool _accountExists = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  void _openLegal(String url) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => LegalWebScreen(url: url),
    ));
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; _accountExists = false; });

    // Guest → real account upgrade. Purchases already linked to this guest
    // session stay attached after the upgrade.
    final result = await ref.read(authProvider.notifier).upgradeAccount(
        _nameCtrl.text,
        _emailCtrl.text,
        _passCtrl.text,
      );
    if (!mounted) return;
    if (result.success) {
      // Merge any progress made on this device before the account existed —
      // best-effort, never blocks navigation.
      unawaited(ref.read(progressProvider.notifier).pushLocalToServer());
      unawaited(ref.read(iapProvider.notifier).restorePurchases());
      if (result.requiresVerification) {
        // No purchase yet, so the server still requires clicking the
        // emailed verification link — tell the user explicitly instead of
        // silently sending them to the dashboard with no signal that
        // anything further is needed (their first sign otherwise would be
        // an opaque "verification required" error on a locked part later).
        // Audit H6 fix: this used to say "you can keep using the app now",
        // which was only true for the always-free Part 1 — every other part
        // is blocked for an unverified real account regardless of payment
        // (see lib/part-access.ts). Rewritten so it's accurate whether the
        // user buys a plan next (which now auto-verifies them, see
        // /api/mobile-purchases/verify) or just keeps browsing for free.
        // Audit M7 fix: don't claim an email was sent if it genuinely
        // wasn't — result.verificationEmailFailed is only true when the
        // account upgrade itself succeeded but the send call threw (e.g. an
        // email-provider outage), so telling the user to "check your inbox"
        // here would send them looking for a link that's never arriving.
        await showDialog<void>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Text(result.verificationEmailFailed
                ? "Couldn't send verification email"
                : 'Check your email'),
            content: Text(
              result.verificationEmailFailed
                  ? "Your account was created, but we couldn't send a verification "
                      "email to ${_emailCtrl.text.trim()} right now. Part 1 is free to "
                      "explore right away, and if you purchase a plan we'll verify your "
                      "email automatically — otherwise, use \"Resend Email\" from your "
                      "profile once you're signed in."
                  : "We've sent a verification link to ${_emailCtrl.text.trim()}. "
                      "Part 1 is free to explore right away. If you purchase a plan "
                      "before verifying, we'll verify your email for you automatically — "
                      'otherwise, click the link so you can also sign in from other devices.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Got it'),
              ),
            ],
          ),
        );
        if (!mounted) return;
      }
      // Already has access from the guest purchase — go straight in.
      context.go('/dashboard');
    } else {
      setState(() {
        _error = result.error;
        _accountExists = result.accountExists;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final hasAccess = auth.hasAccess;
    final isFamily = auth.isFamily;
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
                // This screen is reached via `context.go('/signup')` from
                // every purchase entry point, which replaces the entire
                // Navigator stack — there is nothing to pop back to. Without
                // a persistent, unconditional exit here, a guest who just
                // bought a plan (hasAccess == true, so the old "Skip for
                // now" button below was hidden) had no way off this screen
                // short of force-quitting the app — directly contradicting
                // Apple Guideline 5.1.1(v)'s requirement that registration
                // stay optional even after purchase.
                Align(
                  alignment: Alignment.topLeft,
                  child: IconButton(
                    icon: const Icon(Icons.close_rounded, size: 22),
                    tooltip: 'Close',
                    onPressed: _loading
                        ? null
                        : () => context.canPop() ? context.pop() : context.go('/dashboard'),
                  ),
                ),
                const SizedBox(height: 24),
                Column(
                  children: [
                    const AppLogo(size: 48),
                    const SizedBox(height: 20),
                    Text(
                      hasAccess ? 'Create Your Account' : 'Save Your Progress',
                      style: Theme.of(context).textTheme.displayMedium,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      hasAccess
                          ? (isFamily
                              ? 'Your Family plan is confirmed. Create an account — anyone in your household can sign in with it and add their own learner profile (up to 5).'
                              : 'Your purchase is confirmed. Create an account so you can sign in on Android, iOS, and the website.')
                          : 'Create an account to access your course from any device.',
                      style: Theme.of(context).textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.2, end: 0),

                const SizedBox(height: 48),

                AuthField(
                  label: 'Full Name',
                  controller: _nameCtrl,
                  keyboardType: TextInputType.name,
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Enter your name' : null,
                ),
                const SizedBox(height: 16),
                AuthField(
                  label: 'Email',
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) => (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
                ),
                const SizedBox(height: 16),
                AuthField(
                  label: 'Password',
                  controller: _passCtrl,
                  obscure: true,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  validator: (v) => (v == null || v.length < 8) ? 'Password must be at least 8 characters' : null,
                ),

                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.error.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
                        if (_accountExists) ...[
                          const SizedBox(height: 10),
                          OutlinedButton(
                            onPressed: _loading
                                ? null
                                : () => context.push(
                                    '/login?email=${Uri.encodeComponent(_emailCtrl.text.trim())}'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.gold,
                              side: const BorderSide(color: AppColors.gold),
                              minimumSize: const Size(48, 44),
                            ),
                            child: const Text('Sign In Instead'),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 28),

                ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator.adaptive(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.black)))
                      : const Text('Create Account'),
                ),

                const SizedBox(height: 12),
                if (!hasAccess)
                  Center(
                    child: TextButton(
                      onPressed: _loading ? null : () => context.go('/dashboard'),
                      child: const Text('Skip for now'),
                    ),
                  ),

                const SizedBox(height: 16),
                _LegalText(onOpenUrl: _openLegal),

                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Flexible(
                      child: Text('Already have an account?',
                          style: Theme.of(context).textTheme.bodyMedium),
                    ),
                    TextButton(
                      onPressed: () => context.go('/login'),
                      child: const Text('Sign in'),
                    ),
                  ],
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

class _LegalText extends StatefulWidget {
  final void Function(String url) onOpenUrl;
  const _LegalText({required this.onOpenUrl});

  @override
  State<_LegalText> createState() => _LegalTextState();
}

class _LegalTextState extends State<_LegalText> {
  static const _baseUrl = AppConstants.baseUrl;
  late final TapGestureRecognizer _termsRecognizer;
  late final TapGestureRecognizer _privacyRecognizer;

  @override
  void initState() {
    super.initState();
    _termsRecognizer = TapGestureRecognizer()
      ..onTap = () => widget.onOpenUrl('$_baseUrl/terms');
    _privacyRecognizer = TapGestureRecognizer()
      ..onTap = () => widget.onOpenUrl('$_baseUrl/privacy');
  }

  @override
  void dispose() {
    _termsRecognizer.dispose();
    _privacyRecognizer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final style = Theme.of(context).textTheme.bodySmall ?? const TextStyle(fontSize: 12);
    final linkStyle = style.copyWith(
      decoration: TextDecoration.underline,
      color: AppColors.textSecondary,
    );

    return RichText(
      textAlign: TextAlign.center,
      text: TextSpan(style: style, children: [
        const TextSpan(text: 'By continuing you agree to our '),
        TextSpan(
          text: 'Terms of Use (EULA)',
          style: linkStyle,
          recognizer: _termsRecognizer,
        ),
        const TextSpan(text: ' and '),
        TextSpan(
          text: 'Privacy Policy',
          style: linkStyle,
          recognizer: _privacyRecognizer,
        ),
        const TextSpan(text: '.'),
      ]),
    );
  }
}
