import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

/// Full-screen pinch-to-zoom mindmap viewer.
class MindmapTab extends StatelessWidget {
  final String mindmapUrl;
  const MindmapTab({super.key, required this.mindmapUrl});

  @override
  Widget build(BuildContext context) {
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
                  imageUrl: mindmapUrl,
                  fit: BoxFit.contain,
                  // 2x screen width leaves headroom for pinch-zoom while
                  // avoiding a full-resolution decode.
                  memCacheWidth: (MediaQuery.sizeOf(context).width *
                          MediaQuery.devicePixelRatioOf(context) *
                          2)
                      .round(),
                  placeholder: (ctx, url) => const Center(
                    child: CircularProgressIndicator.adaptive(
                      valueColor: AlwaysStoppedAnimation(AppColors.gold),
                    ),
                  ),
                  errorWidget: (ctx, url, err) => const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.image_not_supported_outlined, size: 48, color: AppColors.textMuted),
                        SizedBox(height: 12),
                        Text('Mindmap unavailable',
                          style: TextStyle(color: AppColors.textSecondary)),
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
