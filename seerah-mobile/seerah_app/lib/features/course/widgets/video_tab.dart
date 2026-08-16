import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';

class VideoTab extends ConsumerWidget {
  final int partNumber;
  const VideoTab({super.key, required this.partNumber});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetsAsync = ref.watch(partAssetsProvider(partNumber));
    final lang = ref.watch(courseLangProvider);

    return assetsAsync.when(
      loading: () => const Center(
        child: CircularProgressIndicator.adaptive(
          valueColor: AlwaysStoppedAnimation(AppColors.gold),
        ),
      ),
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
        // Arabic masters are 5K H.264 L6 — many devices drop the in-file audio.
        // Play the matching MP3 in sync instead (skip Part 1 — re-encoded to 1440p).
        final companionAudio =
            lang == 'ar' && partNumber != 1 ? assets.audioUrl : null;
        return _VideoPlayer(
          url: url,
          companionAudioUrl: companionAudio,
          partNumber: partNumber,
        );
      },
    );
  }
}

// ── Stateful player — initialized once the URL is known ──────────────────────

class _VideoPlayer extends ConsumerStatefulWidget {
  final String url;
  final String? companionAudioUrl;
  final int partNumber;
  const _VideoPlayer({
    required this.url,
    required this.partNumber,
    this.companionAudioUrl,
  });

  @override
  ConsumerState<_VideoPlayer> createState() => _VideoPlayerState();
}

class _VideoPlayerState extends ConsumerState<_VideoPlayer> with WidgetsBindingObserver {
  VideoPlayerController? _vpCtrl;
  VideoPlayerController? _audioCtrl;
  ChewieController? _chewieCtrl;
  bool _initializing = true;
  String? _error;
  // Throttles trackVideoProgress POSTs to once per 5%-watched bucket instead
  // of on every player tick (which fires many times per second).
  int _lastTrackedPercentBucket = -1;
  // High-water mark of *played* position only — seeks/scrubs that jump ahead
  // more than [_kMaxPlayJumpMs] are ignored so scrubbing to 85% can't mark
  // the video complete (mirrors web maxWatchedMs clamp).
  int _maxCreditedMs = 0;
  int _lastTickMs = 0;
  static const _kMaxPlayJumpMs = 2500;
  // Bumped by _disposeControllers() and captured at the start of every
  // _init() call — lets a stale in-flight _init() (superseded by a rapid
  // double-tap on Retry, or a new URL via didUpdateWidget) recognize it's
  // been superseded and bail out instead of cross-wiring its listener onto
  // a different controller or resurrecting state after dispose. See _init().
  int _initGen = 0;
  // Signed asset URLs expire (short TTL) — mutable so a Retry after
  // expiry/failure can swap in a freshly-fetched one instead of being
  // permanently pinned to whatever URL this widget was first built with.
  // See _retryWithFreshUrl().
  late String _currentUrl = widget.url;
  late String? _currentAudioUrl = widget.companionAudioUrl;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _init();
  }

  // Unlike iOS (no UIBackgroundModes: audio entry — see Info.plist — so the
  // OS deactivates the AVAudioSession and suspends the process almost
  // immediately on backgrounding), a plain foreground Android Activity keeps
  // running, and ExoPlayer keeps decoding/rendering, for a materially longer
  // and OEM-variable window after the user backgrounds the app. Without this,
  // video (and its audio track) kept playing audibly from the pocket/home
  // screen with no lock-screen controls and no way to stop it short of Android
  // eventually reclaiming the process.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.inactive || state == AppLifecycleState.paused) {
      _vpCtrl?.pause();
      _audioCtrl?.pause();
    }
  }

  @override
  void didUpdateWidget(covariant _VideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    // No reachable UI path reuses this widget with a new URL today (every
    // "open a tab" action pushes a brand-new route/State), but guard against
    // it anyway so a future in-place "next part" affordance can't leave the
    // old ChewieController/VideoPlayerController running indefinitely.
    if (oldWidget.url != widget.url ||
        oldWidget.companionAudioUrl != widget.companionAudioUrl) {
      _currentUrl = widget.url;
      _currentAudioUrl = widget.companionAudioUrl;
      _disposeControllers();
      setState(() { _initializing = true; _error = null; });
      _init();
    }
  }

  void _disposeControllers() {
    _initGen++; // invalidate any _init() call still in flight
    _vpCtrl?.removeListener(_onTick);
    _chewieCtrl?.dispose();
    _vpCtrl?.dispose();
    _audioCtrl?.dispose();
    _chewieCtrl = null;
    _vpCtrl = null;
    _audioCtrl = null;
    _lastTrackedPercentBucket = -1;
    _maxCreditedMs = 0;
    _lastTickMs = 0;
  }

  void _syncCompanionAudio() {
    final video = _vpCtrl;
    final audio = _audioCtrl;
    if (video == null || audio == null) return;
    if (!video.value.isInitialized || !audio.value.isInitialized) return;

    // Picture stays silent; companion MP3 carries the soundtrack.
    if (video.value.volume != 0) {
      video.setVolume(0);
    }

    final driftMs = (audio.value.position - video.value.position).inMilliseconds.abs();
    if (driftMs > 350) {
      audio.seekTo(video.value.position);
    }

    if (video.value.isPlaying && !audio.value.isPlaying) {
      audio.play();
    } else if (!video.value.isPlaying && audio.value.isPlaying) {
      audio.pause();
    }

    if (audio.value.playbackSpeed != video.value.playbackSpeed) {
      audio.setPlaybackSpeed(video.value.playbackSpeed);
    }
  }

  void _onTick() {
    // Mirrors audio_tab.dart's _onControllerTick guard — _disposeControllers()
    // already removes this listener before disposing _vpCtrl, so this should
    // be unreachable post-dispose in practice, but ref.read() below throws if
    // the State is actually disposed, so the guard is cheap insurance against
    // any platform-specific listener-notification-ordering edge case.
    if (!mounted) return;
    final value = _vpCtrl?.value;
    if (value == null) return;
    _syncCompanionAudio();
    // Chewie's own errorBuilder (wired below) surfaces value.errorDescription
    // verbatim once hasError flips true — on Android that's ExoPlayer's raw
    // PlaybackException.toString() (e.g. "Video player had error
    // androidx.media3.exoplayer.ExoPlaybackException: Source error{...} caused
    // by: ...HttpDataSource$InvalidResponseCodeException: Response code:
    // 403"), a materially worse/more technical string than AVFoundation's
    // iOS error text. Intercepting it here and routing into the same
    // friendly _error/Retry-button state used for init failures gives every
    // post-init playback error (dropped connection, CDN blip, expired signed
    // URL) a consistent, actionable UI instead of a dead end with raw
    // stack-trace-like text and no way to recover short of leaving the tab.
    if (value.hasError) {
      // Deferred to a microtask: disposing _vpCtrl synchronously from inside
      // its own change-notification listener (this callback) is unnecessary
      // re-entrancy risk — letting the current notifyListeners() pass finish
      // first is the safer, still-immediate way to tear it down.
      Future.microtask(() {
        if (!mounted) return;
        _disposeControllers();
        setState(() {
          _initializing = false;
          _error = 'Video playback error. Please check your connection and try again.';
        });
      });
      return;
    }
    if (!value.isInitialized || value.duration.inMilliseconds <= 0) return;
    final posMs = value.position.inMilliseconds;
    final durMs = value.duration.inMilliseconds;
    // Only credit forward play within a small jump — large leaps are seeks.
    if (value.isPlaying) {
      if (posMs >= _lastTickMs && posMs - _lastTickMs <= _kMaxPlayJumpMs) {
        if (posMs > _maxCreditedMs) _maxCreditedMs = posMs;
      } else if (posMs < _lastTickMs) {
        // Rewound — keep high-water; resume crediting from here next tick.
      }
      // else: scrubbed forward past the jump threshold — do not credit.
    }
    _lastTickMs = posMs;
    final percent = ((_maxCreditedMs / durMs) * 100).clamp(0, 100).round();
    final bucket = percent ~/ 5;
    if (bucket != _lastTrackedPercentBucket) {
      _lastTrackedPercentBucket = bucket;
      ref.read(progressProvider.notifier).trackVideoProgress(widget.partNumber, percent);
    }
  }

  Future<void> _init() async {
    final gen = ++_initGen;
    // Built up locally and only ever assigned to the shared _vpCtrl field
    // once we know this call is still current (see the gen check below) —
    // this is what stops a rapid double-tap on Retry from cross-wiring one
    // attempt's listener/ChewieController onto a completely different
    // attempt's controller instance.
    VideoPlayerController? vpCtrl;
    VideoPlayerController? audioCtrl;
    try {
      vpCtrl = VideoPlayerController.networkUrl(Uri.parse(_currentUrl));
      await vpCtrl.initialize();
      if (!mounted || gen != _initGen) {
        // Superseded by a newer _init() (Retry double-tap / new URL) or the
        // widget was disposed while we were awaiting — discard our own
        // work without touching any shared field.
        await vpCtrl.dispose();
        return;
      }

      final audioUrl = _currentAudioUrl;
      if (audioUrl != null && audioUrl.isNotEmpty) {
        try {
          audioCtrl = VideoPlayerController.networkUrl(Uri.parse(audioUrl));
          await audioCtrl.initialize();
          if (!mounted || gen != _initGen) {
            await vpCtrl.dispose();
            await audioCtrl.dispose();
            return;
          }
          await vpCtrl.setVolume(0);
          await audioCtrl.setVolume(1);
        } catch (_) {
          // Companion audio is best-effort — fall back to in-file soundtrack.
          try { await audioCtrl?.dispose(); } catch (_) {}
          audioCtrl = null;
        }
      }

      _vpCtrl = vpCtrl;
      _audioCtrl = audioCtrl;
      _vpCtrl!.addListener(_onTick);
      ref.read(progressProvider.notifier).trackAssetOpened(widget.partNumber, 'video');
      _chewieCtrl = ChewieController(
        videoPlayerController: _vpCtrl!,
        autoPlay: false,
        looping: false,
        aspectRatio: 16 / 9,
        allowFullScreen: true,
        showOptions: true,
        playbackSpeeds: const [0.75, 1.0, 1.25, 1.5, 2.0],
        placeholder: Container(color: Colors.black),
        // Defaults to true (screen sleep allowed) — chewie only calls
        // WakelockPlus.enable() when this is false. Without it, a user
        // passively watching (no touch input) hits their device's normal
        // idle-screen timeout mid-lecture, on both inline and fullscreen
        // playback — this affects iOS too, but Android's much wider spread
        // of default screen-timeout values across budget/OEM-customized
        // devices makes it a materially more common interruption there.
        allowedScreenSleep: false,
        // The rest of the app is portrait-only; only full-screen video should
        // ever rotate to landscape, and it must always restore portrait when
        // the user exits full screen (back button or system back gesture).
        deviceOrientationsOnEnterFullScreen: const [
          DeviceOrientation.landscapeLeft,
          DeviceOrientation.landscapeRight,
        ],
        // Match the orientation set locked at app startup (main.dart) —
        // restoring only portraitUp would silently drop portraitDown
        // support for the rest of the session after the first video.
        deviceOrientationsAfterFullScreen: const [
          DeviceOrientation.portraitUp,
        ],
        // Rarely reached in practice — _onTick above already intercepts
        // value.hasError and swaps the whole widget out to the friendly
        // _ErrorState/Retry UI before chewie's own controls would render
        // this. Kept as a defensive fallback with non-technical copy instead
        // of chewie's default (which surfaces value.errorDescription
        // verbatim — on Android that's ExoPlayer's raw PlaybackException
        // text, e.g. "...HttpDataSource$InvalidResponseCodeException:
        // Response code: 403").
        errorBuilder: (ctx, msg) => const Center(
          child: Text(
            'Video playback error. Please check your connection and try again.',
            style: TextStyle(color: Colors.white),
            textAlign: TextAlign.center,
          ),
        ),
      );
      setState(() => _initializing = false);
    } catch (e) {
      if (!mounted || gen != _initGen) {
        // Stale attempt failed after being superseded — clean up only what
        // WE created locally; the shared fields belong to a newer call now.
        try { await vpCtrl?.dispose(); } catch (_) {}
        try { await audioCtrl?.dispose(); } catch (_) {}
        return;
      }
      // initialize() can throw after partially constructing the platform
      // player (e.g. a bad URL resolves DNS then fails mid-buffer) — if we
      // don't dispose here, that controller is orphaned since nothing else
      // holds a reference to it once this function returns.
      _disposeControllers();
      setState(() {
        _initializing = false;
        _error = 'Could not initialize video player.';
      });
    }
  }

  // Audit H7 fix: the old Retry handler just re-ran _init() against the
  // exact same (possibly-expired) signed URL this widget was built with —
  // guaranteed to fail identically every time if the URL itself was the
  // problem (a 403 on a signed R2 URL past its short TTL, e.g. after the
  // app sat backgrounded/paused for a while). Re-fetch partAssetsProvider
  // first so Retry actually has a chance of succeeding.
  Future<void> _retryWithFreshUrl() async {
    _disposeControllers();
    setState(() { _initializing = true; _error = null; });
    try {
      ref.invalidate(partAssetsProvider(widget.partNumber));
      final assets = await ref.read(partAssetsProvider(widget.partNumber).future);
      final freshUrl = assets.videoUrl;
      if (!mounted) return;
      if (freshUrl == null || freshUrl.isEmpty) {
        setState(() {
          _initializing = false;
          _error = 'Video not available for this part yet.';
        });
        return;
      }
      _currentUrl = freshUrl;
      final lang = ref.read(courseLangProvider);
      _currentAudioUrl = lang == 'ar' ? assets.audioUrl : null;
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
    _disposeControllers();
    // Chewie only restores portrait orientation AND the hidden status/nav
    // bars when its fullscreen route is popped through its own normal exit
    // path. If this whole widget (and the route it lives on) gets torn down
    // some other way while fullscreen is active — e.g. an auth-driven
    // go_router redirect replacing the page stack mid-video — that restore
    // never runs. Orientation was already re-asserted here; the system UI
    // mode was not, which is the more visible failure on Android: a hidden
    // status bar + hidden 3-button/gesture nav bar would persist across the
    // ENTIRE REST OF THE APP (not just this screen) until force-quit, since
    // Android's persistent system nav bar has no iOS equivalent for this
    // "stuck hidden" mode to affect as broadly. Both calls are harmless
    // no-ops in the normal case (chewie already did them) and a safety net
    // in the abnormal one.
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: SystemUiOverlay.values);
    SystemChrome.setPreferredOrientations(const [
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_initializing) {
      return const Center(
        child: CircularProgressIndicator.adaptive(
          valueColor: AlwaysStoppedAnimation(AppColors.gold),
        ),
      );
    }
    if (_error != null || _chewieCtrl == null) {
      return _ErrorState(message: _error ?? 'Video unavailable', onRetry: _retryWithFreshUrl);
    }

    return Directionality(
      textDirection: TextDirection.ltr,
      child: Container(
        color: Colors.black,
        child: Center(
          child: AspectRatio(
            aspectRatio: 16 / 9,
            child: Chewie(controller: _chewieCtrl!),
          ),
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
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
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
