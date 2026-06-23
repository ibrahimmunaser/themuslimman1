import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_client.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_colors.dart';

/// Email verification notice shown right after account creation.
class VerifyEmailScreen extends ConsumerStatefulWidget {
  const VerifyEmailScreen({super.key});

  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  bool _resending = false;
  String? _resendMessage;

  Future<void> _resend() async {
    setState(() { _resending = true; _resendMessage = null; });
    try {
      final email = ref.read(authProvider).user?.email ?? '';
      await ApiClient.instance.dio.post(
        '/api/auth/resend-verification',
        data: {'email': email},
      );
      if (mounted) setState(() { _resending = false; _resendMessage = 'sent'; });
    } catch (_) {
      if (mounted) setState(() { _resending = false; _resendMessage = 'error'; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final email = ref.watch(authProvider).user?.email ?? '';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(
              28, 0, 28, MediaQuery.of(context).padding.bottom + 28),
          child: Column(
            children: [
              // Progress bar at top
              const LinearProgressIndicator(
                value: 1.0,
                backgroundColor: AppColors.border,
                color: AppColors.gold,
                minHeight: 3,
              ),

              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Email icon with animation circle
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            color: AppColors.goldFaded,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const Icon(
                          Icons.mark_email_unread_outlined,
                          color: AppColors.gold,
                          size: 48,
                        ),
                      ],
                    ),

                    const SizedBox(height: 28),

                    const Text(
                      'Check Your Inbox',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                      ),
                    ),

                    const SizedBox(height: 12),

                    if (email.isNotEmpty) ...[
                      const Text(
                        'We sent a verification link to:',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: AppColors.textSecondary, fontSize: 15),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        email,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: AppColors.gold,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ] else
                      const Text(
                        'We sent a verification link to your email address.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: AppColors.textSecondary, fontSize: 15),
                      ),

                    const SizedBox(height: 20),

                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 16),
                      decoration: BoxDecoration(
                        color: AppColors.card,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Column(
                        children: [
                          _StepRow(
                            icon: Icons.mail_outlined,
                            text: 'Open the email from The Muslim Man',
                          ),
                          SizedBox(height: 12),
                          _StepRow(
                            icon: Icons.touch_app_outlined,
                            text: 'Tap the verification link',
                          ),
                          SizedBox(height: 12),
                          _StepRow(
                            icon: Icons.lock_open_rounded,
                            text: 'Your account is already fully unlocked',
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Bottom section
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  FilledButton(
                    onPressed: () => context.go('/dashboard'),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.gold,
                      foregroundColor: Colors.black,
                      minimumSize: const Size.fromHeight(52),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: const Text(
                      'Start Learning',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                  ),

                  const SizedBox(height: 12),

                  Center(
                    child: _resending
                        ? const Padding(
                            padding: EdgeInsets.symmetric(vertical: 10),
                            child: SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: AppColors.textMuted),
                            ),
                          )
                        : TextButton(
                            onPressed: _resend,
                            style: TextButton.styleFrom(
                                foregroundColor: AppColors.textMuted),
                            child: const Text("Didn't get the email? Resend",
                                style: TextStyle(fontSize: 13)),
                          ),
                  ),

                  if (_resendMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        _resendMessage == 'sent'
                            ? '✓ Verification email sent!'
                            : 'Could not resend. Please try again.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: _resendMessage == 'sent'
                              ? const Color(0xFF4CAF50)
                              : AppColors.error,
                          fontSize: 13,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StepRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _StepRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppColors.gold, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
                color: AppColors.textSecondary, fontSize: 14, height: 1.4),
          ),
        ),
      ],
    );
  }
}
