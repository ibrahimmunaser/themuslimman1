import 'package:flutter/material.dart';

/// Brand logos copied from the web/desktop app (`public/images/`).
class AppAssets {
  static const dashboardLogo = 'assets/images/logodashboard.png';
  static const wordmarkLogo = 'assets/images/logoicon.png';
}

/// Square dashboard icon — used in the desktop sidebar and login form.
class AppLogo extends StatelessWidget {
  final double size;
  final double borderRadius;

  const AppLogo({
    super.key,
    this.size = 48,
    this.borderRadius = 12,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: Image.asset(
        AppAssets.dashboardLogo,
        width: size,
        height: size,
        fit: BoxFit.cover,
        semanticLabel: 'Complete Seerah',
      ),
    );
  }
}

/// Full wordmark — used in the desktop auth header.
class AppWordmark extends StatelessWidget {
  final double height;

  const AppWordmark({super.key, this.height = 44});

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      AppAssets.wordmarkLogo,
      height: height,
      fit: BoxFit.contain,
      semanticLabel: 'The Muslim Man',
    );
  }
}
