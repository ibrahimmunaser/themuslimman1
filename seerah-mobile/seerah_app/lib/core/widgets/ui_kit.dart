import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Shared visual tokens and reusable UI building blocks.
class AppDecorations {
  static BoxDecoration card({Color? borderColor, Color? background}) =>
      BoxDecoration(
        color: background ?? AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor ?? AppColors.border),
      );

  static BoxDecoration goldHero() => BoxDecoration(
    gradient: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [
        AppColors.gold.withValues(alpha: 0.18),
        AppColors.surface,
        AppColors.background,
      ],
    ),
    borderRadius: BorderRadius.circular(18),
    border: Border.all(color: AppColors.gold.withValues(alpha: 0.28)),
    boxShadow: [
      BoxShadow(
        color: AppColors.gold.withValues(alpha: 0.08),
        blurRadius: 24,
        offset: const Offset(0, 8),
      ),
    ],
  );

  static BoxDecoration eraAccent(Color color) => BoxDecoration(
    gradient: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [color.withValues(alpha: 0.22), color.withValues(alpha: 0.06)],
    ),
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: color.withValues(alpha: 0.35)),
  );
}

/// Full-screen subtle background used on main tabs.
class AppGradientBackground extends StatelessWidget {
  final Widget child;
  const AppGradientBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: RadialGradient(
          center: Alignment(0, -0.55),
          radius: 1.4,
          colors: [Color(0xFF141008), AppColors.background],
        ),
      ),
      child: child,
    );
  }
}

class SectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final double topPadding;

  const SectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
    this.topPadding = 20,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(16, topPadding, 16, 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.3,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 3),
                  Text(
                    subtitle!,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                      height: 1.35,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

class PageIntroCard extends StatelessWidget {
  final String eyebrow;
  final String title;
  final String description;
  final IconData? icon;

  const PageIntroCard({
    super.key,
    required this.eyebrow,
    required this.title,
    required this.description,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      padding: const EdgeInsets.all(18),
      decoration: AppDecorations.goldHero(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (icon != null) ...[
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.gold.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: AppColors.gold.withValues(alpha: 0.25),
                    ),
                  ),
                  child: Icon(icon, color: AppColors.gold, size: 18),
                ),
                const SizedBox(width: 10),
              ],
              Expanded(
                child: Text(
                  eyebrow.toUpperCase(),
                  style: const TextStyle(
                    color: AppColors.gold,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.1,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 22,
              fontWeight: FontWeight.w800,
              height: 1.2,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            description,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}

class StatTile extends StatelessWidget {
  final String value;
  final String label;
  final Color? accent;

  const StatTile({
    super.key,
    required this.value,
    required this.label,
    this.accent,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: AppDecorations.card(),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                color: accent ?? AppColors.gold,
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 11,
                fontWeight: FontWeight.w500,
                height: 1.25,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class TappableCard extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry margin;
  final Color? borderColor;

  const TappableCard({
    super.key,
    required this.child,
    this.onTap,
    this.margin = const EdgeInsets.fromLTRB(16, 0, 16, 10),
    this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: margin,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Ink(
            decoration: AppDecorations.card(borderColor: borderColor),
            child: child,
          ),
        ),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.card,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.gold.withValues(alpha: 0.06),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Icon(icon, color: AppColors.textMuted, size: 34),
            ),
            const SizedBox(height: 18),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w600,
                letterSpacing: -0.2,
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 6),
              Text(
                subtitle!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                  height: 1.45,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class AppSearchField extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final VoidCallback? onClear;
  final String hint;

  const AppSearchField({
    super.key,
    required this.controller,
    required this.onChanged,
    this.onClear,
    this.hint = 'Search…',
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      style: const TextStyle(color: AppColors.textPrimary, fontSize: 15),
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: const Icon(
          Icons.search_rounded,
          size: 22,
          color: AppColors.textMuted,
        ),
        suffixIcon: onClear != null
            ? IconButton(
                icon: const Icon(
                  Icons.close_rounded,
                  size: 18,
                  color: AppColors.textMuted,
                ),
                tooltip: 'Clear',
                onPressed: onClear,
              )
            : null,
        filled: true,
        fillColor: AppColors.card,
        contentPadding: const EdgeInsets.symmetric(vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(
            color: AppColors.gold.withValues(alpha: 0.7),
            width: 1.5,
          ),
        ),
      ),
    );
  }
}

class GoldBadge extends StatelessWidget {
  final String label;
  const GoldBadge(this.label, {super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.gold.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: AppColors.gold,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

/// Shown on dashboard/progress screens when progressProvider's most recent
/// sync/push attempt failed (offline, transient server error, etc.) — see
/// ProgressState.syncFailed. Previously such failures were only ever
/// debugPrint'd, so a user could keep studying offline for a long session
/// with no indication that none of it was reaching the server, and no way to
/// retry short of force-quitting the app (pull-to-refresh calls
/// progressProvider's manualRefresh(), which this banner's copy references).
/// Audit M-fallback-price: neutral placeholder shown in a plan tile's price
/// slot while real store pricing is still loading, instead of eagerly
/// rendering a hardcoded USD fallback price that doesn't reflect
/// Apple/Google's actual per-region, per-currency pricing for this user.
class PriceLoadingPlaceholder extends StatelessWidget {
  const PriceLoadingPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 44,
          height: 16,
          decoration: BoxDecoration(
            color: AppColors.border,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(height: 5),
        Container(
          width: 28,
          height: 9,
          decoration: BoxDecoration(
            color: AppColors.border.withValues(alpha: 0.6),
            borderRadius: BorderRadius.circular(3),
          ),
        ),
      ],
    );
  }
}

/// Audit M-verifying-wait: `IAPStatus.verifying` covers up to 3 retried HTTP
/// calls to /api/mobile-purchases/verify, each with a 20s connect + 30s
/// receive timeout (see ApiClient) — worst case, nearly two minutes with the
/// UI showing nothing but a bare 22x22 spinner icon next to the plan the
/// user tapped. With no text explaining that a wait is normal (StoreKit/Play
/// Billing receipt validation genuinely can be slow) or warning against
/// backing out, a user could reasonably assume the app froze and force-quit
/// mid-verification — which on iOS would still leave the purchase sitting
/// completed in the StoreKit queue, only recoverable via Restore Purchases.
class VerifyingPurchaseBanner extends StatelessWidget {
  const VerifyingPurchaseBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.goldFaded,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          const SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator.adaptive(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.gold),
            ),
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              'Verifying your purchase — this can take up to a minute. '
              "Please don't close the app.",
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Audit M1 fix: previously a private `_RecoveryBanner` defined only inside
/// landing_screen.dart (the pre-login pricing view) — a purchase can end up
/// queued in IAPState.pendingLinkPurchases while the user was logged out
/// (e.g. a renewal replayed before guest-session creation succeeded), and
/// then still be sitting there unclaimed by the time they're logged in and
/// viewing pricing_screen.dart (the post-login upsell/upgrade screen)
/// instead — which had no way at all to surface or claim it. Promoted here
/// so both pricing surfaces show the identical banner.
class PendingPurchaseRecoveryBanner extends StatelessWidget {
  final VoidCallback onClaim;
  /// pendingLinkPurchases is a list — more than one unclaimed purchase can
  /// genuinely queue up — so the copy needs to reflect that instead of
  /// always implying exactly one.
  final int count;
  const PendingPurchaseRecoveryBanner({super.key, required this.onClaim, required this.count});

  @override
  Widget build(BuildContext context) {
    final label = count > 1
        ? 'You have $count pending purchases — tap Claim to unlock access. No account required.'
        : 'You have a pending purchase — tap Claim to unlock access. No account required.';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.gold.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          const Icon(Icons.receipt_long_rounded, color: AppColors.gold, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                  color: AppColors.textPrimary, fontSize: 13, height: 1.4),
            ),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: onClaim,
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              minimumSize: const Size(48, 44),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text('Claim',
                style: TextStyle(
                    color: AppColors.gold,
                    fontSize: 13,
                    fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.cloud_off_rounded,
            size: 16,
            color: AppColors.textMuted,
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              "Couldn't reach the server — showing your last saved progress. Pull down to retry.",
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
