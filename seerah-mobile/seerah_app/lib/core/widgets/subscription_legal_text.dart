import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/app_constants.dart';
import '../providers/part_provider.dart';
import '../theme/app_colors.dart';
import '../../l10n/app_strings.dart';

/// Auto-renewal / subscription-terms disclosure required by Apple Guideline
/// 3.1.2(c) — shared by every purchase surface (landing + pricing) so a
/// future wording fix can't be applied to one screen and missed on the
/// other, which is exactly how this app got rejected under 3.1.2(c) before.
///
/// Rendered twice per screen: a [compact] copy placed directly under the
/// plan tiles (in the viewport a reviewer/user sees *before* scrolling past
/// the Buy buttons) and the full version further down the page for anyone
/// who wants the complete text.
class SubscriptionLegalText extends ConsumerStatefulWidget {
  final void Function(String url) onOpenUrl;
  final bool compact;
  const SubscriptionLegalText({
    super.key,
    required this.onOpenUrl,
    this.compact = false,
  });

  @override
  ConsumerState<SubscriptionLegalText> createState() => _SubscriptionLegalTextState();
}

class _SubscriptionLegalTextState extends ConsumerState<SubscriptionLegalText> {
  static const _baseUrl = AppConstants.baseUrl;
  late final TapGestureRecognizer _privacyRecognizer;
  late final TapGestureRecognizer _termsRecognizer;

  @override
  void initState() {
    super.initState();
    _privacyRecognizer = TapGestureRecognizer()
      ..onTap = () => widget.onOpenUrl('$_baseUrl/privacy');
    _termsRecognizer = TapGestureRecognizer()
      ..onTap = () => widget.onOpenUrl('$_baseUrl/terms');
  }

  @override
  void dispose() {
    _privacyRecognizer.dispose();
    _termsRecognizer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(courseLangProvider);
    final style = TextStyle(
      color: AppColors.textMuted,
      fontSize: widget.compact ? 10.5 : 11,
      height: 1.5,
    );
    final linkStyle = style.copyWith(
      color: AppColors.textSecondary,
      decoration: TextDecoration.underline,
      decorationColor: AppColors.textSecondary,
    );

    final bodyText = t(lang, widget.compact ? 'subLegalCompact' : 'subLegalFull');

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: RichText(
        textAlign: TextAlign.center,
        text: TextSpan(
          style: style,
          children: [
            TextSpan(text: bodyText),
            TextSpan(
              text: t(lang, 'privacyPolicyTitle'),
              style: linkStyle,
              recognizer: _privacyRecognizer,
            ),
            const TextSpan(text: '  ·  '),
            TextSpan(
              text: t(lang, 'termsOfUseTitle'),
              style: linkStyle,
              recognizer: _termsRecognizer,
            ),
          ],
        ),
      ),
    );
  }
}
