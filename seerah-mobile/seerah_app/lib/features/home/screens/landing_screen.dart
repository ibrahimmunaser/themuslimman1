import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/iap_provider.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/adaptive_icons.dart';
import '../../../core/widgets/legal_web_screen.dart';
import '../../../core/widgets/subscription_legal_text.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../core/utils/refund_copy.dart';
import '../../../core/utils/system_insets.dart';
import '../../../l10n/app_strings.dart';

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
  final String nameKey;
  final String descriptionKey;
  final String periodKey;
  final String? badgeKey;
  final bool isRecommended;

  const _Plan({
    required this.id,
    required this.iapId,
    required this.nameKey,
    required this.descriptionKey,
    required this.periodKey,
    this.badgeKey,
    this.isRecommended = false,
  });
}

// Public offer — Individual Lifetime (one-time, country-priced) and
// Individual Monthly ($1.99/mo). Family is no longer sold going forward
// (existing purchasers keep their access/entitlements as-is).
//
// Lifetime is listed first ("Keep Forever"). Monthly carries "Popular".
const _plans = [
  _Plan(
    id: PlanId.individualLifetime,
    iapId: AppConstants.iapLifetimeIndividual,
    nameKey: 'planLifetime',
    descriptionKey: 'lifetimeAccessCaption',
    periodKey: 'onceSuffix',
    badgeKey: 'recommended',
    isRecommended: true,
  ),
  _Plan(
    id: PlanId.individualMonthly,
    iapId: AppConstants.iapMonthlyIndividual,
    nameKey: 'planMonthly',
    descriptionKey: 'cancelAnytime',
    periodKey: 'perMonth',
    badgeKey: 'mostPopular',
    isRecommended: false,
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

  // Which compact plan row is currently selected (radio-style) — the single
  // CTA button below the two rows buys whichever one this points at.
  // Defaults to the recommended plan.
  PlanId _selectedPlanId = _plans
      .firstWhere((p) => p.isRecommended, orElse: () => _plans.first)
      .id;

  _Plan get _selectedPlan => _plans.firstWhere((p) => p.id == _selectedPlanId);

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

  /// Storefront price only. A missing product stays blank rather than
  /// showing a hardcoded US dollar amount.
  String? _price(IAPState iap, _Plan plan) {
    return iap.productForPlan(plan.iapId)?.price;
  }

  Future<void> _buyPlan(IAPState iap, _Plan plan) async {
    final lang = ref.read(courseLangProvider);
    if (_buyTapInFlight ||
        iap.status == IAPStatus.purchasing ||
        iap.status == IAPStatus.verifying ||
        iap.status == IAPStatus.loading) {
      return;
    }
    if (!iap.isAvailable) {
      _snack(ref.read(iapProvider).unavailableProductMessage(lang));
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
        _snack(ref.read(iapProvider).unavailableProductMessage(lang));
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
        _snack(
          ref.read(authProvider).error ??
              t(ref.read(courseLangProvider), 'couldNotStartCheckout'),
        );
        return;
      }

      // Call buy on the notifier (survives LandingScreen dispose). Do not
      // gate on mounted — that was aborting StoreKit for Apple review.
      final started = await ref.read(iapProvider.notifier).buy(product);
      if (!started) {
        if (mounted) setState(() => _purchasingPlanId = null);
        _snack(t(ref.read(courseLangProvider), 'purchaseAlreadyProcessing'));
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
      _snack(t(ref.read(courseLangProvider), 'purchaseCancelled'));
    }
    if (next.status == IAPStatus.restoreEmpty &&
        prev?.status != IAPStatus.restoreEmpty) {
      if (mounted) setState(() => _purchasingPlanId = null);
      _snack(t(ref.read(courseLangProvider), 'noPurchasesToRestore'));
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

    final lang = ref.read(courseLangProvider);

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
            padding: EdgeInsets.fromLTRB(
              28,
              28,
              28,
              40 + bottomSystemInset(context),
            ),
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
                Text(
                  t(lang, 'jazakAllahKhayran'),
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  t(lang, 'purchaseSuccessBody'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
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
                  child: Text(
                    t(lang, 'startLearning'),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
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
    final iap = ref.watch(iapProvider);
    final lang = ref.watch(courseLangProvider);
    final busy =
        _buyTapInFlight ||
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
      body: AppGradientBackground(
        child: SafeArea(
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
                          tooltip: t(lang, 'back'),
                          onPressed: () => context.pop(),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(
                            minWidth: 40,
                            minHeight: 40,
                          ),
                        ),
                      ),
                    Expanded(
                      // ── Headline + supporting line ───────────────────
                      // Leads with what the learner gets ("Learn the
                      // Prophet's ﷺ life, in order.") instead of the
                      // generic "Choose your plan" label, and states the
                      // product before the price/legal text below.
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            t(lang, 'planHeadline'),
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.3,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            t(lang, 'planScreenSubtitle'),
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 13.5,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // ── Three compact benefits ───────────────────────────────
              // Shown above the plan rows so the value proposition is
              // visible before the learner sees a single price.
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _BenefitChip(icon: Icons.play_circle_outline_rounded, label: t(lang, 'benefitVideos')),
                    _BenefitChip(icon: Icons.quiz_outlined, label: t(lang, 'benefitFlashcards')),
                    _BenefitChip(icon: Icons.translate_rounded, label: t(lang, 'benefit15Languages')),
                  ],
                ),
              ),

              Expanded(
                child: SingleChildScrollView(
                  controller: _scrollCtrl,
                  padding: EdgeInsets.fromLTRB(
                    20,
                    12,
                    20,
                    24 + bottomSystemInset(context),
                  ),
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
                          status: iap.storeStatusLabel(lang),
                          lang: lang,
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
                      // Two compact, closely-spaced selectable rows (radio
                      // style) instead of two large cards each with its own
                      // buy button — tapping a row only selects it; the one
                      // gold button below actually starts the purchase for
                      // whichever row is selected.
                      ...List.generate(_plans.length, (i) {
                        final plan = _plans[i];
                        return _PlanSelectRow(
                          plan: plan,
                          lang: lang,
                          price: _price(iap, plan),
                          selected: _selectedPlanId == plan.id,
                          enabled: !busy && !hasAccess,
                          onTap: () =>
                              setState(() => _selectedPlanId = plan.id),
                          bottomMargin: i < _plans.length - 1 ? 8 : 0,
                        );
                      }),

                      const SizedBox(height: 14),

                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: (!busy && !hasAccess)
                              ? () => _buyPlan(iap, _selectedPlan)
                              : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.gold,
                            disabledBackgroundColor:
                                AppColors.gold.withValues(alpha: 0.4),
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: (_purchasingPlanId == _selectedPlanId && busy)
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2.4,
                                    color: Colors.black,
                                  ),
                                )
                              : Text(
                                  _selectedPlanId == PlanId.individualLifetime
                                      ? t(lang, 'getLifetimeAccessCta')
                                      : t(lang, 'subscribeMonthlyCta'),
                                  textAlign: TextAlign.center,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                        ),
                      ),

                      const SizedBox(height: 16),

                      // ── Trust badges ───────────────────────────────────────
                      // Kept to facts true for every plan on offer (refund,
                      // instant access) — a blanket "One-time payment" pill
                      // no longer belongs here now that Monthly is also sold.
                      Wrap(
                        alignment: WrapAlignment.center,
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _TrustBadge(
                            icon: Icons.shield_outlined,
                            label: refundBadgeText(lang),
                          ),
                          _TrustBadge(
                            icon: Icons.flash_on_rounded,
                            label: t(lang, 'instantAccess'),
                          ),
                        ],
                      ),

                      const SizedBox(height: 14),

                      // Apple 3.1.2(c): condensed auto-renewal disclosure right
                      // under the Buy buttons, in the viewport before any
                      // scrolling — the full version further down repeats it.
                      SubscriptionLegalText(
                        compact: true,
                        onOpenUrl: (url) {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => LegalWebScreen(url: url),
                            ),
                          );
                        },
                      ),

                      const SizedBox(height: 24),

                      // ── What's included ───────────────────────────────────
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(
                                  Icons.auto_awesome_rounded,
                                  color: AppColors.gold,
                                  size: 17,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  t(lang, 'whatsIncluded'),
                                  style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            ...[
                              (
                                Icons.play_circle_outline_rounded,
                                t(lang, 'includedVideos'),
                              ),
                              (
                                Icons.article_outlined,
                                t(lang, 'includedNotes'),
                              ),
                              (Icons.quiz_outlined, t(lang, 'includedQuizzes')),
                              (
                                Icons.insights_rounded,
                                t(lang, 'includedProgress'),
                              ),
                              // "Cancel anytime" deliberately left out of this
                              // shared list — it only applies to the Monthly
                              // plan (shown on its own row above) and doesn't
                              // apply to a one-time Lifetime purchase.
                            ].map(
                              (item) => Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 28,
                                      height: 28,
                                      decoration: const BoxDecoration(
                                        color: AppColors.goldFaded,
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(
                                        item.$1,
                                        color: AppColors.gold,
                                        size: 14,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        item.$2,
                                        style: const TextStyle(
                                          color: AppColors.textSecondary,
                                          fontSize: 13.5,
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

                      const SizedBox(height: 20),

                      // ── Free part preview ────────────────────────────────────
                      _Part1PreviewSection(
                        lang: lang,
                        // pushReplacement (not push) — this and the free
                        // part's "Unlock full access" CTA form a two-screen
                        // loop; a plain push here would grow the back stack
                        // forever if a logged-out user bounces between the two.
                        onWatch: () => context.pushReplacement(
                          '/part/${AppConstants.kFreePartNumber}',
                        ),
                      ),

                      const SizedBox(height: 20),

                      // ── Bottom actions ────────────────────────────────────
                      Text(
                        t(lang, 'noAccountRequired'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 12.5,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 10),
                      // A single, compact row reads as one cohesive "secondary
                      // actions" group instead of two full-width links floating
                      // one under the other with no visual relationship. Wrap
                      // (not Row) lets the sign-in link — notably longer in
                      // some languages — drop to its own line instead of
                      // overflowing on narrow screens.
                      Wrap(
                        alignment: WrapAlignment.center,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          TextButton(
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
                                        !mounted)
                                      return;
                                    ref
                                        .read(iapProvider.notifier)
                                        .restorePurchases();
                                  },
                            style: TextButton.styleFrom(
                              foregroundColor: AppColors.gold,
                            ),
                            child: Text(
                              t(lang, 'restorePurchases'),
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          Container(
                            width: 1,
                            height: 14,
                            margin: const EdgeInsets.symmetric(horizontal: 2),
                            color: AppColors.border,
                          ),
                          TextButton(
                            onPressed: () => context.push('/login'),
                            style: TextButton.styleFrom(
                              foregroundColor: AppColors.textMuted,
                            ),
                            child: Text(
                              t(lang, 'alreadyLearningSignIn'),
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textMuted,
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                      SubscriptionLegalText(
                        onOpenUrl: (url) {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => LegalWebScreen(url: url),
                            ),
                          );
                        },
                      ),

                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Compact plan select row ───────────────────────────────────────────────
//
// Replaces the old full-size plan card: a single closely-spaced row per
// plan with a radio-style selection indicator. Tapping a row only selects
// it — the shared gold CTA button below the two rows is what actually
// starts the purchase. This lets both plans, and the purchase button, sit
// together on screen at normal text sizes instead of one giant card per
// plan pushing everything else below the fold.
class _PlanSelectRow extends StatelessWidget {
  final _Plan plan;
  final String lang;

  /// Null while the real store price is still loading — see [_price] doc
  /// comment (audit M-fallback-price). Renders a neutral placeholder
  /// instead of a stale hardcoded price in that window.
  final String? price;
  final bool selected;
  final bool enabled;
  final VoidCallback onTap;
  final double bottomMargin;

  const _PlanSelectRow({
    required this.plan,
    required this.lang,
    required this.price,
    required this.selected,
    required this.enabled,
    required this.onTap,
    this.bottomMargin = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: bottomMargin),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: enabled
              ? () {
                  HapticFeedback.selectionClick();
                  onTap();
                }
              : null,
          borderRadius: BorderRadius.circular(14),
          splashColor: AppColors.gold.withValues(alpha: 0.06),
          highlightColor: AppColors.gold.withValues(alpha: 0.03),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              // Flat charcoal card for both rows — gold is reserved for the
              // selected row's border/radio and the CTA button, instead of
              // a gold glow sitting on every card regardless of selection.
              color: AppColors.card,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: selected ? AppColors.gold : AppColors.border,
                width: selected ? 1.5 : 1,
              ),
            ),
            child: Row(
              children: [
                // Radio-style selection indicator.
                AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: selected ? AppColors.gold : Colors.transparent,
                    border: Border.all(
                      color: selected ? AppColors.gold : AppColors.textMuted,
                      width: 1.5,
                    ),
                  ),
                  child: selected
                      ? const Icon(
                          Icons.check_rounded,
                          size: 13,
                          color: Colors.black,
                        )
                      : null,
                ),
                const SizedBox(width: 12),

                // Name + badge + description.
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          // Flexible (not a bare Text) — a long translation
                          // of the plan name, combined with the badge next
                          // to it, must shrink/wrap instead of overflowing
                          // this inner Row horizontally (it sits inside the
                          // Expanded above, which only bounds width, it
                          // doesn't itself prevent a RenderFlex overflow).
                          Flexible(
                            child: Text(
                              t(lang, plan.nameKey),
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          if (plan.badgeKey != null) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 7,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.gold,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                t(lang, plan.badgeKey!),
                                style: const TextStyle(
                                  color: Colors.black,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.3,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        t(lang, plan.descriptionKey),
                        // Caption can run to 2 lines in a longer translation
                        // without erroring — it just makes the row a touch
                        // taller, which is fine for two closely-spaced rows.
                        maxLines: 2,
                        style: const TextStyle(
                          // Brighter than the old muted gray — legible body
                          // text instead of a muddy caption.
                          color: AppColors.textSecondary,
                          fontSize: 12.5,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 10),

                // Price — capped at a shrinkable single line so a long
                // currency/suffix combination (long country price string,
                // or a verbose translated "once"/"/month" suffix) scales
                // down instead of overflowing the row horizontally.
                if (price == null)
                  const PriceLoadingPlaceholder()
                else
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 108),
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerRight,
                      child: Text.rich(
                        TextSpan(
                          children: [
                            TextSpan(text: price),
                            TextSpan(
                              text: plan.periodKey == 'perMonth'
                                  ? t(lang, 'perMonth')
                                  : ' ${t(lang, plan.periodKey)}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                        maxLines: 1,
                        textDirection: TextDirection.ltr,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// One of the three compact benefit chips shown above the plan rows.
class _BenefitChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _BenefitChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: AppColors.gold),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

/// Small pill badge used in a trust-signal row (refund policy, instant
/// access, one-time payment) — visually distinct from the muted legal
/// disclosure text that follows it, instead of both reading as one gray
/// wall of fine print.
class _TrustBadge extends StatelessWidget {
  final IconData icon;
  final String label;

  const _TrustBadge({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: AppColors.gold),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Free part preview section ─────────────────────────────────────────────────

class _Part1PreviewSection extends StatelessWidget {
  final String lang;
  final VoidCallback onWatch;

  const _Part1PreviewSection({required this.lang, required this.onWatch});

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
                  border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.25),
                  ),
                ),
                child: const Icon(
                  Icons.play_circle_outline_rounded,
                  color: AppColors.gold,
                  size: 26,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t(lang, 'part1AlwaysFree'),
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      t(lang, 'part1NoAccountNeeded'),
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12.5,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const ForwardChevronIcon(color: AppColors.textMuted, size: 14),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProductRetryBanner extends StatelessWidget {
  final String status;
  final String lang;
  final VoidCallback onRetry;
  const _ProductRetryBanner({
    required this.status,
    required this.lang,
    required this.onRetry,
  });

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
                  minimumSize: const Size(48, 44),
                ),
                child: Text(
                  t(lang, 'retry'),
                  style: const TextStyle(color: AppColors.gold, fontSize: 13),
                ),
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
          Text(
            t(lang, 'checkConnectionRetry'),
            style: const TextStyle(
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
