import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/providers/iap_provider.dart';
import '../../../core/theme/app_colors.dart';

// ── Plan model ────────────────────────────────────────────────────────────────

enum PlanId {
  individualMonthly,
  familyMonthly,
  individualLifetime,
  familyLifetime,
}

class _Plan {
  final PlanId id;
  final String iapId;
  final String name;
  final String description;
  final String fallbackPrice;
  final String period;
  final String? badge;
  final bool isHighlighted;

  const _Plan({
    required this.id,
    required this.iapId,
    required this.name,
    required this.description,
    required this.fallbackPrice,
    required this.period,
    this.badge,
    this.isHighlighted = false,
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
    isHighlighted: true,
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

class LandingScreen extends ConsumerStatefulWidget {
  const LandingScreen({super.key});

  @override
  ConsumerState<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends ConsumerState<LandingScreen> {
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
      _snack('This product is temporarily unavailable. Please try again.');
      return;
    }
    ref.read(iapProvider.notifier).buy(product);
  }

  void _snack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(msg), behavior: SnackBarBehavior.floating));
  }

  void _onIAP(IAPState? prev, IAPState next) {
    if (next.status == IAPStatus.pendingAccountSetup &&
        prev?.status != IAPStatus.pendingAccountSetup) {
      context.push('/account-setup');
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
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<IAPState>(iapProvider, _onIAP);
    final iap = ref.watch(iapProvider);
    final busy = iap.status == IAPStatus.purchasing ||
        iap.status == IAPStatus.verifying ||
        iap.status == IAPStatus.loading;

    final selected = _selectedPlan;
    final price = _price(iap, selected);
    final ctaLabel = selected.period == '/mo'
        ? 'Start for $price${selected.period}'
        : 'Get Lifetime Access — $price';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // ── Top bar ───────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                children: [
                  const Spacer(),
                  TextButton(
                    onPressed: () => context.push('/login'),
                    child: const Text('Sign In',
                        style: TextStyle(color: AppColors.textSecondary)),
                  ),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ── Hero ──────────────────────────────────────────────
                    const SizedBox(height: 8),
                    const _HeroSection(),
                    const SizedBox(height: 32),

                    // ── Section label ─────────────────────────────────────
                    const Text(
                      'Choose a plan',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // ── Plan cards ────────────────────────────────────────
                    ...List.generate(_plans.length, (i) {
                      final plan = _plans[i];
                      final isSelected = _selected == plan.id;
                      return _PlanTile(
                        plan: plan,
                        price: _price(iap, plan),
                        isSelected: isSelected,
                        onTap: () => setState(() => _selected = plan.id),
                        bottomMargin: i < _plans.length - 1 ? 10 : 0,
                      );
                    }),

                    const SizedBox(height: 24),

                    // ── CTA ───────────────────────────────────────────────
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
                              ctaLabel,
                              style: const TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.w700),
                            ),
                    ),

                    const SizedBox(height: 10),
                    const Text(
                      '7-day refund guarantee  ·  Instant access  ·  Cancel anytime',
                      textAlign: TextAlign.center,
                      style:
                          TextStyle(color: AppColors.textMuted, fontSize: 11.5),
                    ),

                    const Divider(height: 40, color: AppColors.border),

                    // ── Free Part 1 ───────────────────────────────────────
                    _FreePart1Tile(),

                    const SizedBox(height: 20),

                    // ── Bottom actions ────────────────────────────────────
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('Already have an account? ',
                            style: TextStyle(
                                color: AppColors.textMuted, fontSize: 13)),
                        GestureDetector(
                          onTap: () => context.push('/login'),
                          child: const Text('Sign In',
                              style: TextStyle(
                                  color: AppColors.gold,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Center(
                      child: TextButton(
                        onPressed: busy
                            ? null
                            : () => ref
                                .read(iapProvider.notifier)
                                .restorePurchases(),
                        style: TextButton.styleFrom(
                            foregroundColor: AppColors.textMuted),
                        child: const Text('Restore Purchases',
                            style: TextStyle(fontSize: 12)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Hero section ──────────────────────────────────────────────────────────────

class _HeroSection extends StatelessWidget {
  const _HeroSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Gold pill
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.goldFaded,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
          ),
          child: const Text(
            '100-Part Seerah Course',
            style: TextStyle(
                color: AppColors.gold,
                fontSize: 12,
                fontWeight: FontWeight.w600),
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'The Life of the\nProphet Muhammad ﷺ',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 28,
            fontWeight: FontWeight.w800,
            height: 1.2,
          ),
        ),
        const SizedBox(height: 12),
        const Text(
          'Video · Audio · Reading · Slides · Mindmap · Flashcards · Quizzes',
          textAlign: TextAlign.center,
          style:
              TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5),
        ),
      ],
    );
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
    final borderColor = isSelected ? AppColors.gold : AppColors.border;
    final bgColor = isSelected
        ? AppColors.gold.withValues(alpha: 0.07)
        : AppColors.card;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        margin: EdgeInsets.only(bottom: bottomMargin),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: borderColor,
            width: isSelected ? 1.8 : 1.2,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              // Radio indicator
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
                  color: isSelected ? AppColors.gold : Colors.transparent,
                ),
              ),

              const SizedBox(width: 14),

              // Plan info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          plan.name,
                          style: TextStyle(
                            color: isSelected
                                ? AppColors.textPrimary
                                : AppColors.textSecondary,
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
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
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      plan.description,
                      style: const TextStyle(
                          color: AppColors.textMuted, fontSize: 12.5),
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 12),

              // Price
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
                  Text(
                    plan.period,
                    style: const TextStyle(
                        color: AppColors.textMuted, fontSize: 11),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Free Part 1 tile ──────────────────────────────────────────────────────────

class _FreePart1Tile extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push('/part/1'),
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
                  Text('No account needed — start watching now',
                      style: TextStyle(
                          color: AppColors.textSecondary, fontSize: 12.5)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios,
                color: AppColors.textMuted, size: 14),
          ],
        ),
      ),
    );
  }
}
