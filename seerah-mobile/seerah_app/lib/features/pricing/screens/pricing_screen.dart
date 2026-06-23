import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/iap_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../home/screens/landing_screen.dart' show PlanId;

// ── Plan model (mirrors landing_screen) ──────────────────────────────────────

class _Plan {
  final PlanId id;
  final String iapId;
  final String name;
  final String description;
  final String fallbackPrice;
  final String period;
  final String? badge;

  const _Plan({
    required this.id,
    required this.iapId,
    required this.name,
    required this.description,
    required this.fallbackPrice,
    required this.period,
    this.badge,
  });
}

const _plans = [
  _Plan(
    id: PlanId.individualMonthly,
    iapId: AppConstants.iapMonthlyIndividual,
    name: 'Individual Monthly',
    description: '1 learner • cancel anytime',
    fallbackPrice: '\$${AppConstants.monthlyPrice}',
    period: '/mo',
  ),
  _Plan(
    id: PlanId.familyMonthly,
    iapId: AppConstants.iapMonthlyFamily,
    name: 'Family Monthly',
    description: 'Up to 5 members • cancel anytime',
    fallbackPrice: '\$${AppConstants.familyMonthlyPrice}',
    period: '/mo',
    badge: 'Best for families',
  ),
  _Plan(
    id: PlanId.individualLifetime,
    iapId: AppConstants.iapLifetimeIndividual,
    name: 'Individual Lifetime',
    description: '1 learner • pay once, own forever',
    fallbackPrice: '\$${AppConstants.lifetimePrice}',
    period: 'one-time',
  ),
  _Plan(
    id: PlanId.familyLifetime,
    iapId: AppConstants.iapLifetimeFamily,
    name: 'Family Lifetime',
    description: 'Up to 5 members • pay once, own forever',
    fallbackPrice: '\$${AppConstants.familyLifetimePrice}',
    period: 'one-time',
    badge: 'Best value',
  ),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class PricingScreen extends ConsumerStatefulWidget {
  const PricingScreen({super.key});

  @override
  ConsumerState<PricingScreen> createState() => _PricingScreenState();
}

class _PricingScreenState extends ConsumerState<PricingScreen> {
  PlanId _selected = PlanId.individualLifetime;

  @override
  void initState() {
    super.initState();
    ref.read(iapProvider);
  }

  String _price(IAPState iap, _Plan plan) =>
      iap.productFor(plan.iapId)?.price ?? plan.fallbackPrice;

  _Plan get _selectedPlan => _plans.firstWhere((p) => p.id == _selected);

  void _buy(IAPState iap) {
    if (!iap.isAvailable) {
      _snack('Store unavailable — please sign in to the App Store or Google Play.');
      return;
    }
    final product = iap.productFor(_selectedPlan.iapId);
    if (product == null) {
      _snack('This product is temporarily unavailable. Tap Retry to reload.');
      return;
    }
    ref.read(iapProvider.notifier).buy(product);
  }

  void _snack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), behavior: SnackBarBehavior.floating));
  }

  void _onIAP(IAPState? prev, IAPState next) {
    if (next.status == IAPStatus.success &&
        prev?.status != IAPStatus.success) {
      _showSuccessSheet();
      ref.read(iapProvider.notifier).clearSuccess();
    }
    if (next.status == IAPStatus.error &&
        next.errorMessage != null &&
        prev?.errorMessage != next.errorMessage) {
      _snack(next.errorMessage!);
      ref.read(iapProvider.notifier).clearError();
    }
    if (next.status == IAPStatus.cancelled &&
        prev?.status == IAPStatus.purchasing) {
      _snack('Purchase cancelled.');
    }
    if (next.status == IAPStatus.restoreEmpty &&
        prev?.status != IAPStatus.restoreEmpty) {
      _snack('No previous purchases found to restore.');
      ref.read(iapProvider.notifier).clearError();
    }
  }

  void _showSuccessSheet() {
    if (!mounted) return;
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(28, 28, 28, 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: const Color(0xFF4CAF50).withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_rounded,
                  color: Color(0xFF4CAF50), size: 32),
            ),
            const SizedBox(height: 20),
            const Text(
              'JazakAllahu Khayran!',
              style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 22,
                  fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 10),
            const Text(
              'Your purchase was successful. Full access has been unlocked. May Allah bless your learning.',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: AppColors.textSecondary, fontSize: 15, height: 1.5),
            ),
            const SizedBox(height: 28),
            FilledButton(
              onPressed: () {
                Navigator.of(context).pop();
                context.go('/dashboard');
              },
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.gold,
                foregroundColor: Colors.black,
                minimumSize: const Size.fromHeight(50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text('Start Learning',
                  style: TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<IAPState>(iapProvider, _onIAP);
    final auth = ref.watch(authProvider);
    final iap = ref.watch(iapProvider);
    final hasAccess = auth.hasAccess;

    final busy = iap.status == IAPStatus.purchasing ||
        iap.status == IAPStatus.verifying ||
        iap.status == IAPStatus.loading;

    final showRetry = iap.isAvailable &&
        iap.status == IAPStatus.idle &&
        iap.products.isEmpty;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: const Text('Plans & Pricing'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              children: [

                // ── Access banner ────────────────────────────────────────
                if (hasAccess) ...[
                  _StatusBanner(
                    icon: Icons.verified_rounded,
                    iconColor: const Color(0xFF4CAF50),
                    text: 'You have full access to the course',
                    bgColor: const Color(0xFF4CAF50).withValues(alpha: 0.08),
                    borderColor: const Color(0xFF4CAF50).withValues(alpha: 0.3),
                    textColor: const Color(0xFF4CAF50),
                  ),
                  const SizedBox(height: 20),
                ],

                // ── Store / retry warnings ───────────────────────────────
                if (!iap.isAvailable && iap.status != IAPStatus.loading) ...[
                  _StatusBanner(
                    icon: Icons.info_outline_rounded,
                    iconColor: AppColors.textMuted,
                    text:
                        'Store unavailable. Sign in to the App Store or Google Play.',
                    bgColor: AppColors.surface,
                    borderColor: AppColors.border,
                    textColor: AppColors.textSecondary,
                  ),
                  const SizedBox(height: 12),
                ],
                if (showRetry) ...[
                  _RetryBanner(
                      onRetry: () =>
                          ref.read(iapProvider.notifier).reloadProducts()),
                  const SizedBox(height: 12),
                ],

                // ── Plan list ────────────────────────────────────────────
                const Text(
                  'Choose a plan',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),
                ...List.generate(_plans.length, (i) {
                  final plan = _plans[i];
                  return _PlanTile(
                    plan: plan,
                    price: _price(iap, plan),
                    isSelected: _selected == plan.id,
                    onTap: () => setState(() => _selected = plan.id),
                    bottomMargin: i < _plans.length - 1 ? 10 : 0,
                  );
                }),

                const SizedBox(height: 28),

                // ── Free Part 1 ──────────────────────────────────────────
                InkWell(
                  onTap: () => context.go('/part/1'),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: AppColors.goldFaded,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.play_circle_outline,
                              color: AppColors.gold, size: 24),
                        ),
                        const SizedBox(width: 14),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Part 1 is Always Free',
                                  style: TextStyle(
                                      color: AppColors.textPrimary,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14)),
                              SizedBox(height: 2),
                              Text('Start learning right now — no purchase needed',
                                  style: TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 12.5)),
                            ],
                          ),
                        ),
                        const Icon(Icons.arrow_forward_ios,
                            color: AppColors.textMuted, size: 14),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // ── Guarantee + disclaimer ───────────────────────────────
                const _GuaranteeRow(),

                const SizedBox(height: 16),

                Center(
                  child: TextButton.icon(
                    onPressed: busy
                        ? null
                        : () =>
                            ref.read(iapProvider.notifier).restorePurchases(),
                    icon: const Icon(Icons.restore_rounded,
                        size: 17, color: AppColors.textMuted),
                    label: const Text('Restore Purchases',
                        style: TextStyle(
                            color: AppColors.textMuted, fontSize: 13)),
                  ),
                ),

                const SizedBox(height: 24),
              ],
            ),
          ),

          // ── Sticky CTA ───────────────────────────────────────────────
          if (!hasAccess)
            Container(
              padding: EdgeInsets.fromLTRB(
                  20, 12, 20, MediaQuery.of(context).padding.bottom + 12),
              decoration: BoxDecoration(
                color: AppColors.background,
                border: Border(
                    top: BorderSide(
                        color: AppColors.border.withValues(alpha: 0.5))),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  FilledButton(
                    onPressed: busy ? null : () => _buy(iap),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.gold,
                      foregroundColor: Colors.black,
                      minimumSize: const Size.fromHeight(52),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: busy
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2.5, color: Colors.black54),
                          )
                        : Text(
                            _ctaLabel(iap),
                            style: const TextStyle(
                                fontSize: 16, fontWeight: FontWeight.w700),
                          ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _selectedPlan.period == '/mo'
                        ? 'Subscription renews monthly. Cancel anytime in device settings.'
                        : 'One-time purchase. Lifetime access. No subscription.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        color: AppColors.textMuted, fontSize: 11),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  String _ctaLabel(IAPState iap) {
    final plan = _selectedPlan;
    final price = _price(iap, plan);
    return plan.period == '/mo'
        ? 'Subscribe — $price/mo'
        : 'Get Lifetime Access — $price';
  }
}

// ── Plan tile ─────────────────────────────────────────────────────────────────

class _PlanTile extends StatelessWidget {
  final _Plan plan;
  final String price;
  final bool isSelected;
  final VoidCallback onTap;
  final double bottomMargin;

  const _PlanTile({
    required this.plan,
    required this.price,
    required this.isSelected,
    required this.onTap,
    this.bottomMargin = 0,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        margin: EdgeInsets.only(bottom: bottomMargin),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.gold.withValues(alpha: 0.07)
              : AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppColors.gold : AppColors.border,
            width: isSelected ? 1.8 : 1.2,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isSelected ? AppColors.gold : AppColors.border,
                    width: isSelected ? 6 : 2,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            plan.name,
                            style: TextStyle(
                              color: isSelected
                                  ? AppColors.textPrimary
                                  : AppColors.textSecondary,
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        if (plan.badge != null) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.goldFaded,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              plan.badge!,
                              style: const TextStyle(
                                  color: AppColors.gold,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(plan.description,
                        style: const TextStyle(
                            color: AppColors.textMuted, fontSize: 12.5)),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    price,
                    style: TextStyle(
                      color: isSelected ? AppColors.gold : AppColors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  Text(plan.period,
                      style: const TextStyle(
                          color: AppColors.textMuted, fontSize: 11)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Helper widgets ────────────────────────────────────────────────────────────

class _StatusBanner extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String text;
  final Color bgColor;
  final Color borderColor;
  final Color textColor;

  const _StatusBanner({
    required this.icon,
    required this.iconColor,
    required this.text,
    required this.bgColor,
    required this.borderColor,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text,
                style: TextStyle(
                    color: textColor,
                    fontSize: 13,
                    fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }
}

class _RetryBanner extends StatelessWidget {
  final VoidCallback onRetry;
  const _RetryBanner({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          const Icon(Icons.warning_amber_rounded,
              color: AppColors.textMuted, size: 18),
          const SizedBox(width: 10),
          const Expanded(
            child: Text('Products could not be loaded from the store.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          ),
          TextButton(
            onPressed: onRetry,
            style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                minimumSize: const Size(44, 36)),
            child: const Text('Retry',
                style: TextStyle(color: AppColors.gold, fontSize: 13)),
          ),
        ],
      ),
    );
  }
}

class _GuaranteeRow extends StatelessWidget {
  const _GuaranteeRow();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: const [
        Icon(Icons.shield_outlined, color: AppColors.gold, size: 18),
        SizedBox(width: 6),
        Text(
          '30-Day Money Back Guarantee',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
      ],
    );
  }
}
