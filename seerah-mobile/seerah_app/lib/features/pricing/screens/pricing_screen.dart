import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/iap_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/adaptive_icons.dart';
import '../../../core/widgets/legal_web_screen.dart';
import '../../../core/widgets/subscription_legal_text.dart';
import '../../../core/utils/refund_copy.dart';
import '../../../core/utils/system_insets.dart';
import '../../../core/widgets/ui_kit.dart' show VerifyingPurchaseBanner, PriceLoadingPlaceholder, PendingPurchaseRecoveryBanner;
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
  final bool isRecommended;

  const _Plan({
    required this.id,
    required this.iapId,
    required this.name,
    required this.description,
    required this.fallbackPrice,
    required this.period,
    this.badge,
    this.isRecommended = false,
  });
}

const _plans = [
  _Plan(
    id: PlanId.individualLifetime,
    iapId: AppConstants.iapLifetimeIndividual,
    name: 'Lifetime',
    description: '1 learner • pay once, own forever',
    fallbackPrice: '\$${AppConstants.lifetimePrice}',
    period: 'one-time',
    badge: 'Most Popular',
    isRecommended: true,
  ),
  _Plan(
    id: PlanId.individualMonthly,
    iapId: AppConstants.iapMonthlyIndividual,
    name: 'Monthly',
    description: '1 learner • cancel anytime',
    fallbackPrice: '\$${AppConstants.monthlyPrice}',
    period: '/month',
  ),
];

final _faqItems = [
  (
    q: 'What is included?',
    a: 'Every plan includes the full 100-part Seerah course with video lessons, readings, quizzes, flashcards, summaries, mind maps, and progress tracking.',
  ),
  (
    q: 'Can I cancel anytime?',
    a: 'Yes. Monthly plans can be canceled anytime from your App Store or Google Play subscription settings.',
  ),
  (
    q: 'Is there a refund guarantee?',
    a: refundGuaranteeAnswer(),
  ),
  (
    q: 'Is Part 1 free?',
    a: 'Yes. Part 1 is completely free with no account required. Watch it before choosing a plan.',
  ),
  (
    q: "What's the difference between monthly and lifetime?",
    a: 'Monthly is \$${AppConstants.monthlyPrice}/month and you can cancel anytime. Lifetime is \$${AppConstants.lifetimePrice} once — you keep access forever with no renewal.',
  ),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class PricingScreen extends ConsumerStatefulWidget {
  const PricingScreen({super.key});

  @override
  ConsumerState<PricingScreen> createState() => _PricingScreenState();
}

class _PricingScreenState extends ConsumerState<PricingScreen> {
  PlanId? _purchasingPlanId;
  // Set synchronously the instant a plan is tapped — iap.status doesn't flip
  // to `purchasing` until after resolveProductForPlan()/ensureSession() have
  // both awaited, leaving a window where a fast double-tap could start two
  // concurrent purchase flows for the same (or different) plan.
  bool _buyTapInFlight = false;

  @override
  void initState() {
    super.initState();
    ref.read(iapProvider);
  }

  /// Audit M-fallback-price: null while store products are still loading —
  /// see identical helper doc comment in landing_screen.dart.
  String? _price(IAPState iap, _Plan plan) {
    final resolved = iap.productForPlan(plan.iapId)?.price;
    if (resolved != null) return resolved;
    if (iap.status == IAPStatus.loading) return null;
    return plan.fallbackPrice;
  }

  Future<void> _buyPlan(IAPState iap, _Plan plan) async {
    if (_buyTapInFlight ||
        iap.status == IAPStatus.purchasing ||
        iap.status == IAPStatus.verifying ||
        iap.status == IAPStatus.loading) {
      return;
    }
    if (!iap.isAvailable) {
      _snack(ref.read(iapProvider).unavailableProductMessage());
      return;
    }

    _buyTapInFlight = true;
    setState(() => _purchasingPlanId = plan.id);

    try {
      final product = await ref
          .read(iapProvider.notifier)
          .resolveProductForPlan(plan.iapId);
      if (product == null) {
        if (mounted) setState(() => _purchasingPlanId = null);
        _snack(ref.read(iapProvider).unavailableProductMessage());
        return;
      }

      // Defense in depth: ensure a session exists even if auth state went stale.
      final ready = await ref.read(authProvider.notifier).ensureSession();
      if (!ready || !ref.read(authProvider).isLoggedIn) {
        if (mounted) setState(() => _purchasingPlanId = null);
        _snack(ref.read(authProvider).error ??
            'Could not start checkout. Please try again.');
        return;
      }

      final started = await ref.read(iapProvider.notifier).buy(product);
      if (!started && mounted) {
        setState(() => _purchasingPlanId = null);
        _snack('A purchase is already being processed. Please wait for it to finish.');
      }
    } finally {
      _buyTapInFlight = false;
    }
  }

  void _snack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), behavior: SnackBarBehavior.floating),
    );
  }

  void _onIAP(IAPState? prev, IAPState next) {
    if (next.status == IAPStatus.success && prev?.status != IAPStatus.success) {
      if (mounted) setState(() => _purchasingPlanId = null);
      _showSuccessSheet();
      ref.read(iapProvider.notifier).clearSuccess();
    }
    if (next.status == IAPStatus.error &&
        next.errorMessage != null &&
        prev?.errorMessage != next.errorMessage) {
      if (mounted) setState(() => _purchasingPlanId = null);
      _snack(next.errorMessage!);
      ref.read(iapProvider.notifier).clearError();
    }
    if (next.status == IAPStatus.cancelled &&
        prev?.status == IAPStatus.purchasing) {
      if (mounted) setState(() => _purchasingPlanId = null);
      _snack('Purchase cancelled.');
    }
    if (next.status == IAPStatus.restoreEmpty &&
        prev?.status != IAPStatus.restoreEmpty) {
      if (mounted) setState(() => _purchasingPlanId = null);
      _snack('No previous purchases found to restore.');
      ref.read(iapProvider.notifier).clearError();
    }
  }

  void _showSuccessSheet() {
    if (!mounted) return;

    // Guests must create an account after purchase so access syncs across
    // Android, iOS, and web. Skip is intentionally not offered.
    if (ref.read(authProvider).isAnonymous) {
      context.go('/signup');
      return;
    }

    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder:
          (_) => SafeArea(
            top: false,
            bottom: false,
            child: SingleChildScrollView(
              child: Padding(
                padding: EdgeInsets.fromLTRB(28, 28, 28, 40 + bottomSystemInset(context)),
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
                      child: const Icon(
                        Icons.check_rounded,
                        color: Color(0xFF4CAF50),
                        size: 32,
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'JazakAllahu Khayran!',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Your purchase was successful. Full access has been unlocked. May Allah bless your learning.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 15,
                        height: 1.5,
                      ),
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
                      child: const Text(
                        'Start Learning',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ),
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

    final busy =
        _buyTapInFlight ||
        iap.status == IAPStatus.purchasing ||
        iap.status == IAPStatus.verifying ||
        iap.status == IAPStatus.loading;

    final showRetry = iap.needsProductReload;
    // Audit M1 fix: this screen never surfaced pendingLinkPurchases at all —
    // see PendingPurchaseRecoveryBanner's doc comment for how a purchase can
    // end up queued there while logged out and still be unclaimed once the
    // user is signed in and lands here instead of the pre-login pricing view.
    final showRecovery = iap.hasPendingLink;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: const Text('Choose Your Plan'),
        centerTitle: true,
      ),
      body: ListView(
        // Audit H3: /pricing lives inside AppShell, which already pads the
        // bottom nav with bottomSystemInset(). Scaffold zeros padding.bottom
        // for the body but leaves viewPadding — so calling the helper here
        // double-applied the system inset and left a dead gap above the tab
        // bar. Use plain content padding like other shell tabs (dashboard).
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
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
            const SizedBox(height: 16),
          ],

          // ── Recovery banner — unclaimed purchase(s) from a logged-out
          // moment (e.g. a renewal replayed before guest-session creation
          // succeeded) ───────────────────────────────────────────────────
          if (showRecovery) ...[
            PendingPurchaseRecoveryBanner(
              count: iap.pendingLinkPurchases.length,
              onClaim: () async {
                await ref.read(iapProvider.notifier).claimPendingPurchase();
              },
            ),
            const SizedBox(height: 12),
          ],

          // ── Retry when products failed to load ───────────────────
          if (showRetry) ...[
            _RetryBanner(
              status: iap.storeStatusLabel,
              onRetry: () => ref.read(iapProvider.notifier).reloadProducts(),
            ),
            const SizedBox(height: 12),
          ],

          // ── Verifying purchase — can take up to ~2 minutes (retries) ─
          if (iap.status == IAPStatus.verifying) ...[
            const VerifyingPurchaseBanner(),
            const SizedBox(height: 12),
          ],

          // ── Plan list (plans-first — these are warm in-app users) ─
          ...List.generate(_plans.length, (i) {
            final plan = _plans[i];
            return _PlanTile(
              plan: plan,
              price: _price(iap, plan),
              isLoading: _purchasingPlanId == plan.id && busy,
              enabled: !hasAccess && !busy,
              onTap: () => _buyPlan(iap, plan),
              bottomMargin: i < _plans.length - 1 ? 10 : 0,
              isRecommended: plan.isRecommended,
            );
          }),

          const SizedBox(height: 12),
          Text(
            '${refundBadgeText()}  ·  Instant access  ·  Cancel anytime',
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.textMuted, fontSize: 11.5),
          ),

          const SizedBox(height: 10),

          // Apple 3.1.2(c): condensed auto-renewal disclosure right under
          // the Buy buttons, in the viewport before any scrolling — the
          // full version further down the page repeats it.
          SubscriptionLegalText(
            compact: true,
            onOpenUrl: (url) {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => LegalWebScreen(url: url)),
              );
            },
          ),

          const SizedBox(height: 28),

          // ── What's included ──────────────────────────────────────
          const Text(
            'What\'s included',
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                ...[
                  (
                    Icons.play_circle_outline_rounded,
                    '100 structured video lessons',
                  ),
                  (Icons.article_outlined, 'Reading notes & briefings'),
                  (Icons.quiz_outlined, 'Quizzes & flashcards'),
                  (
                    Icons.insights_rounded,
                    'Progress tracking across all 8 eras',
                  ),
                  (Icons.map_outlined, 'Slides, mindmaps, and infographics'),
                  (
                    Icons.all_inclusive_rounded,
                    'Lifetime access option available',
                  ),
                ].map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      children: [
                        Icon(item.$1, color: AppColors.gold, size: 16),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            item.$2,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 28),

          // ── Monthly vs lifetime ──────────────────────────────────
          const Text(
            'Monthly vs lifetime',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          const _ComparisonCard(
            title: 'Monthly',
            bullets: [
              'Lower upfront cost',
              '\$${AppConstants.monthlyPrice}/month',
              'Cancel anytime from your store account',
            ],
          ),
          const SizedBox(height: 10),
          const _ComparisonCard(
            title: 'Lifetime',
            bullets: [
              'Pay once, keep access forever',
              '\$${AppConstants.lifetimePrice} one-time',
              'Best long-term value if you plan to study for years',
            ],
            highlighted: true,
          ),

          const SizedBox(height: 28),

          // ── Free Part 1 ──────────────────────────────────────────
          const Text(
            'Want to preview first?',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
          const SizedBox(height: 10),
          InkWell(
            // push (not go) preserves whatever back-stack the user arrived
            // with — matches the identical "preview Part 1" card on
            // landing_screen.dart and part_screen.dart's continue CTA.
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
                    child: const Icon(
                      Icons.play_circle_outline,
                      color: AppColors.gold,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Part 1 is Always Free',
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Watch Part 1 free — no purchase needed',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const ForwardChevronIcon(
                    color: AppColors.textMuted,
                    size: 14,
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 28),

          // ── FAQ ──────────────────────────────────────────────────
          const Text(
            'Pricing questions',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          ..._faqItems.map(
            (item) => _FaqTile(question: item.q, answer: item.a),
          ),

          const SizedBox(height: 16),

          // ── Guarantee + disclaimer ───────────────────────────────
          const _GuaranteeRow(),

          const SizedBox(height: 16),

          Center(
            child: TextButton.icon(
              onPressed:
                  busy
                      ? null
                      : () async {
                          final ready = await ref
                              .read(authProvider.notifier)
                              .ensureSession();
                          if (!ready || !ref.read(authProvider).isLoggedIn) {
                            _snack(ref.read(authProvider).error ??
                                'Could not restore. Please try again.');
                            return;
                          }
                          await ref
                              .read(iapProvider.notifier)
                              .restorePurchases();
                        },
              icon: const Icon(
                Icons.restore_rounded,
                size: 17,
                color: AppColors.textMuted,
              ),
              label: const Text(
                'Restore Purchases',
                style: TextStyle(color: AppColors.textMuted, fontSize: 13),
              ),
            ),
          ),

          const SizedBox(height: 16),

          SubscriptionLegalText(
            onOpenUrl: (url) {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => LegalWebScreen(url: url)),
              );
            },
          ),

          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

// ── Plan tile ─────────────────────────────────────────────────────────────────

class _PlanTile extends StatelessWidget {
  final _Plan plan;
  /// Null while the real store price is still loading — see [_price] doc
  /// comment (audit M-fallback-price).
  final String? price;
  final bool isLoading;
  final bool enabled;
  final bool isRecommended;
  final VoidCallback onTap;
  final double bottomMargin;

  const _PlanTile({
    required this.plan,
    required this.price,
    required this.isLoading,
    required this.enabled,
    required this.onTap,
    this.isRecommended = false,
    this.bottomMargin = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: enabled && !isLoading ? onTap : null,
        borderRadius: BorderRadius.circular(14),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          margin: EdgeInsets.only(bottom: bottomMargin),
          decoration: BoxDecoration(
            gradient:
                isRecommended
                    ? LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppColors.gold.withValues(alpha: 0.14),
                        AppColors.gold.withValues(alpha: 0.04),
                      ],
                    )
                    : null,
            color: isRecommended ? null : AppColors.card,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color:
                  isRecommended
                      ? AppColors.gold.withValues(alpha: 0.6)
                      : AppColors.border,
              width: isRecommended ? 1.5 : 1.2,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (plan.badge != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 5),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color:
                                  isRecommended
                                      ? AppColors.gold
                                      : AppColors.goldFaded,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              plan.badge!,
                              style: TextStyle(
                                color:
                                    isRecommended
                                        ? Colors.black
                                        : AppColors.gold,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      Text(
                        plan.name,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        plan.description,
                        style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 12.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                if (isLoading)
                  const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator.adaptive(
                      strokeWidth: 2.5,
                      valueColor: AlwaysStoppedAnimation<Color>(AppColors.gold),
                    ),
                  )
                else if (price == null)
                  const PriceLoadingPlaceholder()
                else
                  Flexible(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          price!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color:
                                isRecommended
                                    ? AppColors.gold
                                    : AppColors.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          plan.period,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color:
                                isRecommended
                                    ? AppColors.gold.withValues(alpha: 0.7)
                                    : AppColors.textMuted,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(width: 10),
                ForwardChevronIcon(
                  size: 14,
                  color:
                      enabled
                          ? AppColors.textMuted
                          : AppColors.textMuted.withValues(alpha: 0.4),
                ),
              ],
            ),
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
            child: Text(
              text,
              style: TextStyle(
                color: textColor,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RetryBanner extends StatelessWidget {
  final String status;
  final VoidCallback onRetry;
  const _RetryBanner({required this.status, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(
                Icons.warning_amber_rounded,
                color: AppColors.textMuted,
                size: 18,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  status,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
              ),
              TextButton(
                onPressed: onRetry,
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: const Size(44, 36),
                ),
                child: const Text(
                  'Retry',
                  style: TextStyle(color: AppColors.gold, fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          // See matching comment in landing_screen.dart's _ProductRetryBanner
          // — this used to show internal QA install instructions to real
          // customers hitting an ordinary transient load failure.
          const Text(
            'Check your internet connection, then tap Retry. If this keeps happening, '
            'contact support@themuslimman.com.',
            style: TextStyle(
              color: AppColors.textMuted,
              fontSize: 11.5,
              height: 1.4,
            ),
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
      children: [
        const Icon(Icons.shield_outlined, color: AppColors.gold, size: 18),
        const SizedBox(width: 6),
        // Flexible + ellipsis: refundBadgeText() varies in length by platform
        // ("Refundable via Google Play" is notably longer than "7-day refund
        // guarantee"), and at larger Dynamic Type / accessibility text scales
        // an unconstrained Text here could overflow the row with no way to
        // shrink, producing the classic yellow/black overflow stripes.
        Flexible(
          child: Text(
            refundBadgeText(),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
        ),
      ],
    );
  }
}

class _ComparisonCard extends StatelessWidget {
  final String title;
  final List<String> bullets;
  final bool highlighted;

  const _ComparisonCard({
    required this.title,
    required this.bullets,
    this.highlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color:
              highlighted
                  ? AppColors.gold.withValues(alpha: 0.25)
                  : AppColors.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 15,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          ...bullets.map(
            (b) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '•  ',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                  ),
                  Expanded(
                    child: Text(
                      b,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                        height: 1.45,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FaqTile extends StatefulWidget {
  final String question;
  final String answer;

  const _FaqTile({required this.question, required this.answer});

  @override
  State<_FaqTile> createState() => _FaqTileState();
}

class _FaqTileState extends State<_FaqTile> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => setState(() => _expanded = !_expanded),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        widget.question,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Icon(
                      _expanded
                          ? Icons.keyboard_arrow_up_rounded
                          : Icons.keyboard_arrow_down_rounded,
                      color: AppColors.textMuted,
                      size: 22,
                    ),
                  ],
                ),
                if (_expanded) ...[
                  const SizedBox(height: 8),
                  Text(
                    widget.answer,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                      height: 1.5,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
