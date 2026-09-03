import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../l10n/app_strings.dart';

class AuthField extends ConsumerStatefulWidget {
  final String label;
  final String? hint;
  final TextEditingController controller;
  final bool obscure;
  final TextInputType keyboardType;
  final TextInputAction textInputAction;
  final String? Function(String?)? validator;
  final void Function(String)? onFieldSubmitted;

  const AuthField({
    super.key,
    required this.label,
    this.hint,
    required this.controller,
    this.obscure = false,
    this.keyboardType = TextInputType.text,
    this.textInputAction = TextInputAction.next,
    this.validator,
    this.onFieldSubmitted,
  });

  @override
  ConsumerState<AuthField> createState() => _AuthFieldState();
}

class _AuthFieldState extends ConsumerState<AuthField> {
  bool _hidden = true;

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(courseLangProvider);
    return TextFormField(
      controller: widget.controller,
      obscureText: widget.obscure && _hidden,
      keyboardType: widget.keyboardType,
      textInputAction: widget.textInputAction,
      validator: widget.validator,
      onFieldSubmitted: widget.onFieldSubmitted,
      style: const TextStyle(color: AppColors.textPrimary, fontSize: 15),
      decoration: InputDecoration(
        labelText: widget.label,
        hintText: widget.hint,
        suffixIcon: widget.obscure
            ? IconButton(
                icon: Icon(
                  _hidden ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: AppColors.textMuted,
                  size: 20,
                ),
                tooltip: _hidden ? t(lang, 'showPassword') : t(lang, 'hidePassword'),
                onPressed: () => setState(() => _hidden = !_hidden),
              )
            : null,
      ),
    );
  }
}
