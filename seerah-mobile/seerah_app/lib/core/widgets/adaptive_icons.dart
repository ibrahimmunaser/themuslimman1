import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

/// "Navigate back" chevron that matches OS conventions: iOS gets the
/// Cupertino-style chevron the rest of the app was designed around,
/// Android (and any other platform) gets Material's own arrow_back, which
/// is what Android users expect from every other Material app on their
/// device. Previously every back button in the app hardcoded the iOS glyph
/// unconditionally, so it read as visually foreign — like a copy-pasted iOS
/// screenshot — on every Android screen.
class BackIcon extends StatelessWidget {
  final double? size;
  final Color? color;
  const BackIcon({super.key, this.size, this.color});

  @override
  Widget build(BuildContext context) {
    final isIOS = !kIsWeb && Platform.isIOS;
    return Icon(
      isIOS ? Icons.arrow_back_ios_new_rounded : Icons.arrow_back_rounded,
      size: size,
      color: color,
    );
  }
}

/// Same rationale as [BackIcon] but for "forward"/"next" affordances (e.g. a
/// list-row disclosure chevron or a "next" carousel/onboarding arrow).
class ForwardChevronIcon extends StatelessWidget {
  final double? size;
  final Color? color;
  const ForwardChevronIcon({super.key, this.size, this.color});

  @override
  Widget build(BuildContext context) {
    final isIOS = !kIsWeb && Platform.isIOS;
    return Icon(
      isIOS ? Icons.arrow_forward_ios_rounded : Icons.chevron_right_rounded,
      size: size,
      color: color,
    );
  }
}

/// Share icon: iOS's "share sheet" glyph (a box with an upward arrow) is a
/// well-known iOS-only visual convention — Android's Material share icon
/// (two nodes joined by lines) is what's shown throughout the rest of the
/// OS's own share affordances, so using the iOS glyph unconditionally on
/// Android looks out of place next to every other share button on the
/// device.
class AdaptiveShareIcon extends StatelessWidget {
  final double? size;
  final Color? color;
  const AdaptiveShareIcon({super.key, this.size, this.color});

  @override
  Widget build(BuildContext context) {
    final isIOS = !kIsWeb && Platform.isIOS;
    return Icon(
      isIOS ? Icons.ios_share_rounded : Icons.share_rounded,
      size: size,
      color: color,
    );
  }
}
