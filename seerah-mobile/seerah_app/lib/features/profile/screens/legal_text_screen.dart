import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/adaptive_icons.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../core/providers/part_provider.dart';
import '../../../l10n/app_strings.dart';

/// Shared renderer for the native Privacy Policy and Terms of Use screens.
///
/// Per product decision, the legal body text itself stays English-only —
/// standard practice for legal documents, avoiding translation-accuracy
/// risk for binding language — while the screen chrome (title, back
/// button, "Last updated" label) still translates with the rest of the
/// app. This intentionally does NOT replace `legal_web_screen.dart`, which
/// must keep loading the live website for Apple Guideline 3.1.2(c)
/// purchase-flow legal links.
class LegalTextScreen extends ConsumerWidget {
  final String titleKey;
  final IconData headerIcon;
  final List<LegalSection> sections;
  const LegalTextScreen({
    super.key,
    required this.titleKey,
    required this.headerIcon,
    required this.sections,
  });

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
        title: Text(t(lang, titleKey),
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
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.gold.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.gold.withValues(alpha: 0.2)),
                  ),
                  child: Icon(headerIcon, color: AppColors.gold, size: 20),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        t(lang, titleKey),
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        // "Last updated" label translates; the date itself is
                        // plain data, same source as the website's lastUpdated.
                        tv(lang, 'legalLastUpdated', const {'date': 'May 2026'}),
                        style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 28),
            for (final section in sections) ...[
              Text(
                section.heading,
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),
              for (final para in section.paragraphs)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Text(
                    para,
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 13.5, height: 1.55),
                  ),
                ),
              if (section.bullets != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10, left: 4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: section.bullets!
                        .map((b) => Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: EdgeInsets.only(top: 6, right: 8),
                                    child: Icon(Icons.circle, size: 4, color: AppColors.textMuted),
                                  ),
                                  Expanded(
                                    child: Text(
                                      b,
                                      style: TextStyle(
                                          color: AppColors.textSecondary, fontSize: 13.5, height: 1.55),
                                    ),
                                  ),
                                ],
                              ),
                            ))
                        .toList(),
                  ),
                ),
              const SizedBox(height: 14),
            ],
          ],
        ),
      ),
    );
  }
}

class LegalSection {
  final String heading;
  final List<String> paragraphs;
  final List<String>? bullets;
  const LegalSection({required this.heading, required this.paragraphs, this.bullets});
}

// ── Content: verbatim from the website's app/privacy/page.tsx ─────────────
List<LegalSection> privacySections() => const [
      LegalSection(
        heading: '1. Overview',
        paragraphs: [
          'This Privacy Policy explains how Complete Seerah ("we," "our," or "the platform") collects, uses, and protects your personal data when you use our website and course platform. We take your privacy seriously.',
        ],
      ),
      LegalSection(
        heading: '2. Data We Collect',
        paragraphs: [
          'Account Data: When you create an account, we collect your name and email address. This is required to provide access to your purchased content and to send essential account communications (email verification, password resets, purchase confirmation).',
          'Purchase Data: We record what plan you purchased and when, to manage your access rights. Payment details (card numbers, billing address) are collected and stored entirely by Stripe — we never see or store your payment card information.',
          'Progress Data: We track your course progress (which parts you have viewed, quiz scores, completion status) to power your dashboard, progress reports, and personalized experience.',
          'Support Data: If you contact us through the contact form or by email, we store your message to respond to your request. This data is not shared with third parties.',
        ],
      ),
      LegalSection(
        heading: '3. Payment Processing',
        paragraphs: [
          "Payments are processed by Stripe. When you check out, your payment information goes directly to Stripe's secure servers. We receive a confirmation from Stripe once payment is complete but never handle your raw payment data. Stripe's privacy policy applies to the payment process.",
        ],
      ),
      LegalSection(
        heading: '4. Analytics',
        paragraphs: [
          'We may use Vercel Analytics to understand aggregate page view data (e.g., which pages are most visited). This data is anonymized and does not identify individual users. No third-party advertising trackers are used on this platform.',
        ],
      ),
      LegalSection(
        heading: '5. Cookies and Sessions',
        paragraphs: [
          'We use a single secure, HTTP-only session cookie to keep you logged in. This cookie contains a session token only — no personal data is stored in the cookie itself. The session expires automatically after 30 days of inactivity or when you log out.',
          'No advertising cookies or third-party tracking cookies are set by this platform.',
        ],
      ),
      LegalSection(
        heading: '6. Data Storage',
        paragraphs: [
          'Account and progress data is stored in a PostgreSQL database hosted on Supabase (cloud-hosted, US-based). Course media files (videos, slides, etc.) are stored on Cloudflare R2.',
        ],
      ),
      LegalSection(
        heading: '7. Your Rights',
        paragraphs: [
          'You have the right to:',
        ],
        bullets: [
          'Request a copy of the personal data we hold about you',
          'Request correction of inaccurate data',
          'Request deletion of your account and associated data',
          'Withdraw consent for optional communications',
        ],
      ),
      LegalSection(
        heading: "8. Children's Privacy",
        paragraphs: [
          'This platform is not directed at children under 13. We do not knowingly collect personal data from children under 13. If you believe we have done so, please contact us immediately.',
        ],
      ),
      LegalSection(
        heading: '9. Changes to This Policy',
        paragraphs: [
          'We may update this Privacy Policy from time to time. We will notify you of significant changes via email if you have an account with us.',
        ],
      ),
      LegalSection(
        heading: '10. Contact',
        paragraphs: [
          'Privacy questions? Contact us from the Support section of this app, or email themuslimman77@gmail.com.',
        ],
      ),
    ];

// ── Content: verbatim from the website's app/terms/page.tsx ───────────────
List<LegalSection> termsSections() => const [
      LegalSection(
        heading: '1. Acceptance',
        paragraphs: [
          'By creating an account or purchasing access to Complete Seerah ("the Course"), you agree to these Terms of Service. If you do not agree, do not use the service.',
        ],
      ),
      LegalSection(
        heading: '2. Digital Course Access',
        paragraphs: [
          'Access to the Course is provided on a recurring monthly subscription basis. Upon successful payment, you receive personal, non-transferable access to the Course content for the duration of your active billing period. Your subscription automatically renews each month until you cancel. All content is delivered digitally through this platform. No physical materials are shipped.',
          'Customers who purchased a one-time, lifetime-access plan prior to its discontinuation keep the lifetime access granted under the terms in effect at the time of that purchase. "Lifetime access" for those customers means access for as long as this platform operates. We reserve the right to discontinue the platform with reasonable notice if we are unable to maintain it.',
        ],
      ),
      LegalSection(
        heading: '3. Account Responsibility',
        paragraphs: [
          'You are responsible for maintaining the confidentiality of your login credentials. You may not share your account with others. Each purchase grants access to one individual only. You are responsible for all activity that occurs under your account.',
        ],
      ),
      LegalSection(
        heading: '4. Acceptable Use',
        paragraphs: [
          'You agree not to:',
        ],
        bullets: [
          'Share, redistribute, or resell Course content in any form',
          'Download, copy, screen-record, or mass-save Course materials beyond personal study notes',
          'Use automated tools to scrape or extract content from this platform',
          'Share your login credentials with anyone else',
          'Use the Course for commercial purposes, teaching, or public distribution without written consent',
          'Circumvent or attempt to circumvent content access restrictions',
        ],
      ),
      LegalSection(
        heading: '5. Educational Purpose',
        paragraphs: [
          'This Course is provided for personal Islamic education and enrichment. The content is based on established Seerah scholarship and is intended to help you understand the life of the Prophet ﷺ. It is not a substitute for formal religious instruction or scholarly guidance.',
        ],
      ),
      LegalSection(
        heading: '6. Payment Terms',
        paragraphs: [
          'All prices are in USD. Payments are processed securely through Stripe. Your payment details are handled by Stripe and are not stored on our servers. By completing a purchase, you authorize the charge to your payment method.',
          'Access is granted only after payment is confirmed. In rare cases, access may be delayed briefly while payment processing completes.',
        ],
      ),
      LegalSection(
        heading: '7. Refund Policy',
        paragraphs: [
          "We offer a 7-Day Clarity Guarantee. If the course is not what you expected, contact us within 7 days of purchase for a full refund. See our Refund Policy on themuslimman.com for full details and conditions.",
        ],
      ),
      LegalSection(
        heading: '8. Intellectual Property',
        paragraphs: [
          'All Course content — including videos, audio, slides, infographics, mind maps, quizzes, and written materials — is owned by TheMuslimMan and protected by copyright. You may not reproduce, distribute, or create derivative works from this content.',
        ],
      ),
      LegalSection(
        heading: '9. Limitation of Liability',
        paragraphs: [
          'The Course is provided "as is." We make no warranties about uninterrupted access or fitness for any particular purpose. Our total liability to you shall not exceed the amount you paid for access to the Course.',
        ],
      ),
      LegalSection(
        heading: '10. Changes to Terms',
        paragraphs: [
          'We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms.',
        ],
      ),
      LegalSection(
        heading: '11. Contact',
        paragraphs: [
          'Questions about these terms? Contact us from the Support section of this app, or email themuslimman77@gmail.com.',
        ],
      ),
    ];
