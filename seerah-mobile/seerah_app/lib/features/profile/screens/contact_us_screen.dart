import 'package:flutter/material.dart' hide Text;
import 'package:flutter/material.dart' as m show Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/adaptive_icons.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../core/providers/part_provider.dart';
import '../../../l10n/app_strings.dart';

const String _kSupportEmail = 'themuslimman77@gmail.com';

/// Native, fully-translated replacement for the old WebView-based Contact
/// Us page. Skips replicating the website's backend message-submission
/// form; instead opens the device's mail app via a mailto: link, which
/// needs no new API wiring and works fully offline-first.
class ContactUsScreen extends ConsumerWidget {
  const ContactUsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
        title: Text(t(lang, 'contactUs'),
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
            Text(
              t(lang, 'contactUsSubtitle'),
              style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.4),
            ),
            const SizedBox(height: 24),

            // The email itself is forced LTR via _InfoCard (see its
            // Directionality wrapper) — in RTL languages (ar/ur/fa) an
            // auto-detected bidi direction can visually reorder the
            // "@"/"." separators in an all-Latin address, making it
            // unreadable/un-copyable even though the underlying string
            // is correct.
            _InfoCard(
              icon: Icons.email_outlined,
              color: const Color(0xFF8A7AB0),
              title: t(lang, 'contactEmailCard'),
              subtitle: _kSupportEmail,
              forceLtrSubtitle: true,
            ),
            const SizedBox(height: 12),
            _InfoCard(
              icon: Icons.schedule_outlined,
              color: const Color(0xFF4AA87E),
              title: t(lang, 'contactResponseCard'),
              subtitle: t(lang, 'contactResponseTime'),
            ),

            const SizedBox(height: 28),

            SizedBox(
              height: 50,
              child: ElevatedButton.icon(
                onPressed: () => _sendEmail(context, lang),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.mail_outline_rounded, size: 18),
                label: Text(
                  t(lang, 'sendUsAnEmail'),
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _sendEmail(BuildContext context, String lang) async {
    final uri = Uri(
      scheme: 'mailto',
      path: _kSupportEmail,
      query: 'subject=${Uri.encodeComponent('Complete Seerah — Support')}',
    );
    try {
      final launched = await launchUrl(uri);
      if (launched) return;
    } catch (_) {}
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(tv(lang, 'couldNotOpenEmailApp', {'email': _kSupportEmail})),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final bool forceLtrSubtitle;
  const _InfoCard({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    this.forceLtrSubtitle = false,
  });

  @override
  Widget build(BuildContext context) {
    // Plain (non-numeral-localizing) Text for forceLtrSubtitle: the support
    // email is an identifier, not prose — rendering its digits as Arabic-
    // Indic/other localized numeral glyphs (as the app's custom Text
    // override normally does everywhere else) would make it harder to
    // read back and manually retype correctly.
    final subtitleText = forceLtrSubtitle
        ? m.Text(
            subtitle,
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.3),
          )
        : Text(
            subtitle,
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.3),
          );
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                forceLtrSubtitle
                    ? Directionality(textDirection: TextDirection.ltr, child: subtitleText)
                    : subtitleText,
              ],
            ),
          ),
        ],
      ),
    );
  }
}
