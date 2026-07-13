import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/iap_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui_kit.dart';

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
    id: PlanId.individualMonthly,
    iapId: AppConstants.iapMonthlyIndividual,
    name: 'Individual Monthly',
    description: '1 learner • 1-month term • cancel anytime',
    fallbackPrice: '\$${AppConstants.monthlyPrice}',
    period: '/month',
    badge: 'Recommended',
    isRecommended: true,
  ),
  _Plan(
    id: PlanId.familyMonthly,
    iapId: AppConstants.iapMonthlyFamily,
    name: 'Family Monthly',
    description: 'Up to 5 profiles • 1-month term • cancel anytime',
    fallbackPrice: '\$${AppConstants.familyMonthlyPrice}',
    period: '/month',
    badge: 'For Families',
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
    description: 'Up to 5 profiles • pay once, own forever',
    fallbackPrice: '\$${AppConstants.familyLifetimePrice}',
    period: 'one-time',
    badge: 'Best Value',
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

  String _price(IAPState iap, _Plan plan) =>
      iap.productForPlan(plan.iapId)?.price ?? plan.fallbackPrice;

  Future<void> _buyPlan(IAPState iap, _Plan plan) async {
    if (iap.status == IAPStatus.purchasing ||
        iap.status == IAPStatus.verifying ||
        iap.status == IAPStatus.loading) {
      return;
    }
    if (!iap.isAvailable) {
      _snack(ref.read(iapProvider).unavailableProductMessage());
      return;
    }

    setState(() => _purchasingPlanId = plan.id);

    // Resolve the StoreKit product first so buy() can still run even if the
    // widget tree rebuilds after ensureSession().
    final product =
        await ref.read(iapProvider.notifier).resolveProductForPlan(plan.iapId);
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
    if (!ready) {
      ref.read(iapProvider.notifier).clearPurchaseIntent();
      if (mounted) setState(() => _purchasingPlanId = null);
      _snack(ref.read(authProvider).error ??
          'Could not start checkout. Please try again.');
      return;
    }

    // Call buy on the notifier (survives LandingScreen dispose). Do not
    // gate on mounted — that was aborting StoreKit for Apple review.
    await ref.read(iapProvider.notifier).buy(product);
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
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<IAPState>(iapProvider, _onIAP);
    final iap = ref.watch(iapProvider);
    final busy = iap.status == IAPStatus.purchasing ||
        iap.status == IAPStatus.verifying ||
        iap.status == IAPStatus.loading;

    final showStoreWarning = !iap.isAvailable && iap.status != IAPStatus.loading;
    final showRetry = iap.needsProductReload;
    final showRecovery = iap.hasPendingLink;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: AppGradientBackground(child: SafeArea(
        child: Column(
          children: [
            // ── Top bar ───────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 16, 0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
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
                controller: _scrollCtrl,
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ── Recovery banner — legacy unlinked purchase ─────────
                    if (showRecovery) ...[
                      _RecoveryBanner(
                        onClaim: () async {
                          await ref
                              .read(iapProvider.notifier)
                              .claimPendingPurchase();
                        },
                      ),
                      const SizedBox(height: 12),
                    ],

                    if (showStoreWarning) ...[
                      _StoreWarningBanner(
                        text: iap.unavailableProductMessage(),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        iap.storeStatusLabel,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 11.5,
                        ),
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

                    // ── Plans ─────────────────────────────────────────────
                    ...List.generate(_plans.length, (i) {
                      final plan = _plans[i];
                      return _PlanTile(
                        plan: plan,
                        price: _price(iap, plan),
                        isLoading: _purchasingPlanId == plan.id && busy,
                        enabled: !busy,
                        onTap: () => _buyPlan(iap, plan),
                        bottomMargin: i < _plans.length - 1 ? 10 : 0,
                        isRecommended: plan.isRecommended,
                      );
                    }),

                    const SizedBox(height: 14),

                    // ── Guarantee strip ───────────────────────────────────
                    const Text(
                      '7-day refund guarantee  ·  Instant access  ·  Cancel anytime',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textMuted, fontSize: 11.5),
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
                                Text(item.$2,
                                    style: const TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 13,
                                    )),
                              ],
                            ),
                          )),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // ── Part 1 preview ────────────────────────────────────
                    _Part1PreviewSection(
                      onWatch: () => context.push('/part/1'),
                    ),

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
                            : () async {
                                // A device-linked guest session works fine
                                // for restore too — no registration needed.
                                final ready = await ref
                                    .read(authProvider.notifier)
                                    .ensureSession();
                                if (!ready || !mounted) return;
                                ref
                                    .read(iapProvider.notifier)
                                    .restorePurchases();
                              },
                        style: TextButton.styleFrom(
                            foregroundColor: AppColors.textMuted),
                        child: const Text('Restore Purchases',
                            style: TextStyle(fontSize: 12)),
                      ),
                    ),

                    const SizedBox(height: 12),

                    _SubscriptionLegalText(onOpenUrl: (url) {
                      Navigator.of(context).push(MaterialPageRoute(
                        builder: (_) => _LegalWebScreen(url: url),
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
  final String price;
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
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: isRecommended ? AppColors.gold : AppColors.textMuted,
                    ),
                  )
                else
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        price,
                        style: TextStyle(
                          color: isRecommended
                              ? AppColors.gold
                              : AppColors.textPrimary,
                          fontSize: 19,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        plan.period,
                        style: TextStyle(
                          color: isRecommended
                              ? AppColors.gold.withValues(alpha: 0.7)
                              : AppColors.textMuted,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),

                const SizedBox(width: 10),
                Icon(
                  Icons.arrow_forward_ios_rounded,
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

// ── Subscription legal text ───────────────────────────────────────────────────

class _SubscriptionLegalText extends StatelessWidget {
  final void Function(String url) onOpenUrl;
  const _SubscriptionLegalText({required this.onOpenUrl});

  @override
  Widget build(BuildContext context) {
    const baseUrl = AppConstants.baseUrl;
    final style = const TextStyle(color: AppColors.textMuted, fontSize: 11, height: 1.5);
    final linkStyle = style.copyWith(
      color: AppColors.textSecondary,
      decoration: TextDecoration.underline,
      decorationColor: AppColors.textSecondary,
    );

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: RichText(
        textAlign: TextAlign.center,
        text: TextSpan(style: style, children: [
          const TextSpan(
            text: 'Individual Monthly and Family Monthly are auto-renewing '
                '1-month subscriptions that renew unless cancelled at least 24 '
                'hours before the end of the current period. Individual Lifetime '
                'and Family Lifetime are one-time, non-renewing purchases. Manage '
                'or cancel a subscription in your App Store or Google Play account '
                'settings. Payment will be charged to your store account upon '
                'purchase confirmation. ',
          ),
          TextSpan(
            text: 'Privacy Policy',
            style: linkStyle,
            recognizer: TapGestureRecognizer()
              ..onTap = () => onOpenUrl('$baseUrl/privacy'),
          ),
          const TextSpan(text: '  ·  '),
          TextSpan(
            text: 'Terms of Use (EULA)',
            style: linkStyle,
            recognizer: TapGestureRecognizer()
              ..onTap = () => onOpenUrl('$baseUrl/terms'),
          ),
        ]),
      ),
    );
  }
}

class _LegalWebScreen extends StatefulWidget {
  final String url;
  const _LegalWebScreen({required this.url});

  @override
  State<_LegalWebScreen> createState() => _LegalWebScreenState();
}

class _LegalWebScreenState extends State<_LegalWebScreen> {
  late final WebViewController _ctrl;
  bool _loading = true;

  String get _title {
    if (widget.url.contains('privacy')) return 'Privacy Policy';
    if (widget.url.contains('terms')) return 'Terms of Use (EULA)';
    return 'themuslimman.com';
  }

  @override
  void initState() {
    super.initState();
    _ctrl = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(AppColors.background)
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (_) { if (mounted) setState(() => _loading = true); },
        onPageFinished: (_) { if (mounted) setState(() => _loading = false); },
      ))
      ..loadRequest(Uri.parse(widget.url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(_title,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.border),
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _ctrl),
          if (_loading)
            const Center(child: CircularProgressIndicator(color: AppColors.gold)),
        ],
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
              const Icon(Icons.arrow_forward_ios_rounded,
                  color: AppColors.textMuted, size: 14),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecoveryBanner extends StatelessWidget {
  final VoidCallback onClaim;
  const _RecoveryBanner({required this.onClaim});

  @override
  Widget build(BuildContext context) {
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
          const Expanded(
            child: Text(
              'You have a pending purchase — tap Claim to unlock access. No account required.',
              style: TextStyle(
                  color: AppColors.textPrimary, fontSize: 13, height: 1.4),
            ),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: onClaim,
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              minimumSize: Size.zero,
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

class _StoreWarningBanner extends StatelessWidget {
  final String text;
  const _StoreWarningBanner({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline_rounded,
              color: AppColors.textMuted, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text,
                style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12.5,
                    height: 1.45)),
          ),
        ],
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
                    minimumSize: const Size(44, 36)),
                child: const Text('Retry',
                    style: TextStyle(color: AppColors.gold, fontSize: 13)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Install from Play Console internal testing. USB/APK installs cannot load plans.',
            style: TextStyle(color: AppColors.textMuted, fontSize: 11.5, height: 1.4),
          ),
        ],
      ),
    );
  }
}
