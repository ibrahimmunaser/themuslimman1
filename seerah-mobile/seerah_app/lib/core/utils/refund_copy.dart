import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

/// Refund copy shared by every purchase surface (landing + pricing).
///
/// All native purchases go through Apple/Google IAP — unlike the web
/// checkout (Stripe), the company doesn't hold the funds and can't
/// unilaterally "give a full refund" just by being contacted. Refunds have
/// to be requested through the store the purchase was made in. The old
/// web-copied wording ("contact us within 7 days for a full refund") was
/// misleading on mobile and would just generate support emails that can't
/// actually be actioned directly.
///
/// Kept in one place so a future wording fix can't be applied to one screen
/// and missed on the other — the same class of bug that previously caused
/// an App Store rejection for the auto-renewal disclosure
/// (see subscription_legal_text.dart).

/// Short tagline used near the buy buttons (e.g. "Refundable via App Store
/// · Instant access · Cancel anytime").
String refundBadgeText() {
  if (!kIsWeb && Platform.isIOS) return 'Refundable via App Store';
  if (!kIsWeb && Platform.isAndroid) return 'Refundable via Google Play';
  return '7-day refund guarantee';
}

/// Full FAQ-length answer to "Is there a refund guarantee?".
String refundGuaranteeAnswer() {
  if (!kIsWeb && Platform.isIOS) {
    return 'Yes. Purchases are refunded through Apple — request one at '
        'reportaproblem.apple.com or via Settings > [your name] > '
        'Subscriptions on your device, generally within 90 days of purchase. '
        "We're also happy to help if you have any issues — just reach out.";
  }
  if (!kIsWeb && Platform.isAndroid) {
    return 'Yes. Purchases are refunded through Google Play — request one '
        'from the Google Play app under Menu > Payments & subscriptions '
        'within 48 hours, or contact Google Play support after that. '
        "We're also happy to help if you have any issues — just reach out.";
  }
  return 'Yes. If the course is not what you expected, contact us within 7 days for a full refund.';
}
