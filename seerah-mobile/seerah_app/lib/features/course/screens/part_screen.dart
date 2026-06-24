import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/data/parts_data.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../widgets/video_tab.dart';
import '../widgets/read_tab.dart';
import '../widgets/flashcards_tab.dart';
import '../widgets/quiz_tab.dart';
import '../widgets/slides_tab.dart';
import '../widgets/audio_tab.dart';
import '../widgets/mindmap_tab.dart';
import '../widgets/infographics_tab.dart';

// ── Part overview screen ──────────────────────────────────────────────────────

class PartScreen extends ConsumerStatefulWidget {
  final int partNumber;
  /// When set, automatically opens this asset viewer immediately after mount.
  /// Values: 'video' | 'read' | 'flashcards' | 'quiz' | 'slides' | 'infographics' | 'audio' | 'mindmap'
  final String? initialTab;
  const PartScreen({super.key, required this.partNumber, this.initialTab});

  @override
  ConsumerState<PartScreen> createState() => _PartScreenState();
}

class _PartScreenState extends ConsumerState<PartScreen> {
  int get partNumber => widget.partNumber;

  @override
  void initState() {
    super.initState();
    // Record visit for progress tracking as soon as the screen loads.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(progressProvider.notifier).markPartViewed(widget.partNumber);
      if (widget.initialTab != null) _autoOpen();
    });
  }

  void _autoOpen() {
    if (!mounted) return;
    final tab = widget.initialTab;
    switch (tab) {
      case 'video':
        _open(context, title: 'Watch — Part $partNumber', child: VideoTab(partNumber: partNumber));
      case 'briefing':
        _open(context, title: 'Briefing — Part $partNumber', child: ReadTab(partNumber: partNumber, initialSection: 0));
      case 'facts':
        _open(context, title: 'Key Facts — Part $partNumber', child: ReadTab(partNumber: partNumber, initialSection: 2));
      case 'read':
        _open(context, title: 'Read — Part $partNumber', child: ReadTab(partNumber: partNumber));
      case 'flashcards':
        _open(context, title: 'Flashcards — Part $partNumber', child: FlashcardsTab(partNumber: partNumber));
      case 'quiz':
        _open(context, title: 'Quiz — Part $partNumber', child: QuizTab(partNumber: partNumber));
      case 'slides':
        _open(context, title: 'Slides — Part $partNumber', child: SlidesTab(partNumber: partNumber, initialDeck: 1));
      case 'infographics':
        _open(context, title: 'Infographics — Part $partNumber', child: InfographicsTab(partNumber: partNumber));
      case 'audio':
        _openAssetWhenReady(
          urlGetter: (a) => a.audioUrl,
          title: 'Audio — Part $partNumber',
          builder: (url) => AudioTab(audioUrl: url, partTitle: PARTS.firstWhere((p) => p.partNumber == partNumber, orElse: () => PARTS.first).title),
        );
      case 'mindmap':
        _openAssetWhenReady(
          urlGetter: (a) => a.mindmapUrl,
          title: 'Mindmap — Part $partNumber',
          builder: (url) => MindmapTab(mindmapUrl: url),
        );
    }
  }

  /// Waits up to 8s for the partAssetsProvider to resolve, then opens the viewer.
  Future<void> _openAssetWhenReady({
    required String? Function(PartAssets) urlGetter,
    required String title,
    required Widget Function(String url) builder,
  }) async {
    final existing = ref.read(partAssetsProvider(partNumber)).valueOrNull;
    if (existing != null) {
      final url = urlGetter(existing);
      if (url != null && mounted) _open(context, title: title, child: builder(url));
      return;
    }
    // Assets are still loading — wait for them
    for (var i = 0; i < 16; i++) {
      await Future<void>.delayed(const Duration(milliseconds: 500));
      if (!mounted) return;
      final assets = ref.read(partAssetsProvider(partNumber)).valueOrNull;
      if (assets != null) {
        final url = urlGetter(assets);
        if (url != null && mounted) _open(context, title: title, child: builder(url));
        return;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final part = PARTS.firstWhere(
      (p) => p.partNumber == partNumber,
      orElse: () => PARTS.first,
    );
    final eraColor = AppColors.forEra(part.era);

    final authState = ref.watch(authProvider);
    final isPaidPart = partNumber > 1;
    final hasAccess = authState.hasAccess;

    if (isPaidPart && !hasAccess) {
      return _PaywallScreen(
        partNumber: partNumber,
        eraColor: eraColor,
        partTitle: part.title,
      );
    }

    final assetsAsync = ref.watch(partAssetsProvider(partNumber));
    final infographicsAsync = ref.watch(infographicsProvider(partNumber));
    final isFreePart = partNumber == 1;

    // Returns true only once the API confirms the URL exists.
    // While loading: free parts show as available (tap triggers wait-and-open),
    // paid parts show as locked until confirmed.
    bool assetAvailable(bool Function(PartAssets) hasUrl) {
      return assetsAsync.whenOrNull(data: hasUrl) ?? isFreePart;
    }

    bool infographicAvailable() {
      return infographicsAsync.whenOrNull(data: (s) => s.hasAny) ?? isFreePart;
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // ── Hero header ──────────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 190,
            pinned: true,
            backgroundColor: AppColors.background,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
              onPressed: () => context.pop(),
            ),
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.pin,
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      eraColor.withValues(alpha: 0.18),
                      AppColors.background,
                    ],
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Era + part badge row
                    Row(
                      children: [
                        _Pill(
                          label: 'Part $partNumber',
                          color: eraColor,
                        ),
                        const SizedBox(width: 8),
                        _Pill(
                          label: _eraName(part.era),
                          color: eraColor,
                          faint: true,
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      part.title,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        height: 1.2,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      part.subtitle,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── Body ─────────────────────────────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Section label
                _SectionLabel(text: 'Study Materials', color: eraColor),
                const SizedBox(height: 12),

                // ── Video — full-width hero ──────────────────────────────
                _AssetHero(
                  icon: Icons.play_circle_fill_rounded,
                  iconColor: const Color(0xFF5A90B0),
                  title: 'Watch',
                  subtitle: 'Full video lecture',
                  description: 'Watch the complete lesson with visuals',
                  accentColor: const Color(0xFF5A90B0),
                  available: assetAvailable((a) => a.videoUrl != null),
                  onTap: () => _open(
                    context,
                    title: 'Watch — Part $partNumber',
                    child: VideoTab(partNumber: partNumber),
                  ),
                ),
                const SizedBox(height: 12),

                // ── Audio + Read — 2 col ─────────────────────────────────
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: _AssetCard(
                        icon: Icons.headphones_rounded,
                        iconColor: const Color(0xFF9A7AB8),
                        title: 'Listen',
                        subtitle: 'Audio lesson',
                        available: assetAvailable((a) => a.audioUrl != null),
                        onTap: () {
                          final assets = assetsAsync.valueOrNull;
                          if (assets?.audioUrl != null) {
                            _open(
                              context,
                              title: 'Listen — Part $partNumber',
                              child: AudioTab(audioUrl: assets!.audioUrl!, partTitle: part.title),
                            );
                          } else if (isFreePart) {
                            _openAssetWhenReady(
                              urlGetter: (a) => a.audioUrl,
                              title: 'Listen — Part $partNumber',
                              builder: (url) => AudioTab(audioUrl: url, partTitle: part.title),
                            );
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _AssetCard(
                        icon: Icons.menu_book_rounded,
                        iconColor: const Color(0xFF4AA87E),
                        title: 'Read',
                        subtitle: 'Study notes',
                        available: true,
                        onTap: () => _open(
                          context,
                          title: 'Read — Part $partNumber',
                          child: ReadTab(partNumber: partNumber),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // ── Slides + Infographics — 2 col ──────────────────────────
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: _AssetCard(
                        icon: Icons.view_carousel_rounded,
                        iconColor: const Color(0xFFD4A017),
                        title: 'Slides',
                        subtitle: 'Visual presentation',
                        available: true,
                        onTap: () => _open(
                          context,
                          title: 'Slides — Part $partNumber',
                          child: SlidesTab(partNumber: partNumber),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _AssetCard(
                        icon: Icons.auto_awesome_mosaic_outlined,
                        iconColor: const Color(0xFFB08040),
                        title: 'Infographics',
                        subtitle: 'Visual summary',
                        available: infographicAvailable(),
                        onTap: () => _open(
                          context,
                          title: 'Infographics — Part $partNumber',
                          child: InfographicsTab(partNumber: partNumber),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // ── Mindmap — full width ─────────────────────────────────
                _AssetCard(
                  icon: Icons.account_tree_rounded,
                  iconColor: const Color(0xFFC06060),
                  title: 'Mindmap',
                  subtitle: 'Visual overview of key concepts',
                  available: assetAvailable((a) => a.mindmapUrl != null),
                  onTap: () {
                    final assets = assetsAsync.valueOrNull;
                    if (assets?.mindmapUrl != null) {
                      _open(
                        context,
                        title: 'Mindmap — Part $partNumber',
                        child: MindmapTab(mindmapUrl: assets!.mindmapUrl!),
                      );
                    } else if (isFreePart) {
                      _openAssetWhenReady(
                        urlGetter: (a) => a.mindmapUrl,
                        title: 'Mindmap — Part $partNumber',
                        builder: (url) => MindmapTab(mindmapUrl: url),
                      );
                    }
                  },
                ),
                const SizedBox(height: 20),

                _SectionLabel(text: 'Practice & Review', color: eraColor),
                const SizedBox(height: 12),

                // ── Flashcards — full width ──────────────────────────────
                _AssetHero(
                  icon: Icons.style_rounded,
                  iconColor: const Color(0xFF6AAE50),
                  title: 'Flashcards',
                  subtitle: 'Spaced-repetition cards',
                  description: 'Review key facts with flip cards',
                  accentColor: const Color(0xFF6AAE50),
                  available: true,
                  onTap: () => _open(
                    context,
                    title: 'Flashcards — Part $partNumber',
                    child: FlashcardsTab(partNumber: partNumber),
                  ),
                ),
                const SizedBox(height: 12),

                // ── Quiz — full width ────────────────────────────────────
                _AssetHero(
                  icon: Icons.quiz_rounded,
                  iconColor: const Color(0xFFE8C040),
                  title: 'Quiz',
                  subtitle: 'Test your knowledge',
                  description: 'Multiple-choice questions with instant feedback',
                  accentColor: const Color(0xFFE8C040),
                  available: true,
                  onTap: () => _open(
                    context,
                    title: 'Quiz — Part $partNumber',
                    child: QuizTab(partNumber: partNumber),
                  ),
                ),

                // ── Continue CTA (Part 1 only, no access) ───────────────
                if (isFreePart && !hasAccess) ...[
                  const SizedBox(height: 28),
                  _ContinueCTA(isLoggedIn: authState.isLoggedIn),
                ],
              ]),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _PartNavBar(partNumber: partNumber, hasAccess: hasAccess),
    );
  }

  void _open(BuildContext context, {required String title, required Widget child}) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => _AssetViewerScreen(title: title, child: child),
      ),
    );
  }

  String _eraName(String era) {
    final found = ERAS.where((e) => e.id == era).toList();
    return found.isNotEmpty ? found.first.name : era;
  }
}

// ── Asset viewer screen ───────────────────────────────────────────────────────

class _AssetViewerScreen extends StatelessWidget {
  final String title;
  final Widget child;

  const _AssetViewerScreen({required this.title, required this.child});

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
        title: Text(title,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
        centerTitle: false,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.border),
        ),
      ),
      body: child,
    );
  }
}

// ── UI components ─────────────────────────────────────────────────────────────

class _Pill extends StatelessWidget {
  final String label;
  final Color color;
  final bool faint;

  const _Pill({required this.label, required this.color, this.faint = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: faint ? 0.08 : 0.14),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: faint ? 0.25 : 0.45)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: faint ? color.withValues(alpha: 0.75) : color,
          fontSize: 11,
          fontWeight: FontWeight.w500,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  final Color color;

  const _SectionLabel({required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 3,
          height: 14,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          text,
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 11,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.8,
          ),
        ),
      ],
    );
  }
}

/// Full-width hero card for primary assets (Video, Flashcards, Quiz).
class _AssetHero extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final String description;
  final Color accentColor;
  final bool available;
  final VoidCallback onTap;

  const _AssetHero({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.description,
    required this.accentColor,
    required this.available,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: available ? onTap : null,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        opacity: available ? 1.0 : 0.45,
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Stack(
            children: [
              // Accent glow
              Positioned(
                left: 0,
                top: 0,
                bottom: 0,
                child: Container(
                  width: 4,
                  decoration: BoxDecoration(
                    color: accentColor,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(16),
                      bottomLeft: Radius.circular(16),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 16, 16),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: iconColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: iconColor.withValues(alpha: 0.25)),
                      ),
                      child: Icon(icon, color: iconColor, size: 26),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            )),
                          const SizedBox(height: 2),
                          Text(subtitle,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            )),
                          const SizedBox(height: 4),
                          Text(description,
                            style: const TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 12,
                            )),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    available
                        ? Icon(Icons.chevron_right_rounded,
                            color: AppColors.textMuted, size: 22)
                        : const Icon(Icons.lock_outline_rounded,
                            color: AppColors.textMuted, size: 18),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Compact 2-col card for secondary assets (Audio, Read, Slides, Mindmap).
class _AssetCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final bool available;
  final VoidCallback onTap;

  const _AssetCard({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.available,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: available ? onTap : null,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        opacity: available ? 1.0 : 0.45,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: iconColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: iconColor.withValues(alpha: 0.2)),
                    ),
                    child: Icon(icon, color: iconColor, size: 20),
                  ),
                  available
                      ? Icon(Icons.chevron_right_rounded,
                          color: AppColors.textMuted, size: 18)
                      : const Icon(Icons.lock_outline_rounded,
                          color: AppColors.textMuted, size: 14),
                ],
              ),
              const SizedBox(height: 12),
              Text(title,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                )),
              const SizedBox(height: 2),
              Text(subtitle,
                style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 11,
                )),
              if (!available) ...[
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.textMuted.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text('Not available',
                    style: TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 10,
                    )),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ── Paywall ───────────────────────────────────────────────────────────────────

class _PaywallScreen extends StatelessWidget {
  final int partNumber;
  final Color eraColor;
  final String partTitle;

  const _PaywallScreen({
    required this.partNumber,
    required this.eraColor,
    required this.partTitle,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text('Part $partNumber'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.goldFaded,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(Icons.lock_outline, size: 40, color: AppColors.gold),
              ),
              const SizedBox(height: 24),
              Text(
                partTitle,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              const Text(
                'This part requires a full-access subscription.\nUnlock all 100 parts of the Seerah course.',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                  height: 1.6,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              Consumer(
                builder: (context, ref, _) {
                  final isLoggedIn = ref.watch(authProvider).isLoggedIn;
                  return SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => context.go(isLoggedIn ? '/pricing' : '/landing'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.gold,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'View Plans',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.pop(),
                child: const Text(
                  'Go Back',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Continue CTA (Part 1 → unlock) ───────────────────────────────────────────

class _ContinueCTA extends StatelessWidget {
  final bool isLoggedIn;
  const _ContinueCTA({required this.isLoggedIn});

  @override
  Widget build(BuildContext context) {
    final paywall = isLoggedIn ? '/pricing' : '/landing';
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.goldFaded,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.30)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Continue the full 100-part course',
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 17,
              fontWeight: FontWeight.w700,
              height: 1.25,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          const Text(
            'You started the path. Unlock the full course to continue learning the life of the Prophet PBUH step by step.',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
              height: 1.55,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: () => context.go(paywall),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.gold,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
            child: const Text(
              'Unlock full access',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Part navigation bar ───────────────────────────────────────────────────────

class _PartNavBar extends StatelessWidget {
  final int partNumber;
  final bool hasAccess;
  const _PartNavBar({required this.partNumber, required this.hasAccess});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(16, 10, 16, MediaQuery.of(context).padding.bottom + 10),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          if (partNumber > 1)
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => context.pushReplacement('/part/${partNumber - 1}'),
                icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 14),
                label: Text('Part ${partNumber - 1}'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.textSecondary,
                  side: const BorderSide(color: AppColors.border),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          if (partNumber > 1 && partNumber < 100) const SizedBox(width: 12),
          // On Part 1 with no access the in-page CTA card already has the
          // "Unlock full access" button — hide the nav bar duplicate.
          if (partNumber < 100 && !(partNumber == 1 && !hasAccess))
            Expanded(
              child: ElevatedButton(
                onPressed: () {
                  final nextPart = partNumber + 1;
                  // Locked content — route to paywall directly for clarity
                  if (!hasAccess && nextPart > 1) {
                    context.go('/landing');
                  } else {
                    context.pushReplacement('/part/$nextPart');
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: (!hasAccess && partNumber + 1 > 1)
                      ? AppColors.surface
                      : AppColors.gold,
                  foregroundColor: (!hasAccess && partNumber + 1 > 1)
                      ? AppColors.gold
                      : Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: (!hasAccess && partNumber + 1 > 1)
                        ? const BorderSide(color: AppColors.gold)
                        : BorderSide.none,
                  ),
                  elevation: 0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (!hasAccess && partNumber + 1 > 1) ...[
                      const Icon(Icons.lock_outline_rounded, size: 14),
                      const SizedBox(width: 6),
                      const Text('Unlock to continue',
                          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                    ] else ...[
                      Text('Part ${partNumber + 1}',
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: Colors.black)),
                      const SizedBox(width: 6),
                      const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.black),
                    ],
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
