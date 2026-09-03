import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;
import '../../l10n/app_strings.dart';

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
String refundBadgeText(String lang) {
  if (!kIsWeb && Platform.isIOS) return t(lang, 'refundableAppStore');
  if (!kIsWeb && Platform.isAndroid) return t(lang, 'refundableGooglePlay');
  return t(lang, 'refund7DayGuarantee');
}

/// Full FAQ-length answer to "Is there a refund guarantee?".
String refundGuaranteeAnswer(String lang) {
  if (!kIsWeb && Platform.isIOS) return t(lang, 'refundAnswerIos');
  if (!kIsWeb && Platform.isAndroid) return t(lang, 'refundAnswerAndroid');
  return t(lang, 'refundAnswerDefault');
}
