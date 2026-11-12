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
import '../../../core/widgets/ui_kit.dart'
    show
        VerifyingPurchaseBanner,
        PriceLoadingPlaceholder,
        PendingPurchaseRecoveryBanner;
import '../../../l10n/app_strings.dart';
import '../../home/screens/landing_screen.dart' show PlanId;

// ── Plan model (mirrors landing_screen) ──────────────────────────────────────

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

List<({String q, String a})> _faqItems(String lang, String? storePrice) => [
  (q: t(lang, 'faqWhatIncludedQ'), a: t(lang, 'faqWhatIncludedA')),
  (
    q: t(lang, 'faqIsSubscriptionQ'),
    a: storePrice == null
        ? t(lang, 'faqIsSubscriptionAPlain')
        : tWithStorePrice(lang, 'faqIsSubscriptionA', storePrice),
  ),
  (q: t(lang, 'faqRefundGuaranteeQ'), a: refundGuaranteeAnswer(lang)),
  (q: t(lang, 'faqPart1FreeQ'), a: t(lang, 'faqPart1FreeA')),
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

  /// Storefront price only. Never a hardcoded dollar amount — App Store and
  /// Play already price this product for the user's country.
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
        _snack(
          ref.read(authProvider).error ?? t(lang, 'couldNotStartCheckout'),
        );
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
    final auth = ref.watch(authProvider);
    final iap = ref.watch(iapProvider);
    final hasAccess = auth.hasAccess;
    final lang = ref.watch(courseLangProvider);
    final storePrice = iap
        .productForPlan(AppConstants.iapLifetimeIndividual)
        ?.price;

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
          // ── Headline + supporting line ───────────────────────────
          // Leads with what the learner gets ("Learn the Prophet's ﷺ
          // life, in order.") instead of the bare AppBar title, and states
          // the product before the price/legal text below.
          Text(
            t(lang, 'planHeadline'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 20,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.3,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            t(lang, 'planScreenSubtitle'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13.5,
              height: 1.4,
            ),
          ),

          // ── Three compact benefits ───────────────────────────────
          const SizedBox(height: 14),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 8,
            runSpacing: 8,
            children: [
              _BenefitChip(
                icon: Icons.play_circle_outline_rounded,
                label: t(lang, 'benefitVideos'),
              ),
              _BenefitChip(
                icon: Icons.quiz_outlined,
                label: t(lang, 'benefitFlashcards'),
              ),
              _BenefitChip(
                icon: Icons.translate_rounded,
                label: t(lang, 'benefit15Languages'),
              ),
            ],
          ),
          const SizedBox(height: 16),

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
          // Two compact, closely-spaced selectable rows instead of two
          // full cards each with its own buy button — tapping a row only
          // selects it; the single gold button below starts the purchase
          // for whichever row is selected.
          ...List.generate(_plans.length, (i) {
            final plan = _plans[i];
            return _PlanSelectRow(
              plan: plan,
              price: _price(iap, plan),
              selected: _selectedPlanId == plan.id,
              enabled: !hasAccess && !busy,
              onTap: () => setState(() => _selectedPlanId = plan.id),
              bottomMargin: i < _plans.length - 1 ? 8 : 0,
              lang: lang,
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
                disabledBackgroundColor: AppColors.gold.withValues(
                  alpha: 0.4,
                ),
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

          // ── Trust badges ──────────────────────────────────────────
          // Distinct pills instead of one plain gray line that used to
          // blend straight into the legal disclaimer text right below it.
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

          const SizedBox(height: 24),

          // ── What's included ──────────────────────────────────────
          // Audit M2: this used to be followed by a separate "Lifetime
          // access" header + comparison card repeating the exact same
          // "pay once / keep forever / no subscription" facts already on
          // the plan tile above — pure redundancy that padded out the page
          // without adding information. Removed; this card alone now
          // covers "what do I get".
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
                    t(lang, 'included100Videos'),
                  ),
                  (Icons.article_outlined, t(lang, 'includedReadingNotes')),
                  (Icons.quiz_outlined, t(lang, 'includedQuizzesFlashcards')),
                  (Icons.insights_rounded, t(lang, 'includedProgress8Eras')),
                  (Icons.map_outlined, t(lang, 'includedSlidesMindmaps')),
                  (
                    Icons.all_inclusive_rounded,
                    t(lang, 'includedLifetimeOption'),
                  ),
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
                          child: Icon(item.$1, color: AppColors.gold, size: 14),
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

          const SizedBox(height: 24),

          // ── Free preview part ────────────────────────────────────
          Text(
            t(lang, 'wantToPreviewFirst'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 10),
          InkWell(
            // push (not go) preserves whatever back-stack the user arrived
            // with — matches the identical "preview the free part" card on
            // landing_screen.dart and part_screen.dart's continue CTA.
            onTap: () =>
                context.push('/part/${AppConstants.kFreePartNumber}'),
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
          ..._faqItems(
            lang,
            storePrice,
          ).map((item) => _FaqTile(question: item.q, answer: item.a)),

          const SizedBox(height: 16),

          // ── Guarantee + disclaimer ───────────────────────────────
          _GuaranteeRow(lang: lang),

          const SizedBox(height: 16),

          Center(
            child: TextButton.icon(
              onPressed: busy
                  ? null
                  : () async {
                      final ready = await ref
                          .read(authProvider.notifier)
                          .ensureSession();
                      if (!ready || !ref.read(authProvider).isLoggedIn) {
                        _snack(
                          ref.read(authProvider).error ??
                              t(lang, 'couldNotRestore'),
                        );
                        return;
                      }
                      await ref.read(iapProvider.notifier).restorePurchases();
                    },
              icon: const Icon(
                Icons.restore_rounded,
                size: 17,
                color: AppColors.textMuted,
              ),
              label: Text(
                t(lang, 'restorePurchases'),
                style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 13,
                ),
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

// ── Compact plan select row ───────────────────────────────────────────────
//
// Mirrors landing_screen.dart's identical widget — see its doc comment for
// why this replaced the old full-size plan card.
class _PlanSelectRow extends StatelessWidget {
  final _Plan plan;

  /// Null while the real store price is still loading — see [_price] doc
  /// comment (audit M-fallback-price).
  final String? price;
  final bool selected;
  final bool enabled;
  final VoidCallback onTap;
  final double bottomMargin;
  final String lang;

  const _PlanSelectRow({
    required this.plan,
    required this.price,
    required this.selected,
    required this.enabled,
    required this.onTap,
    this.bottomMargin = 0,
    required this.lang,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: bottomMargin),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: enabled ? onTap : null,
          borderRadius: BorderRadius.circular(14),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 12,
            ),
            decoration: BoxDecoration(
              // Flat charcoal card for both rows — gold is reserved for the
              // selected row's border/radio and the shared CTA button.
              color: AppColors.card,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: selected ? AppColors.gold : AppColors.border,
                width: selected ? 1.5 : 1,
              ),
            ),
            child: Row(
              children: [
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
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          // Flexible — see matching comment in
                          // landing_screen.dart's identical widget: a long
                          // translation of the plan name must shrink/wrap
                          // rather than overflow this inner Row.
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
                        maxLines: 2,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                // Price — capped at a shrinkable single line; see matching
                // comment in landing_screen.dart's identical widget.
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
  const _RetryBanner({
    required this.status,
    required this.onRetry,
    required this.lang,
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
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }
}

/// Small pill badge used in the trust-signal row (refund policy, instant
/// access, one-time payment) — visually distinct from the muted legal
/// disclosure text right after it, instead of both reading as one gray
/// wall of fine print. Mirrors landing_screen.dart's identical widget.
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
