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
import '../../../core/providers/part_provider.dart';
import '../../../core/widgets/ui_kit.dart' show VerifyingPurchaseBanner, PriceLoadingPlaceholder, PendingPurchaseRecoveryBanner;
import '../../../l10n/app_strings.dart';
import '../../home/screens/landing_screen.dart' show PlanId;

// ── Plan model (mirrors landing_screen) ──────────────────────────────────────

class _Plan {
  final PlanId id;
  final String iapId;
  final String nameKey;
  final String descriptionKey;
  final String fallbackPrice;
  final String periodKey;
  final String? badgeKey;
  final bool isRecommended;

  const _Plan({
    required this.id,
    required this.iapId,
    required this.nameKey,
    required this.descriptionKey,
    required this.fallbackPrice,
    required this.periodKey,
    this.badgeKey,
    this.isRecommended = false,
  });
}

const _plans = [
  _Plan(
    id: PlanId.individualLifetime,
    iapId: AppConstants.iapLifetimeIndividual,
    nameKey: 'planLifetime',
    descriptionKey: 'oneLearnerPayOnce',
    fallbackPrice: '\$${AppConstants.lifetimePrice}',
    periodKey: 'oneTime',
    badgeKey: 'mostPopular',
    isRecommended: true,
  ),
  _Plan(
    id: PlanId.individualMonthly,
    iapId: AppConstants.iapMonthlyIndividual,
    nameKey: 'planMonthly',
    descriptionKey: 'oneLearnerCancelAnytime',
    fallbackPrice: '\$${AppConstants.monthlyPrice}',
    periodKey: 'perMonth',
  ),
];

List<({String q, String a})> _faqItems(String lang) => [
  (
    q: t(lang, 'faqWhatIncludedQ'),
    a: t(lang, 'faqWhatIncludedA'),
  ),
  (
    q: t(lang, 'faqCancelAnytimeQ'),
    a: t(lang, 'faqCancelAnytimeA'),
  ),
  (
    q: t(lang, 'faqRefundGuaranteeQ'),
    a: refundGuaranteeAnswer(lang),
  ),
  (
    q: t(lang, 'faqPart1FreeQ'),
    a: t(lang, 'faqPart1FreeA'),
  ),
  (
    q: t(lang, 'faqMonthlyVsLifetimeQ'),
    a: tv(lang, 'faqMonthlyVsLifetimeA', {'m': AppConstants.monthlyPrice, 'l': AppConstants.lifetimePrice}),
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
      final product = await ref
          .read(iapProvider.notifier)
          .resolveProductForPlan(plan.iapId);
      if (product == null) {
        if (mounted) setState(() => _purchasingPlanId = null);
        _snack(ref.read(iapProvider).unavailableProductMessage(lang));
        return;
      }

      // Defense in depth: ensure a session exists even if auth state went stale.
      final ready = await ref.read(authProvider.notifier).ensureSession();
      if (!ready || !ref.read(authProvider).isLoggedIn) {
        if (mounted) setState(() => _purchasingPlanId = null);
        _snack(ref.read(authProvider).error ??
            t(lang, 'couldNotStartCheckout'));
        return;
      }

      final started = await ref.read(iapProvider.notifier).buy(product);
      if (!started && mounted) {
        setState(() => _purchasingPlanId = null);
        _snack(t(lang, 'purchaseAlreadyProcessing'));
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
    final lang = ref.read(courseLangProvider);
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
      _snack(t(lang, 'purchaseCancelled'));
    }
    if (next.status == IAPStatus.restoreEmpty &&
        prev?.status != IAPStatus.restoreEmpty) {
      if (mounted) setState(() => _purchasingPlanId = null);
      _snack(t(lang, 'noPurchasesToRestore'));
      ref.read(iapProvider.notifier).clearError();
    }
  }

  void _showSuccessSheet() {
    if (!mounted) return;
    final lang = ref.read(courseLangProvider);

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
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
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
    final lang = ref.watch(courseLangProvider);

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
        title: Text(t(lang, 'chooseYourPlan')),
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
              text: t(lang, 'youHaveFullAccess'),
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
              status: iap.storeStatusLabel(lang),
              lang: lang,
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
              lang: lang,
            );
          }),

          const SizedBox(height: 12),
          Text(
            tv(lang, 'refundInstantCancel', {'refund': refundBadgeText(lang)}),
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
          Text(
            t(lang, 'whatsIncluded'),
            style: const TextStyle(
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
                    t(lang, 'included100Videos'),
                  ),
                  (Icons.article_outlined, t(lang, 'includedReadingNotes')),
                  (Icons.quiz_outlined, t(lang, 'includedQuizzesFlashcards')),
                  (
                    Icons.insights_rounded,
                    t(lang, 'includedProgress8Eras'),
                  ),
                  (Icons.map_outlined, t(lang, 'includedSlidesMindmaps')),
                  (
                    Icons.all_inclusive_rounded,
                    t(lang, 'includedLifetimeOption'),
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
          Text(
            t(lang, 'monthlyVsLifetime'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          _ComparisonCard(
            title: t(lang, 'planMonthly'),
            bullets: [
              t(lang, 'lowerUpfrontCost'),
              '\$${AppConstants.monthlyPrice}${t(lang, 'perMonth')}',
              t(lang, 'cancelFromStoreAccount'),
            ],
          ),
          const SizedBox(height: 10),
          _ComparisonCard(
            title: t(lang, 'planLifetime'),
            bullets: [
              t(lang, 'payOnceKeepForever'),
              '\$${AppConstants.lifetimePrice} ${t(lang, 'oneTime')}',
              t(lang, 'bestLongTermValue'),
            ],
            highlighted: true,
          ),

          const SizedBox(height: 28),

          // ── Free Part 1 ──────────────────────────────────────────
          Text(
            t(lang, 'wantToPreviewFirst'),
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
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
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t(lang, 'part1AlwaysFree'),
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          t(lang, 'watchPart1FreeNoPurchase'),
                          style: const TextStyle(
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
          Text(
            t(lang, 'pricingQuestions'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          ..._faqItems(lang).map(
            (item) => _FaqTile(question: item.q, answer: item.a),
          ),

          const SizedBox(height: 16),

          // ── Guarantee + disclaimer ───────────────────────────────
          _GuaranteeRow(lang: lang),

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
                                t(lang, 'couldNotRestore'));
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
              label: Text(
                t(lang, 'restorePurchases'),
                style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
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
  final String lang;

  const _PlanTile({
    required this.plan,
    required this.price,
    required this.isLoading,
    required this.enabled,
    required this.onTap,
    this.isRecommended = false,
    this.bottomMargin = 0,
    required this.lang,
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
                      if (plan.badgeKey != null)
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
                              t(lang, plan.badgeKey!),
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
                        t(lang, plan.nameKey),
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        t(lang, plan.descriptionKey),
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
                          t(lang, plan.periodKey),
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
  final String lang;
  const _RetryBanner({required this.status, required this.onRetry, required this.lang});

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
                child: Text(
                  t(lang, 'retry'),
                  style: const TextStyle(color: AppColors.gold, fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          // See matching comment in landing_screen.dart's _ProductRetryBanner
          // — this used to show internal QA install instructions to real
          // customers hitting an ordinary transient load failure.
          Text(
            t(lang, 'checkConnectionRetrySupport'),
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

class _GuaranteeRow extends StatelessWidget {
  final String lang;
  const _GuaranteeRow({required this.lang});

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
            refundBadgeText(lang),
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
