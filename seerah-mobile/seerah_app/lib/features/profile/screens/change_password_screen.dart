import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/adaptive_icons.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../l10n/app_strings.dart';
import '../../auth/widgets/auth_field.dart';

/// Native, fully-translated "Change Password" screen for real (non-anonymous)
/// accounts. Hits the website's own session-authenticated
/// `/api/auth/change-password` endpoint directly via [AuthNotifier] — see
/// that method's doc comment for why this does NOT reuse the website's
/// `/change-password` *page* (a separate first-time "set a password" flow
/// for guest checkouts that immediately redirects anyone who already has a
/// password to their dashboard instead of showing a form at all).
class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _currentCtrl = TextEditingController();
  final _nextCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _saving = false;
  bool _success = false;
  String? _error;

  @override
  void dispose() {
    _currentCtrl.dispose();
    _nextCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  bool get _isLong => _nextCtrl.text.length >= 8;
  bool get _matches => _nextCtrl.text.isNotEmpty && _nextCtrl.text == _confirmCtrl.text;
  bool get _canSubmit =>
      _currentCtrl.text.isNotEmpty && _isLong && _matches && !_saving;

  Future<void> _submit() async {
    if (!_canSubmit) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    final err = await ref.read(authProvider.notifier).changePassword(
          currentPassword: _currentCtrl.text,
          newPassword: _nextCtrl.text,
        );
    if (!mounted) return;
    if (err != null) {
      setState(() {
        _saving = false;
        _error = err;
      });
      return;
    }
    setState(() {
      _saving = false;
      _success = true;
      _error = null;
    });
    _currentCtrl.clear();
    _nextCtrl.clear();
    _confirmCtrl.clear();
    // Mirrors the website's own form: a brief success confirmation, then
    // returns to the account menu — there's nothing more to do on this
    // screen once the password is changed.
    await Future<void>.delayed(const Duration(milliseconds: 1200));
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(courseLangProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        leading: IconButton(
          icon: const BackIcon(size: 20),
          tooltip: t(lang, 'back'),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(t(lang, 'changePassword'),
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
        centerTitle: false,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.border),
        ),
      ),
      body: AppGradientBackground(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
          children: [
            AuthField(
              label: t(lang, 'currentPassword'),
              hint: t(lang, 'enterCurrentPassword'),
              controller: _currentCtrl,
              obscure: true,
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 16),
            AuthField(
              label: t(lang, 'newPasswordField'),
              hint: t(lang, 'atLeast8Chars'),
              controller: _nextCtrl,
              obscure: true,
              onChanged: (_) => setState(() {}),
            ),
            if (_nextCtrl.text.isNotEmpty) ...[
              const SizedBox(height: 6),
              _HintRow(ok: _isLong, label: t(lang, 'atLeast8Chars')),
            ],
            const SizedBox(height: 16),
            AuthField(
              label: t(lang, 'confirmNewPassword'),
              hint: t(lang, 'reenterNewPassword'),
              controller: _confirmCtrl,
              obscure: true,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _submit(),
              onChanged: (_) => setState(() {}),
            ),
            if (_confirmCtrl.text.isNotEmpty) ...[
              const SizedBox(height: 6),
              _HintRow(
                ok: _matches,
                label: _matches ? t(lang, 'passwordsMatch') : t(lang, 'passwordsDontMatch'),
                okColor: const Color(0xFF4AA87E),
                badColor: AppColors.error,
              ),
            ],

            if (_error != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                ),
                child: Text(
                  _error!,
                  style: const TextStyle(color: AppColors.error, fontSize: 13),
                ),
              ),
            ],

            const SizedBox(height: 28),

            SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: _canSubmit ? _submit : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: Colors.black,
                  disabledBackgroundColor: AppColors.gold.withValues(alpha: 0.35),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _success
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.check_rounded, size: 18),
                          const SizedBox(width: 8),
                          Text(t(lang, 'passwordUpdatedSuccess'),
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                        ],
                      )
                    : _saving
                        ? Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const SizedBox(
                                height: 18,
                                width: 18,
                                child: CircularProgressIndicator.adaptive(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.black),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(t(lang, 'saving'),
                                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                            ],
                          )
                        : Text(
                            t(lang, 'updatePasswordButton'),
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                          ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HintRow extends StatelessWidget {
  final bool ok;
  final String label;
  final Color? okColor;
  final Color? badColor;
  const _HintRow({required this.ok, required this.label, this.okColor, this.badColor});

  @override
  Widget build(BuildContext context) {
    final color = ok
        ? (okColor ?? const Color(0xFF4AA87E))
        : (badColor ?? AppColors.textMuted);
    return Row(
      children: [
        Icon(ok ? Icons.check_circle_outline : Icons.circle_outlined, size: 14, color: color),
        const SizedBox(width: 6),
        Flexible(
          child: Text(label, style: TextStyle(fontSize: 12, color: color)),
        ),
      ],
    );
  }
}
