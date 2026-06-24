import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../../../core/theme/app_colors.dart';

/// Full audio player for a part — uses VideoPlayerController in audio mode.
class AudioTab extends StatefulWidget {
  final String audioUrl;
  final String? partTitle;
  const AudioTab({super.key, required this.audioUrl, this.partTitle});

  @override
  State<AudioTab> createState() => _AudioTabState();
}

const _kSpeeds = [0.75, 1.0, 1.25, 1.5, 2.0];

class _AudioTabState extends State<AudioTab> {
  VideoPlayerController? _ctrl;
  bool _loading = true;
  String? _error;
  double _speed = 1.0;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      _ctrl = VideoPlayerController.networkUrl(Uri.parse(widget.audioUrl));
      await _ctrl!.initialize();
      _ctrl!.addListener(() { if (mounted) setState(() {}); });
      if (mounted) setState(() => _loading = false);
    } catch (_) {
      if (mounted) setState(() { _loading = false; _error = 'Could not load audio.'; });
    }
  }

  @override
  void dispose() {
    _ctrl?.dispose();
    super.dispose();
  }

  String _fmt(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  void _setSpeed(double speed) {
    _ctrl?.setPlaybackSpeed(speed);
    setState(() => _speed = speed);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.gold));
    }
    if (_error != null || _ctrl == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.headphones, size: 64, color: AppColors.textMuted),
              const SizedBox(height: 16),
              Text(_error ?? 'Audio unavailable',
                style: const TextStyle(color: AppColors.textSecondary),
                textAlign: TextAlign.center),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () { setState(() { _loading = true; _error = null; }); _init(); },
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final ctrl = _ctrl!;
    final pos = ctrl.value.position;
    final dur = ctrl.value.duration;
    final isPlaying = ctrl.value.isPlaying;
    final progress = dur.inMilliseconds > 0 ? pos.inMilliseconds / dur.inMilliseconds : 0.0;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Album art placeholder
            Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppColors.gold.withValues(alpha: 0.25),
                    AppColors.gold.withValues(alpha: 0.06),
                  ],
                ),
                border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
              ),
              child: const Icon(Icons.headphones_rounded, color: AppColors.gold, size: 72),
            ),

            const SizedBox(height: 32),

            // Title
            Text(
              widget.partTitle ?? 'Audio Lesson',
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 20, fontWeight: FontWeight.w700),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            const Text('Audio Lesson  •  Listen on the go',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),

            const SizedBox(height: 32),

            // Progress bar
            Column(
              children: [
                SliderTheme(
                  data: SliderThemeData(
                    trackHeight: 4,
                    activeTrackColor: AppColors.gold,
                    inactiveTrackColor: AppColors.border,
                    thumbColor: AppColors.gold,
                    overlayColor: AppColors.gold.withValues(alpha: 0.12),
                  ),
                  child: Slider(
                    value: progress.clamp(0.0, 1.0),
                    onChanged: (v) {
                      final seek = Duration(milliseconds: (v * dur.inMilliseconds).round());
                      ctrl.seekTo(seek);
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(_fmt(pos), style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                      Text(_fmt(dur), style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Controls
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Rewind 15s
                IconButton(
                  onPressed: () => ctrl.seekTo(pos - const Duration(seconds: 15)),
                  icon: const Icon(Icons.replay_rounded, size: 32, color: AppColors.textSecondary),
                ),
                const SizedBox(width: 16),
                // Play/Pause
                GestureDetector(
                  onTap: () => isPlaying ? ctrl.pause() : ctrl.play(),
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: AppColors.gold,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.gold.withValues(alpha: 0.35),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Icon(
                      isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                      color: Colors.black,
                      size: 36,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                // Forward 15s
                IconButton(
                  onPressed: () => ctrl.seekTo(pos + const Duration(seconds: 15)),
                  icon: const Icon(Icons.fast_forward_rounded, size: 32, color: AppColors.textSecondary),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Speed chips
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: _kSpeeds.map((speed) {
                final selected = _speed == speed;
                return GestureDetector(
                  onTap: () => _setSpeed(speed),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                    decoration: BoxDecoration(
                      color: selected ? AppColors.gold : AppColors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: selected ? AppColors.gold : AppColors.border,
                      ),
                    ),
                    child: Text(
                      '${speed == speed.truncateToDouble() ? speed.toInt() : speed}×',
                      style: TextStyle(
                        color: selected ? Colors.black : AppColors.textSecondary,
                        fontSize: 13,
                        fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}
