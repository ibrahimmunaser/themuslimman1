import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_colors.dart';
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
    setState(() { _loading = true; _error = null; });

    // Router enforces that only anonymous+purchased guests reach this screen,
    // so this is always a guest → real account upgrade (purchases stay attached).
    final err = await ref.read(authProvider.notifier).upgradeAccount(
        _nameCtrl.text,
        _emailCtrl.text,
        _passCtrl.text,
      );
    if (!mounted) return;
    if (err != null) {
      setState(() { _error = err; _loading = false; });
    } else {
      // Already has access from the guest purchase — go straight in.
      context.go('/dashboard');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AppGradientBackground(
        child: SafeArea(
          child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 64),
                Column(
                  children: [
                    const AppLogo(size: 48),
                    const SizedBox(height: 20),
                    Text(
                      'Save Your Progress',
                      style: Theme.of(context).textTheme.displayMedium,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Optional — access your course from any device. '
                          'Your purchase stays exactly as it is if you skip this.',
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
                    child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
                  ),
                ],

                const SizedBox(height: 28),

                ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                      : const Text('Create Account'),
                ),

                const SizedBox(height: 12),
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
                    Text('Already have an account?', style: Theme.of(context).textTheme.bodyMedium),
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

class _LegalText extends StatelessWidget {
  final void Function(String url) onOpenUrl;
  const _LegalText({required this.onOpenUrl});

  @override
  Widget build(BuildContext context) {
    final style = Theme.of(context).textTheme.bodySmall ?? const TextStyle(fontSize: 12);
    final linkStyle = style.copyWith(
      decoration: TextDecoration.underline,
      color: AppColors.textSecondary,
    );
    const baseUrl = AppConstants.baseUrl;

    return RichText(
      textAlign: TextAlign.center,
      text: TextSpan(style: style, children: [
        const TextSpan(text: 'By continuing you agree to our '),
        TextSpan(
          text: 'Terms of Use (EULA)',
          style: linkStyle,
          recognizer: TapGestureRecognizer()..onTap = () => onOpenUrl('$baseUrl/terms'),
        ),
        const TextSpan(text: ' and '),
        TextSpan(
          text: 'Privacy Policy',
          style: linkStyle,
          recognizer: TapGestureRecognizer()..onTap = () => onOpenUrl('$baseUrl/privacy'),
        ),
        const TextSpan(text: '.'),
      ]),
    );
  }
}
