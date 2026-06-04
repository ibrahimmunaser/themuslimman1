import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';

class VideoTab extends ConsumerStatefulWidget {
  final int partNumber;
  const VideoTab({super.key, required this.partNumber});

  @override
  ConsumerState<VideoTab> createState() => _VideoTabState();
}

class _VideoTabState extends ConsumerState<VideoTab> {
  VideoPlayerController? _vpCtrl;
  ChewieController? _chewieCtrl;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadVideo();
  }

  Future<void> _loadVideo() async {
    try {
      // Get signed video URL from the API
      final response = await ApiClient.instance.dio.get(
        '/api/media/video/${widget.partNumber}',
      );

      String? url;
      final data = response.data;
      if (data is Map) {
        url = data['url'] as String? ?? data['videoUrl'] as String?;
      } else if (data is String && data.startsWith('http')) {
        url = data;
      }
      // Fallback: check response real URI (after redirect)
      url ??= response.realUri.toString();

      if (url.isEmpty || url.contains('themuslimman.com/api')) {
        setState(() { _loading = false; _error = 'Video not available'; });
        return;
      }

      _vpCtrl = VideoPlayerController.networkUrl(Uri.parse(url));
      await _vpCtrl!.initialize();

      _chewieCtrl = ChewieController(
        videoPlayerController: _vpCtrl!,
        autoPlay: false,
        looping: false,
        aspectRatio: 16 / 9,
        allowFullScreen: true,
        placeholder: Container(color: Colors.black),
        errorBuilder: (ctx, msg) => Center(
          child: Text(msg, style: const TextStyle(color: Colors.white)),
        ),
      );

      setState(() => _loading = false);
    } catch (e) {
      setState(() {
        _loading = false;
        _error = 'Unable to load video. Make sure you\'re logged in with an active subscription.';
      });
    }
  }

  @override
  void dispose() {
    _chewieCtrl?.dispose();
    _vpCtrl?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.gold));
    }

    if (_error != null || _chewieCtrl == null) {
      return _ErrorState(
        message: _error ?? 'Video unavailable',
        onRetry: () {
          setState(() { _loading = true; _error = null; });
          _loadVideo();
        },
      );
    }

    return ListView(
      children: [
        // Video player
        Container(
          color: Colors.black,
          child: AspectRatio(
            aspectRatio: 16 / 9,
            child: Chewie(controller: _chewieCtrl!),
          ),
        ),
        // Audio fallback
        Padding(
          padding: const EdgeInsets.all(16),
          child: _AudioSection(partNumber: widget.partNumber),
        ),
      ],
    );
  }
}

class _AudioSection extends StatelessWidget {
  final int partNumber;
  const _AudioSection({required this.partNumber});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: AppColors.goldFaded,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.headphones, color: AppColors.gold, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Listen on the Go', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 2),
                const Text('Audio version available for offline listening',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.goldFaded,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.gold.withOpacity(0.4)),
            ),
            child: const Text('Soon', style: TextStyle(color: AppColors.gold, fontSize: 12)),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.play_circle_outline, size: 64, color: AppColors.textMuted),
            const SizedBox(height: 16),
            Text(message,
              style: const TextStyle(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
