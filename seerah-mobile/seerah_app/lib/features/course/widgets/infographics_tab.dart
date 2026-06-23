import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/theme/app_colors.dart';

/// Infographic viewer — concise, standard, and bento grid styles per part.
class InfographicsTab extends ConsumerStatefulWidget {
  final int partNumber;
  const InfographicsTab({super.key, required this.partNumber});

  @override
  ConsumerState<InfographicsTab> createState() => _InfographicsTabState();
}

class _InfographicsTabState extends ConsumerState<InfographicsTab> {
  String _style = 'standard';

  @override
  Widget build(BuildContext context) {
    final infographicsAsync = ref.watch(infographicsProvider(widget.partNumber));

    return infographicsAsync.when(
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppColors.gold),
      ),
      error: (_, __) => _Unavailable(
        onRetry: () => ref.invalidate(infographicsProvider(widget.partNumber)),
      ),
      data: (set) {
        if (!set.hasAny) {
          return const _Unavailable();
        }

        final styles = <({String id, String label, String? url})>[
          if (set.standard?.isNotEmpty == true) (id: 'standard', label: 'Standard', url: set.standard),
          if (set.concise?.isNotEmpty == true) (id: 'concise', label: 'Concise', url: set.concise),
          if (set.bentoGrid?.isNotEmpty == true) (id: 'bentoGrid', label: 'Bento Grid', url: set.bentoGrid),
        ];

        // Default to first available style if current selection is missing.
        final active = styles.firstWhere(
          (s) => s.id == _style,
          orElse: () => styles.first,
        );
        if (active.id != _style) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) setState(() => _style = active.id);
          });
        }

        final imageUrl = active.url;
        if (imageUrl == null || imageUrl.isEmpty) {
          return const _Unavailable();
        }

        return Column(
          children: [
            if (styles.length > 1)
              Container(
                margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: styles.map((s) {
                    final selected = s.id == _style;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _style = s.id),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: selected ? AppColors.gold : Colors.transparent,
                            borderRadius: BorderRadius.circular(9),
                          ),
                          child: Text(
                            s.label,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: selected ? Colors.black : AppColors.textSecondary,
                              fontSize: 12,
                              fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
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
                    imageUrl: imageUrl,
                    fit: BoxFit.contain,
                    placeholder: (_, __) => const Center(
                      child: CircularProgressIndicator(color: AppColors.gold),
                    ),
                    errorWidget: (_, __, ___) => const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.image_not_supported_outlined,
                              size: 48, color: AppColors.textMuted),
                          SizedBox(height: 12),
                          Text('Infographic unavailable',
                              style: TextStyle(color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _Unavailable extends StatelessWidget {
  final VoidCallback? onRetry;
  const _Unavailable({this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.auto_awesome_mosaic_outlined,
              size: 48, color: AppColors.textMuted),
          const SizedBox(height: 12),
          const Text('Infographics unavailable',
              style: TextStyle(color: AppColors.textSecondary)),
          if (onRetry != null) ...[
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Retry'),
            ),
          ],
        ],
      ),
    );
  }
}
