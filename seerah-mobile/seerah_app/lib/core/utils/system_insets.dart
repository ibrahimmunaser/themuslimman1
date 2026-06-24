import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// Bottom inset for content above the system navigation bar.
///
/// On some Android devices [MediaQuery.padding] reports 0 while the 3-button
/// nav bar still overlaps app content. [viewPadding] is checked first; a
/// conservative Android fallback is used when both are zero.
double bottomSystemInset(BuildContext context) {
  final media = MediaQuery.of(context);
  final reported = math.max(media.viewPadding.bottom, media.padding.bottom);
  if (reported > 0) return reported;

  if (defaultTargetPlatform == TargetPlatform.android) {
    return 48;
  }
  return 0;
}
