import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/iap_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/adaptive_icons.dart';
import '../../../core/widgets/legal_web_screen.dart';
import '../../../core/widgets/subscription_legal_text.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../core/utils/refund_copy.dart';
import '../../../core/utils/system_insets.dart';

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

// ── Screen ────────────────────────────────────────────────────────────────────

class LandingScreen extends ConsumerStatefulWidget {
  const LandingScreen({super.key});

  @override
  ConsumerState<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends ConsumerState<LandingScreen> {
  PlanId? _purchasingPlanId;
  // Set synchronously the instant a plan is tapped — see pricing_screen.dart
  // for why this closes the pre-`purchasing`-status double-tap window.
  bool _buyTapInFlight = false;
  final _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    ref.read(iapProvider);
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    super.dispose();
  }

  /// Audit M-fallback-price: returns null while store products are still
  /// loading so the UI can show a neutral placeholder instead of eagerly
  /// rendering `plan.fallbackPrice` — a hardcoded USD figure that doesn't
  /// reflect Apple/Google's actual per-region, per-currency pricing. Once
  /// loading has genuinely finished and this specific product still isn't
  /// found (a real misconfiguration, already flagged separately by the
  /// retry banner), falling back to the hardcoded price is still better
  /// than a permanent placeholder.
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
      // Resolve the StoreKit product first so buy() can still run even if the
      // widget tree rebuilds after ensureSession().
      final product = await ref
          .read(iapProvider.notifier)
          .resolveProductForPlan(plan.iapId);
      if (product == null) {
        if (mounted) setState(() => _purchasingPlanId = null);
        _snack(ref.read(iapProvider).unavailableProductMessage());
        return;
      }

      // Persist intent so IAPNotifier can resume after any navigation/login.
      ref.read(iapProvider.notifier).setPurchaseIntent(product.id);

      // No registration required to purchase (Apple Guideline 5.1.1(v)) — this
      // silently provisions a device-linked guest session with no personal
      // info collected, if one doesn't already exist. Signing in/up is only
      // ever an optional, later step (see the profile screen).
      final ready = await ref.read(authProvider.notifier).ensureSession();
      if (!ready || !ref.read(authProvider).isLoggedIn) {
        ref.read(iapProvider.notifier).clearPurchaseIntent();
        if (mounted) setState(() => _purchasingPlanId = null);
        _snack(ref.read(authProvider).error ??
            'Could not start checkout. Please try again.');
        return;
      }

      // Call buy on the notifier (survives LandingScreen dispose). Do not
      // gate on mounted — that was aborting StoreKit for Apple review.
      final started = await ref.read(iapProvider.notifier).buy(product);
      if (!started) {
        if (mounted) setState(() => _purchasingPlanId = null);
        _snack('A purchase is already being processed. Please wait for it to finish.');
      }
    } finally {
      _buyTapInFlight = false;
    }
  }

  void _snack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(msg), behavior: SnackBarBehavior.floating));
  }

  void _onIAP(IAPState? prev, IAPState next) {
    if (next.status == IAPStatus.success &&
        prev?.status != IAPStatus.success) {
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
      builder: (_) => SafeArea(
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
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<IAPState>(iapProvider, _onIAP);
    final iap = ref.watch(iapProvider);
    final busy = _buyTapInFlight ||
        iap.status == IAPStatus.purchasing ||
        iap.status == IAPStatus.verifying ||
        iap.status == IAPStatus.loading;
    // Defense-in-depth: the router's redirect already keeps an
    // already-entitled user off this screen, but don't rely on that alone —
    // if a redirect is ever skipped (e.g. a race right as hasAccess flips
    // true), this must not let them buy a second, possibly more expensive
    // plan on top of one they already have (mirrors pricing_screen.dart).
    final hasAccess = ref.watch(authProvider).hasAccess;

    final showRetry = iap.needsProductReload;
    final showRecovery = iap.hasPendingLink;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: AppGradientBackground(child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // ── Top bar ───────────────────────────────────────────────────
            // No Sign In here — Apple Guideline 5.1.1(v): plan picking / purchase
            // must not look like it requires registration first.
            // Landing is reached both via router redirect (no way back
            // wanted) and via push() from part_screen/welcome_screen (a back
            // affordance is expected there) — show the button only when
            // there's actually somewhere to pop back to.
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Row(
                children: [
                  if (context.canPop())
                    Padding(
                      padding: const EdgeInsets.only(right: 4),
                      child: IconButton(
                        icon: const BackIcon(size: 20),
                        tooltip: 'Back',
                        onPressed: () => context.pop(),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
                      ),
                    ),
                  const Expanded(
                    child: Text(
                      'Choose your plan',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                controller: _scrollCtrl,
                padding: EdgeInsets.fromLTRB(20, 12, 20, 24 + bottomSystemInset(context)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ── Recovery banner — legacy unlinked purchase(s) ───────
                    if (showRecovery) ...[
                      PendingPurchaseRecoveryBanner(
                        count: iap.pendingLinkPurchases.length,
                        onClaim: () async {
                          await ref
                              .read(iapProvider.notifier)
                              .claimPendingPurchase();
                        },
                      ),
                      const SizedBox(height: 12),
                    ],

                    if (showRetry) ...[
                      _ProductRetryBanner(
                        status: iap.storeStatusLabel,
                        onRetry: () =>
                            ref.read(iapProvider.notifier).reloadProducts(),
                      ),
                      const SizedBox(height: 12),
                    ],

                    // ── Verifying purchase — can take up to ~2 minutes (retries) ─
                    if (iap.status == IAPStatus.verifying) ...[
                      const VerifyingPurchaseBanner(),
                      const SizedBox(height: 12),
                    ],

                    // ── Plans ─────────────────────────────────────────────
                    ...List.generate(_plans.length, (i) {
                      final plan = _plans[i];
                      return _PlanTile(
                        plan: plan,
                        price: _price(iap, plan),
                        isLoading: _purchasingPlanId == plan.id && busy,
                        enabled: !busy && !hasAccess,
                        onTap: () => _buyPlan(iap, plan),
                        bottomMargin: i < _plans.length - 1 ? 10 : 0,
                        isRecommended: plan.isRecommended,
                      );
                    }),

                    const SizedBox(height: 14),

                    // ── Guarantee strip ───────────────────────────────────
                    Text(
                      '${refundBadgeText()}  ·  Instant access  ·  Cancel anytime',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 11.5),
                    ),

                    const SizedBox(height: 10),

                    // Apple 3.1.2(c): condensed auto-renewal disclosure right
                    // under the Buy buttons, in the viewport before any
                    // scrolling — the full version further down repeats it.
                    SubscriptionLegalText(
                      compact: true,
                      onOpenUrl: (url) {
                        Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => LegalWebScreen(url: url),
                        ));
                      },
                    ),

                    const SizedBox(height: 20),

                    // ── What's included ───────────────────────────────────
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.card,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('What\'s included',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                              )),
                          const SizedBox(height: 10),
                          ...[
                            (Icons.play_circle_outline_rounded, '100 structured video lessons'),
                            (Icons.article_outlined, 'Reading notes & briefings'),
                            (Icons.quiz_outlined, 'Quizzes & flashcards'),
                            (Icons.insights_rounded, 'Progress tracking'),
                            (Icons.all_inclusive_rounded, 'Lifetime access option available'),
                          ].map((item) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              children: [
                                Icon(item.$1, color: AppColors.gold, size: 16),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(item.$2,
                                      style: const TextStyle(
                                        color: AppColors.textSecondary,
                                        fontSize: 13,
                                      )),
                                ),
                              ],
                            ),
                          )),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // ── Part 1 preview ────────────────────────────────────
                    _Part1PreviewSection(
                      // pushReplacement (not push) — this and Part 1's
                      // "Unlock full access" CTA form a two-screen loop; a
                      // plain push here would grow the back stack forever if
                      // a logged-out user bounces between the two.
                      onWatch: () => context.pushReplacement('/part/1'),
                    ),

                    const SizedBox(height: 20),

                    // ── Bottom actions ────────────────────────────────────
                    const Text(
                      'No account required to purchase. Tap a plan to buy.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 12.5,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Center(
                      child: TextButton(
                        onPressed: busy
                            ? null
                            : () async {
                                // A device-linked guest session works fine
                                // for restore too — no registration needed.
                                final ready = await ref
                                    .read(authProvider.notifier)
                                    .ensureSession();
                                if (!ready ||
                                    !ref.read(authProvider).isLoggedIn ||
                                    !mounted) return;
                                ref
                                    .read(iapProvider.notifier)
                                    .restorePurchases();
                              },
                        style: TextButton.styleFrom(
                            foregroundColor: AppColors.gold),
                        child: const Text('Restore Purchases',
                            style: TextStyle(
                                fontSize: 13, fontWeight: FontWeight.w600)),
                      ),
                    ),
                    Center(
                      child: TextButton(
                        onPressed: () => context.push('/login'),
                        style: TextButton.styleFrom(
                            foregroundColor: AppColors.textMuted),
                        child: RichText(
                          text: const TextSpan(
                            style: TextStyle(
                                fontSize: 12, color: AppColors.textMuted),
                            children: [
                              TextSpan(
                                  text:
                                      'Already learning on another device? '),
                              TextSpan(
                                text: 'Sign in',
                                style: TextStyle(
                                    color: AppColors.gold,
                                    fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    SubscriptionLegalText(onOpenUrl: (url) {
                      Navigator.of(context).push(MaterialPageRoute(
                        builder: (_) => LegalWebScreen(url: url),
                      ));
                    }),

                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          ],
        ),
      )),
    );
  }
}

// ── Plan tile ─────────────────────────────────────────────────────────────────

class _PlanTile extends StatelessWidget {
  final _Plan plan;
  /// Null while the real store price is still loading — see [_price] doc
  /// comment (audit M-fallback-price). Renders a neutral placeholder
  /// instead of a stale hardcoded price in that window.
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
    return Padding(
      padding: EdgeInsets.only(bottom: bottomMargin),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: enabled && !isLoading
              ? () {
                  HapticFeedback.mediumImpact();
                  onTap();
                }
              : null,
          borderRadius: BorderRadius.circular(16),
          splashColor: AppColors.gold.withValues(alpha: 0.06),
          highlightColor: AppColors.gold.withValues(alpha: 0.03),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: isRecommended
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
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isRecommended
                    ? AppColors.gold.withValues(alpha: 0.6)
                    : AppColors.border,
                width: isRecommended ? 1.5 : 1,
              ),
              boxShadow: isRecommended
                  ? [
                      BoxShadow(
                        color: AppColors.gold.withValues(alpha: 0.12),
                        blurRadius: 20,
                        offset: const Offset(0, 6),
                      ),
                    ]
                  : null,
            ),
            child: Row(
              children: [
                // Left — badge (if any) + name + description
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (plan.badge != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: isRecommended
                                  ? AppColors.gold
                                  : AppColors.goldFaded,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              plan.badge!,
                              style: TextStyle(
                                color: isRecommended
                                    ? Colors.black
                                    : AppColors.gold,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.3,
                              ),
                            ),
                          ),
                        ),
                      Text(
                        plan.name,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        plan.description,
                        style: TextStyle(
                          color: isRecommended
                              ? AppColors.textSecondary
                              : AppColors.textMuted,
                          fontSize: 12.5,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 12),

                // Right — price + loading
                if (isLoading)
                  SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator.adaptive(
                      strokeWidth: 2.5,
                      valueColor: AlwaysStoppedAnimation<Color>(
                          isRecommended ? AppColors.gold : AppColors.textMuted),
                    ),
                  )
                else if (price == null)
                  const PriceLoadingPlaceholder()
                else
                  Flexible(
                    fit: FlexFit.loose,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            price!,
                            maxLines: 1,
                            style: TextStyle(
                              color: isRecommended
                                  ? AppColors.gold
                                  : AppColors.textPrimary,
                              fontSize: 19,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        Text(
                          plan.period,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: isRecommended
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
                  size: 13,
                  color: isRecommended
                      ? AppColors.gold.withValues(alpha: 0.7)
                      : (enabled
                          ? AppColors.textMuted
                          : AppColors.textMuted.withValues(alpha: 0.4)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Part 1 preview section ────────────────────────────────────────────────────

class _Part1PreviewSection extends StatelessWidget {
  final VoidCallback onWatch;

  const _Part1PreviewSection({required this.onWatch});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onWatch();
        },
        borderRadius: BorderRadius.circular(16),
        splashColor: AppColors.gold.withValues(alpha: 0.06),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.goldFaded,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.gold.withValues(alpha: 0.25)),
                ),
                child: const Icon(Icons.play_circle_outline_rounded,
                    color: AppColors.gold, size: 26),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Part 1 — Always Free',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'The Pre-Islamic Arabian Context · No account needed',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12.5,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const ForwardChevronIcon(
                  color: AppColors.textMuted, size: 14),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProductRetryBanner extends StatelessWidget {
  final String status;
  final VoidCallback onRetry;
  const _ProductRetryBanner({required this.status, required this.onRetry});

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
              const Icon(Icons.warning_amber_rounded,
                  color: AppColors.textMuted, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Text(status,
                    style: const TextStyle(
                        color: AppColors.textSecondary, fontSize: 13)),
              ),
              TextButton(
                onPressed: onRetry,
                style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: const Size(48, 44)),
                child: const Text('Retry',
                    style: TextStyle(color: AppColors.gold, fontSize: 13)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          // Previously hardcoded engineering/QA troubleshooting steps
          // ("Install from a TestFlight link…", "Install from Play Console
          // internal testing… USB/APK installs cannot load plans.") assuming
          // any load failure meant a sideloaded/debug build — meaningless (and
          // unprofessional-looking) to a real App Store/Play Store customer
          // hitting a genuine transient network issue, and actively wrong
          // advice since they can't act on it from a real store install.
          const Text(
            'Check your internet connection, then tap Retry. If this keeps happening, '
            'contact support@themuslimman.com.',
            style: TextStyle(color: AppColors.textMuted, fontSize: 11.5, height: 1.4),
          ),
        ],
      ),
    );
  }
}
