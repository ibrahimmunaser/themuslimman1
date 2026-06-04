import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/iap_provider.dart';
import '../../../core/theme/app_colors.dart';

class PricingScreen extends ConsumerStatefulWidget {
  const PricingScreen({super.key});

  @override
  ConsumerState<PricingScreen> createState() => _PricingScreenState();
}

class _PricingScreenState extends ConsumerState<PricingScreen> {
  bool _monthlySelected = false;

  @override
  void initState() {
    super.initState();
    // iapProvider is already eagerly initialised in main.dart (B5 fix).
    // Reading it here ensures the state is warm before the first build.
    ref.read(iapProvider);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  String _productId(bool monthly, bool family) {
    if (monthly) return family ? AppConstants.iapMonthlyFamily : AppConstants.iapMonthlyIndividual;
    return family ? AppConstants.iapLifetimeFamily : AppConstants.iapLifetimeIndividual;
  }

  String _fallbackPrice(bool monthly, bool family) {
    if (monthly) return family ? '\$${AppConstants.familyMonthlyPrice}/mo' : '\$${AppConstants.monthlyPrice}/mo';
    return family ? '\$${AppConstants.familyLifetimePrice}' : '\$${AppConstants.lifetimePrice}';
  }

  /// Returns the store-localised price string, or the hard-coded fallback while products load.
  String _displayPrice(IAPState iap, bool monthly, bool family) {
    final id = _productId(monthly, family);
    final product = iap.productFor(id);
    return product?.price ?? _fallbackPrice(monthly, family);
  }

  void _buy(IAPState iap, bool monthly, bool family) {
    if (!iap.isAvailable) {
      _showSnack('In-app purchases are not available on this device.');
      return;
    }
    final id = _productId(monthly, family);
    final product = iap.productFor(id);
    if (product == null) {
      // B7: should not reach here — the button is disabled when product is null.
      _showSnack('Product unavailable. Tap Retry to reload from the store.');
      return;
    }
    ref.read(iapProvider.notifier).buy(product);
  }

  /// True when the store is available and products have finished loading but
  /// this specific product was not returned by queryProductDetails.
  bool _isProductMissing(IAPState iap, bool monthly, bool family) {
    if (!iap.isAvailable) return false;
    if (iap.status == IAPStatus.loading) return false;
    return iap.productFor(_productId(monthly, family)) == null;
  }

  void _showSnack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), behavior: SnackBarBehavior.floating),
    );
  }

  // ── Lifecycle listeners ─────────────────────────────────────────────────────

  void _onIAPStateChange(IAPState? prev, IAPState next) {
    if (next.status == IAPStatus.success && prev?.status != IAPStatus.success) {
      _showSuccessBanner();
      ref.read(iapProvider.notifier).clearSuccess();
    }

    if (next.status == IAPStatus.error && next.errorMessage != null &&
        prev?.errorMessage != next.errorMessage) {
      _showSnack(next.errorMessage!);
      ref.read(iapProvider.notifier).clearError();
    }

    if (next.status == IAPStatus.cancelled && prev?.status == IAPStatus.purchasing) {
      _showSnack('Purchase cancelled.');
    }

    // B6 fix: restorePurchases() completed with no prior purchases found.
    if (next.status == IAPStatus.restoreEmpty && prev?.status != IAPStatus.restoreEmpty) {
      _showSnack('No previous purchases found to restore.');
      ref.read(iapProvider.notifier).clearError();
    }
  }

  void _showSuccessBanner() {
    if (!mounted) return;
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: AppColors.success),
            SizedBox(width: 10),
            Text('JazakAllahu Khayran!', style: TextStyle(color: AppColors.textPrimary, fontSize: 18)),
          ],
        ),
        content: const Text(
          'Your purchase was successful. Full access has been unlocked. May Allah bless your learning.',
          style: TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Start Learning', style: TextStyle(color: AppColors.gold)),
          ),
        ],
      ),
    );
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    // Listen for state changes to show snackbars / dialogs.
    ref.listen<IAPState>(iapProvider, _onIAPStateChange);

    final auth = ref.watch(authProvider);
    final iap  = ref.watch(iapProvider);
    final hasAccess = auth.hasAccess;

    final isBusy = iap.status == IAPStatus.purchasing ||
        iap.status == IAPStatus.verifying ||
        iap.status == IAPStatus.loading;

    final showRetry = iap.isAvailable &&
        iap.status == IAPStatus.idle &&
        iap.products.isEmpty;

    return Scaffold(
      appBar: AppBar(title: const Text('Plans & Pricing')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // ── Access banner ──────────────────────────────────────────────────
          if (hasAccess) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.success.withValues(alpha: 0.4)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.check_circle, color: AppColors.success, size: 20),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'You have full access to the course',
                      style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],

          // ── Store unavailable warning ──────────────────────────────────────
          if (!iap.isAvailable && iap.status != IAPStatus.loading)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, color: AppColors.textMuted, size: 18),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Store products are unavailable. Make sure you are signed in to the App Store / Google Play.',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // B7 fix: retry banner when store responded but returned no products.
          if (showRetry)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_outlined, color: AppColors.textMuted, size: 18),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        'Products could not be loaded from the store.',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                      ),
                    ),
                    TextButton(
                      onPressed: () => ref.read(iapProvider.notifier).reloadProducts(),
                      child: const Text('Retry', style: TextStyle(color: AppColors.gold, fontSize: 13)),
                    ),
                  ],
                ),
              ),
            ),

          // ── Billing toggle ─────────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                _Toggle('Lifetime', !_monthlySelected, () => setState(() => _monthlySelected = false)),
                _Toggle('Monthly', _monthlySelected, () => setState(() => _monthlySelected = true)),
              ],
            ),
          ).animate().fadeIn(duration: 400.ms),

          const SizedBox(height: 24),

          // ── Individual plan card ───────────────────────────────────────────
          _PlanCard(
            title: 'Individual',
            price: _displayPrice(iap, _monthlySelected, false),
            badge: _monthlySelected ? null : 'Most Popular',
            features: const [
              'Access to all 100 parts',
              'Video, audio & text content',
              'Flashcards & quizzes',
              '1 learner profile',
            ],
            ctaText: hasAccess
                ? 'Current Plan'
                : _isProductMissing(iap, _monthlySelected, false)
                    ? 'Unavailable'
                    : _monthlySelected ? 'Subscribe' : 'Buy Now',
            ctaEnabled: !hasAccess && !isBusy && !_isProductMissing(iap, _monthlySelected, false),
            isBusy: isBusy,
            onTap: hasAccess ? null : () => _buy(iap, _monthlySelected, false),
          ).animate(delay: 100.ms).fadeIn(duration: 400.ms).slideY(begin: 0.05, end: 0),

          const SizedBox(height: 14),

          // ── Family plan card ───────────────────────────────────────────────
          _PlanCard(
            title: 'Family',
            price: _displayPrice(iap, _monthlySelected, true),
            badge: 'Up to 5 profiles',
            features: const [
              'Everything in Individual',
              'Up to 5 learner profiles',
              'Separate progress per profile',
              'Perfect for the whole family',
            ],
            ctaText: _isProductMissing(iap, _monthlySelected, true)
                ? 'Unavailable'
                : _monthlySelected ? 'Subscribe — Family' : 'Buy Now — Family',
            ctaEnabled: !isBusy && !_isProductMissing(iap, _monthlySelected, true),
            isBusy: isBusy,
            onTap: () => _buy(iap, _monthlySelected, true),
            accent: AppColors.eraBirthEarlyLife,
          ).animate(delay: 200.ms).fadeIn(duration: 400.ms).slideY(begin: 0.05, end: 0),

          const SizedBox(height: 20),

          // ── Free Part 1 ────────────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: const Row(
              children: [
                _FreePartBadge(),
                SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Part 1 is Always Free',
                        style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 15)),
                      SizedBox(height: 2),
                      Text('Start learning right now — no purchase needed',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: AppColors.textMuted),
              ],
            ),
          ).animate(delay: 300.ms).fadeIn(duration: 400.ms),

          const SizedBox(height: 16),

          // ── Restore purchases ──────────────────────────────────────────────
          Center(
            child: TextButton.icon(
              onPressed: isBusy ? null : () => ref.read(iapProvider.notifier).restorePurchases(),
              icon: const Icon(Icons.restore, size: 18, color: AppColors.textMuted),
              label: const Text(
                'Restore Purchases',
                style: TextStyle(color: AppColors.textMuted, fontSize: 13),
              ),
            ),
          ).animate(delay: 350.ms).fadeIn(duration: 400.ms),

          const SizedBox(height: 12),

          // ── Guarantee ─────────────────────────────────────────────────────
          Center(
            child: Column(
              children: [
                const Icon(Icons.shield_outlined, color: AppColors.gold, size: 28),
                const SizedBox(height: 6),
                Text(
                  '30-Day Money Back Guarantee',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
              ],
            ),
          ).animate(delay: 400.ms).fadeIn(duration: 400.ms),

          const SizedBox(height: 8),

          // ── IAP disclaimer ─────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              _monthlySelected
                  ? 'Subscription auto-renews monthly. Cancel anytime in your device settings.'
                  : 'One-time purchase. Lifetime access. No subscription required.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textMuted, fontSize: 11, height: 1.5),
            ),
          ).animate(delay: 420.ms).fadeIn(duration: 400.ms),

          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-widgets
// ─────────────────────────────────────────────────────────────────────────────

class _Toggle extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _Toggle(this.label, this.selected, this.onTap);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? AppColors.gold : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: selected ? Colors.black : AppColors.textSecondary,
              fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}

class _FreePartBadge extends StatelessWidget {
  const _FreePartBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: AppColors.goldFaded,
        borderRadius: BorderRadius.circular(10),
      ),
      child: const Icon(Icons.play_circle_outline, color: AppColors.gold),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final String title;
  final String price;
  final String? badge;
  final List<String> features;
  final String ctaText;
  final bool ctaEnabled;
  final bool isBusy;
  final VoidCallback? onTap;
  final Color accent;

  const _PlanCard({
    required this.title,
    required this.price,
    this.badge,
    required this.features,
    required this.ctaText,
    required this.ctaEnabled,
    required this.isBusy,
    required this.onTap,
    this.accent = AppColors.gold,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: accent.withValues(alpha: 0.4), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header row ──────────────────────────────────────────────────────
          Row(
            children: [
              Text(title, style: const TextStyle(
                color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w700,
              )),
              const Spacer(),
              if (badge != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: accent.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: accent.withValues(alpha: 0.4)),
                  ),
                  child: Text(badge!, style: TextStyle(
                    color: accent, fontSize: 11, fontWeight: FontWeight.w600,
                  )),
                ),
            ],
          ),
          const SizedBox(height: 12),

          // ── Price ────────────────────────────────────────────────────────────
          Text(price, style: TextStyle(
            color: accent, fontSize: 28, fontWeight: FontWeight.w800,
          )),

          const SizedBox(height: 20),

          // ── Features ────────────────────────────────────────────────────────
          ...features.map((f) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              children: [
                Icon(Icons.check, color: accent, size: 16),
                const SizedBox(width: 10),
                Expanded(child: Text(f, style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 14,
                ))),
              ],
            ),
          )),

          const SizedBox(height: 16),

          // ── CTA button ──────────────────────────────────────────────────────
          SizedBox(
            width: double.infinity,
            child: ctaEnabled
                ? ElevatedButton(
                    onPressed: isBusy ? null : onTap,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: accent,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: isBusy
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black54),
                          )
                        : Text(ctaText, style: const TextStyle(fontWeight: FontWeight.w700)),
                  )
                : OutlinedButton(
                    onPressed: null,
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.textMuted),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text(ctaText, style: const TextStyle(color: AppColors.textMuted)),
                  ),
          ),
        ],
      ),
    );
  }
}
