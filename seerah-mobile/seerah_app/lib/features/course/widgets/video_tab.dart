import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/theme/app_colors.dart';

class VideoTab extends ConsumerWidget {
  final int partNumber;
  const VideoTab({super.key, required this.partNumber});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetsAsync = ref.watch(partAssetsProvider(partNumber));

    return assetsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.gold)),
      error: (e, _) => _ErrorState(
        message: partNumber == 1
            ? 'Unable to load video.\nPlease check your connection and try again.'
            : 'Unable to load video.\nMake sure you\'re signed in with an active subscription.',
        onRetry: () => ref.invalidate(partAssetsProvider(partNumber)),
      ),
      data: (assets) {
        final url = assets.videoUrl;
        if (url == null || url.isEmpty) {
          return _ErrorState(
            message: 'Video not available for this part yet.',
            onRetry: () => ref.invalidate(partAssetsProvider(partNumber)),
          );
        }
        return _VideoPlayer(url: url, partNumber: partNumber);
      },
    );
  }
}

// ── Stateful player — initialized once the URL is known ──────────────────────

class _VideoPlayer extends StatefulWidget {
  final String url;
  final int partNumber;
  const _VideoPlayer({required this.url, required this.partNumber});

  @override
  State<_VideoPlayer> createState() => _VideoPlayerState();
}

class _VideoPlayerState extends State<_VideoPlayer> {
  VideoPlayerController? _vpCtrl;
  ChewieController? _chewieCtrl;
  bool _initializing = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      _vpCtrl = VideoPlayerController.networkUrl(Uri.parse(widget.url));
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
      if (mounted) setState(() => _initializing = false);
    } catch (e) {
      if (mounted) {
        setState(() {
          _initializing = false;
          _error = 'Could not initialize video player.';
        });
      }
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
    if (_initializing) {
      return const Center(child: CircularProgressIndicator(color: AppColors.gold));
    }
    if (_error != null || _chewieCtrl == null) {
      return _ErrorState(message: _error ?? 'Video unavailable', onRetry: () {
        setState(() { _initializing = true; _error = null; });
        _init();
      });
    }

    return Container(
      color: Colors.black,
      child: Center(
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: Chewie(controller: _chewieCtrl!),
        ),
      ),
    );
  }
}

// ── Error state ───────────────────────────────────────────────────────────────

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
