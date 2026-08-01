import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';

/// Full audio player for a part — uses VideoPlayerController in audio mode.
class AudioTab extends ConsumerStatefulWidget {
  final String audioUrl;
  final int partNumber;
  final String? partTitle;
  const AudioTab({super.key, required this.audioUrl, required this.partNumber, this.partTitle});

  @override
  ConsumerState<AudioTab> createState() => _AudioTabState();
}

const _kSpeeds = [0.75, 1.0, 1.25, 1.5, 2.0];

class _AudioTabState extends ConsumerState<AudioTab> with WidgetsBindingObserver {
  VideoPlayerController? _ctrl;
  bool _loading = true;
  String? _error;
  double _speed = 1.0;
  // Throttle rebuilds: only setState when the displayed second or play state changes.
  int _lastPosSec = -1;
  bool _lastPlaying = false;
  // Bumped by _disposeController() and captured at the start of every
  // _init() call — lets a stale in-flight _init() (superseded by a rapid
  // double-tap on Retry, or a new URL via didUpdateWidget) recognize it's
  // been superseded and bail out instead of cross-wiring its listener onto
  // a different controller or resurrecting state after dispose. See _init().
  int _initGen = 0;
  // Signed asset URLs expire (short TTL) — mutable so a Retry after
  // expiry/failure can swap in a freshly-fetched one instead of being
  // permanently pinned to whatever URL this widget was first built with.
  // See _retryWithFreshUrl().
  late String _currentUrl = widget.audioUrl;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _init();
  }

  // Neither platform gives this player a MediaSession/lock-screen "Now
  // Playing" surface or a foreground-service notification, so there is no
  // user-facing way to control or even know audio is still running once the
  // app is backgrounded — pausing here keeps behavior predictable instead of
  // silently draining battery/data with no controls, matching video_tab.dart.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.inactive || state == AppLifecycleState.paused) {
      _ctrl?.pause();
    }
  }

  @override
  void didUpdateWidget(covariant AudioTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    // No reachable UI path reuses this widget with a new URL today (every
    // "open a tab" action pushes a brand-new route/State), but guard against
    // it anyway so a future in-place "next part" affordance can't leave two
    // audio controllers playing on top of each other.
    if (oldWidget.audioUrl != widget.audioUrl) {
      _currentUrl = widget.audioUrl;
      _disposeController();
      setState(() { _loading = true; _error = null; });
      _init();
    }
  }

  void _disposeController() {
    _initGen++; // invalidate any _init() call still in flight
    _ctrl?.removeListener(_onControllerTick);
    _ctrl?.dispose();
    _ctrl = null;
    _lastPosSec = -1;
    _lastPlaying = false;
  }

  Future<void> _init() async {
    final gen = ++_initGen;
    // Built up locally and only ever assigned to the shared _ctrl field once
    // we know this call is still current (see the gen check below) — this
    // is what stops a rapid double-tap on Retry from cross-wiring one
    // attempt's listener onto a completely different attempt's controller.
    VideoPlayerController? ctrl;
    try {
      ctrl = VideoPlayerController.networkUrl(Uri.parse(_currentUrl));
      await ctrl.initialize();
      if (!mounted || gen != _initGen) {
        // Superseded by a newer _init() (Retry double-tap / new URL) or the
        // widget was disposed while we were awaiting — discard our own
        // work without touching any shared field.
        await ctrl.dispose();
        return;
      }
      _ctrl = ctrl;
      _ctrl!.addListener(_onControllerTick);
      ref.read(progressProvider.notifier).trackAssetOpened(widget.partNumber, 'audio');
      setState(() => _loading = false);
    } catch (_) {
      if (!mounted || gen != _initGen) {
        // Stale attempt failed after being superseded — clean up only what
        // WE created locally; the shared fields belong to a newer call now.
        try { await ctrl?.dispose(); } catch (_) {}
        return;
      }
      // initialize() can throw after partially constructing the platform
      // player — without disposing here, that controller is orphaned since
      // nothing else references it once this function returns.
      _disposeController();
      setState(() { _loading = false; _error = 'Could not load audio.'; });
    }
  }

  void _onControllerTick() {
    if (!mounted) return;
    final value = _ctrl?.value;
    if (value == null) return;
    // Previously nothing checked value.hasError after the initial
    // initialize() succeeded — a post-init failure (dropped connection, CDN
    // blip, expired signed URL) left the player frozen with stale
    // position/duration and fully unresponsive play/pause/seek controls,
    // with zero feedback to the user. Route into the same _error/Retry UI
    // used for init failures, mirroring the fix applied to video_tab.dart.
    if (value.hasError) {
      Future.microtask(() {
        if (!mounted) return;
        _disposeController();
        setState(() {
          _loading = false;
          _error = 'Audio playback error. Please check your connection and try again.';
        });
      });
      return;
    }
    final posSec = value.position.inSeconds;
    if (posSec != _lastPosSec || value.isPlaying != _lastPlaying) {
      _lastPosSec = posSec;
      _lastPlaying = value.isPlaying;
      setState(() {});
    }
    // Do NOT write videoWatchPercent from audio — web's AudioPlayer only
    // tracks asset_opened("audio"). Listening must not mark video complete.
  }

  // Audit H7 fix: mirrors video_tab.dart's _retryWithFreshUrl — the old
  // Retry handler re-ran _init() against the exact same (possibly-expired)
  // signed URL, guaranteed to fail identically if the URL itself was the
  // problem (a 403 on a signed R2 URL past its short TTL).
  Future<void> _retryWithFreshUrl() async {
    _disposeController();
    setState(() { _loading = true; _error = null; });
    try {
      ref.invalidate(partAssetsProvider(widget.partNumber));
      final assets = await ref.read(partAssetsProvider(widget.partNumber).future);
      final freshUrl = assets.audioUrl;
      if (!mounted) return;
      if (freshUrl == null || freshUrl.isEmpty) {
        setState(() {
          _loading = false;
          _error = 'Audio not available for this part yet.';
        });
        return;
      }
      _currentUrl = freshUrl;
    } catch (_) {
      // Couldn't refresh (offline/API error) — fall back to retrying the
      // URL we already have rather than leaving Retry with nothing to do.
    }
    if (!mounted) return;
    _init();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _disposeController();
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
      return const Center(
        child: CircularProgressIndicator.adaptive(
          valueColor: AlwaysStoppedAnimation(AppColors.gold),
        ),
      );
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
                onPressed: _retryWithFreshUrl,
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
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
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
                  tooltip: 'Rewind 15 seconds',
                ),
                const SizedBox(width: 16),
                // Play/Pause
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.gold.withValues(alpha: 0.35),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Material(
                    color: AppColors.gold,
                    shape: const CircleBorder(),
                    child: InkWell(
                      onTap: () => isPlaying ? ctrl.pause() : ctrl.play(),
                      customBorder: const CircleBorder(),
                      child: Semantics(
                        button: true,
                        label: isPlaying ? 'Pause' : 'Play',
                        child: SizedBox(
                          width: 64,
                          height: 64,
                          child: Icon(
                            isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                            color: Colors.black,
                            size: 36,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                // Forward 15s
                IconButton(
                  onPressed: () => ctrl.seekTo(pos + const Duration(seconds: 15)),
                  icon: const Icon(Icons.fast_forward_rounded, size: 32, color: AppColors.textSecondary),
                  tooltip: 'Forward 15 seconds',
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Speed chips
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: _kSpeeds.map((speed) {
                final selected = _speed == speed;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.gold : AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: selected ? AppColors.gold : AppColors.border,
                    ),
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => _setSpeed(speed),
                      borderRadius: BorderRadius.circular(20),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        child: Text(
                          '${speed == speed.truncateToDouble() ? speed.toInt() : speed}×',
                          style: TextStyle(
                            color: selected ? Colors.black : AppColors.textSecondary,
                            fontSize: 13,
                            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                          ),
                        ),
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
