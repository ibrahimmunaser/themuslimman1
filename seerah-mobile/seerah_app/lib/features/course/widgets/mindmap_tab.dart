import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';

/// Full-screen pinch-to-zoom mindmap viewer.
class MindmapTab extends ConsumerStatefulWidget {
  final int partNumber;
  final String mindmapUrl;
  const MindmapTab({
    super.key,
    required this.partNumber,
    required this.mindmapUrl,
  });

  @override
  ConsumerState<MindmapTab> createState() => _MindmapTabState();
}

class _MindmapTabState extends ConsumerState<MindmapTab> {
  int _imageKey = 0;
  bool _tracked = false;

  void _trackOnce() {
    if (_tracked) return;
    _tracked = true;
    ref.read(progressProvider.notifier).trackAssetOpened(widget.partNumber, 'mindmap');
  }

  Future<void> _retry() async {
    ref.invalidate(partAssetsProvider(widget.partNumber));
    await ref.read(partAssetsProvider(widget.partNumber).future);
    if (mounted) setState(() => _imageKey++);
  }

  @override
  Widget build(BuildContext context) {
    final assetsAsync = ref.watch(partAssetsProvider(widget.partNumber));
    final url = assetsAsync.valueOrNull?.mindmapUrl ?? widget.mindmapUrl;

    return Container(
      color: AppColors.background,
      child: Column(
        children: [
          // Hint
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.border)),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.pinch_rounded, color: AppColors.textMuted, size: 16),
                SizedBox(width: 6),
                Text('Pinch to zoom',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
              ],
            ),
          ),
          Expanded(
            child: InteractiveViewer(
              minScale: 0.5,
              maxScale: 4.0,
              child: Center(
                child: CachedNetworkImage(
                  key: ValueKey('mindmap-$_imageKey-$url'),
                  imageUrl: url,
                  fit: BoxFit.contain,
                  // 2x screen width leaves headroom for pinch-zoom while
                  // avoiding a full-resolution decode.
                  memCacheWidth: (MediaQuery.sizeOf(context).width *
                          MediaQuery.devicePixelRatioOf(context) *
                          2)
                      .round(),
                  // Track only after the image actually loads (not on tab open
                  // with a placeholder) — matches engagement intent of web
                  // infographic dwell / briefing scroll gates.
                  imageBuilder: (ctx, provider) {
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      if (mounted) _trackOnce();
                    });
                    return Image(image: provider, fit: BoxFit.contain);
                  },
                  placeholder: (ctx, url) => const Center(
                    child: CircularProgressIndicator.adaptive(
                      valueColor: AlwaysStoppedAnimation(AppColors.gold),
                    ),
                  ),
                  errorWidget: (ctx, url, err) => Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.image_not_supported_outlined,
                            size: 48, color: AppColors.textMuted),
                        const SizedBox(height: 12),
                        const Text('Mindmap unavailable',
                          style: TextStyle(color: AppColors.textSecondary)),
                        const SizedBox(height: 16),
                        OutlinedButton.icon(
                          onPressed: _retry,
                          icon: const Icon(Icons.refresh, size: 18),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
