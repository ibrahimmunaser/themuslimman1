import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';

/// Plays the bundled Athan (call to prayer) recording over the full-screen
/// "incoming call" presentation — [IncomingSalahScreen] and the Android App
/// Guard block screen ([GuardShieldScreen] in `guard_main.dart`).
///
/// Deliberately in-app playback only (never a system notification sound):
/// it only ever sounds while one of those screens is actually on screen,
/// starts when the screen starts "ringing", and is stopped the instant the
/// user answers/declines or the screen leaves the foreground — exactly like
/// the vibration pattern it plays alongside.
///
/// Asset: `assets/audio/athan.mp3` — a CC0 (public-domain) recording, see
/// https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg
class AthanPlayer {
  static const _assetPath = 'audio/athan.mp3';

  AudioPlayer? _player;
  bool _disposed = false;

  /// Starts playback from the beginning. Safe to call even if a previous
  /// play is still running (replaces it). Failures (e.g. unsupported codec
  /// on an obscure device) are swallowed — a missing Athan sound must never
  /// crash or block the call screen, which still rings via vibration.
  Future<void> play() async {
    if (_disposed) return;
    try {
      final player = _player ??= AudioPlayer();
      await player.setReleaseMode(ReleaseMode.stop);
      await player.play(AssetSource(_assetPath));
    } catch (e) {
      debugPrint('AthanPlayer: play failed: $e');
    }
  }

  /// Stops playback immediately. Idempotent.
  Future<void> stop() async {
    if (_disposed) return;
    try {
      await _player?.stop();
    } catch (e) {
      debugPrint('AthanPlayer: stop failed: $e');
    }
  }

  /// Releases the underlying player. After this, [play] is a no-op.
  Future<void> dispose() async {
    if (_disposed) return;
    _disposed = true;
    try {
      await _player?.dispose();
    } catch (e) {
      debugPrint('AthanPlayer: dispose failed: $e');
    }
    _player = null;
  }
}
