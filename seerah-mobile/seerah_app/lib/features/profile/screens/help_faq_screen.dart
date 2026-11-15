import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/adaptive_icons.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../core/providers/part_provider.dart';
import '../../../l10n/app_strings.dart';

/// Native, fully-translated replacement for the old WebView-based Help &
/// FAQ page. Content is a curated subset of the website's /help page
/// (app/help/page.tsx) — the dynamic "current price" Q&A is replaced with
/// a pointer to Billing & Subscription instead (see faqQPayment/faqAPayment
/// in app_strings.dart), since this screen has no live Stripe price to show.
class HelpFaqScreen extends ConsumerWidget {
  const HelpFaqScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(courseLangProvider);

    final categories = <_FaqCategory>[
      _FaqCategory(
        title: t(lang, 'faqCatGettingStarted'),
        icon: Icons.rocket_launch_outlined,
        color: const Color(0xFF4AA87E),
        items: [
          _FaqItem(t(lang, 'faqQAccess'), t(lang, 'faqAAccess')),
          _FaqItem(t(lang, 'faqQIncludes'), t(lang, 'faqAIncludes')),
        ],
      ),
      _FaqCategory(
        title: t(lang, 'faqCatCourseAccess'),
        icon: Icons.menu_book_outlined,
        color: const Color(0xFF5A90B0),
        items: [
          _FaqItem(t(lang, 'faqQStructure'), t(lang, 'faqAStructure')),
          _FaqItem(t(lang, 'faqQOrder'), t(lang, 'faqAOrder')),
        ],
      ),
      _FaqCategory(
        title: t(lang, 'faqCatAccountBilling'),
        icon: Icons.receipt_long_outlined,
        color: AppColors.gold,
        items: [
          _FaqItem(t(lang, 'faqQPayment'), t(lang, 'faqAPayment')),
          _FaqItem(t(lang, 'faqQRefund'), t(lang, 'faqARefund')),
        ],
      ),
      _FaqCategory(
        title: t(lang, 'faqCatCertificate'),
        icon: Icons.workspace_premium_outlined,
        color: const Color(0xFF8A7AB0),
        items: [
          _FaqItem(t(lang, 'faqQCertHow'), t(lang, 'faqACertHow')),
          _FaqItem(t(lang, 'faqQCertOfficial'), t(lang, 'faqACertOfficial')),
        ],
      ),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        leading: IconButton(
          icon: const BackIcon(size: 20),
          tooltip: t(lang, 'back'),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(t(lang, 'helpAndFaq'),
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
              t(lang, 'helpFaqSubtitle'),
              style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.4),
            ),
            const SizedBox(height: 24),
            for (final cat in categories) ...[
              _CategoryHeader(cat: cat),
              const SizedBox(height: 10),
              ...cat.items.map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _FaqTile(item: item),
                  )),
              const SizedBox(height: 14),
            ],
          ],
        ),
      ),
    );
  }
}

class _FaqCategory {
  final String title;
  final IconData icon;
  final Color color;
  final List<_FaqItem> items;
  const _FaqCategory({required this.title, required this.icon, required this.color, required this.items});
}

class _FaqItem {
  final String question;
  final String answer;
  const _FaqItem(this.question, this.answer);
}

class _CategoryHeader extends StatelessWidget {
  final _FaqCategory cat;
  const _CategoryHeader({required this.cat});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: cat.color.withValues(alpha: 0.14),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(cat.icon, color: cat.color, size: 15),
        ),
        const SizedBox(width: 10),
        Text(
          cat.title,
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _FaqTile extends StatefulWidget {
  final _FaqItem item;
  const _FaqTile({required this.item});

  @override
  State<_FaqTile> createState() => _FaqTileState();
}

class _FaqTileState extends State<_FaqTile> {
  bool _open = false;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.card,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => setState(() => _open = !_open),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      widget.item.question,
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Icon(
                    _open ? Icons.remove_rounded : Icons.add_rounded,
                    color: AppColors.textMuted,
                    size: 18,
                  ),
                ],
              ),
              if (_open) ...[
                const SizedBox(height: 10),
                Text(
                  widget.item.answer,
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
