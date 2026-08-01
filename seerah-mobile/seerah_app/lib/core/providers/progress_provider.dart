import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import '../network/api_client.dart';

// ─── Keys ────────────────────────────────────────────────────────────────────
//
// All progress keys are scoped by learner profile id (see [_scoped]) so that
// switching profiles on a shared family device never merges one learner's
// local cache into another's. `_kUnscopedSuffix` is used only for the very
// first paint before the app has ever learned the true active profile id
// (e.g. right after a fresh login, before /api/mobile-progress/get responds)
// and is discarded — never unioned into a mismatched profile — the moment
// the real id is known. See ProgressNotifier._syncFromServer.

const _kViewedKey      = 'seerah:viewed_parts';
const _kCompletedKey   = 'seerah:completed_parts';
const _kLastPartKey    = 'seerah:last_part';
const _kQuizScoresKey  = 'seerah:quiz_scores';
// partNumber -> {questionId: chosen option text}. Cached alongside the score
// itself so a quiz finished while offline can still be independently
// re-verified server-side (via bulk-sync) once connectivity returns, instead
// of the server having no choice but to trust a bare percentage.
const _kQuizAnswersKey = 'seerah:quiz_answers';
// Audit C4: partNumber -> highest watchPercent observed locally. Previously
// trackVideoProgress was fire-and-forget POST only — offline/flaky network
// permanently lost video completion toward the shared 85% threshold.
const _kVideoWatchKey  = 'seerah:video_watch';
const _kUnscopedSuffix = 'unknown';

String _scoped(String base, String profileId) => '$base::$profileId';

// ─── State ────────────────────────────────────────────────────────────────────

class ProgressState {
  final Set<int> viewedParts;
  final Set<int> completedParts;
  final int? lastPartNumber;
  final Map<int, int> quizScores;
  /// partNumber -> {questionId: chosen option text} for the best-scoring
  /// attempt cached locally. Only populated once a quiz recorded via
  /// [ProgressNotifier.recordQuizScore] hasn't yet been confirmed accepted
  /// by the server; see [ProgressNotifier.pushLocalToServer].
  final Map<int, Map<String, String>> quizAnswers;
  /// partNumber -> highest video/audio watch percent cached locally that
  /// may not yet have reached the server (Audit C4).
  final Map<int, int> videoWatchPercents;
  /// True when the most recent attempt to reach the server (sync or push)
  /// failed — e.g. offline, or a transient server error. The UI shown is
  /// always the local cache regardless, but this lets screens surface a
  /// "you're offline — showing cached progress" hint instead of silently
  /// pretending everything is in sync (previously _syncFromServer/_trackServer
  /// failures were only ever debugPrint'd, invisible to the user).
  final bool syncFailed;

  const ProgressState({
    this.viewedParts = const {},
    this.completedParts = const {},
    this.lastPartNumber,
    this.quizScores = const {},
    this.quizAnswers = const {},
    this.videoWatchPercents = const {},
    this.syncFailed = false,
  });

  ProgressState copyWith({
    Set<int>? viewedParts,
    Set<int>? completedParts,
    int? lastPartNumber,
    Map<int, int>? quizScores,
    Map<int, Map<String, String>>? quizAnswers,
    Map<int, int>? videoWatchPercents,
    bool? syncFailed,
  }) =>
      ProgressState(
        viewedParts: viewedParts ?? this.viewedParts,
        completedParts: completedParts ?? this.completedParts,
        lastPartNumber: lastPartNumber ?? this.lastPartNumber,
        quizScores: quizScores ?? this.quizScores,
        quizAnswers: quizAnswers ?? this.quizAnswers,
        videoWatchPercents: videoWatchPercents ?? this.videoWatchPercents,
        syncFailed: syncFailed ?? this.syncFailed,
      );

  int get totalViewed    => viewedParts.length;
  int get totalCompleted => completedParts.length;

  double viewedFraction(int total) =>
      total == 0 ? 0.0 : (viewedParts.length / total).clamp(0.0, 1.0);

  double completedFraction(int total) =>
      total == 0 ? 0.0 : (completedParts.length / total).clamp(0.0, 1.0);

  int viewedInEra(List<int> eraParts) =>
      eraParts.where((p) => viewedParts.contains(p)).length;

  int completedInEra(List<int> eraParts) =>
      eraParts.where((p) => completedParts.contains(p)).length;
}

// ─── Notifier ─────────────────────────────────────────────────────────────────

class ProgressNotifier extends AsyncNotifier<ProgressState> {
  /// The learner profile id the current in-memory/local-cache state belongs
  /// to. `null` until the very first paint's cache is loaded; set to
  /// [_kUnscopedSuffix] as a placeholder before the server confirms the
  /// real id.
  String? _profileId;

  @override
  Future<ProgressState> build() async {
    final cachedProfileId = await _cachedActiveProfileId();
    _profileId = cachedProfileId ?? _kUnscopedSuffix;
    // Start with local cache for instant UI, then try server sync.
    final local = await _loadLocal(_profileId!);
    // Fire-and-forget server sync — don't block the UI.
    _syncFromServer(local, loadedForProfileId: _profileId!);
    return local;
  }

  Future<String?> _cachedActiveProfileId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(AppConstants.keyActiveProfileId);
  }

  // ── Local persistence ──────────────────────────────────────────────────────

  Future<ProgressState> _loadLocal(String profileId) async {
    final prefs = await SharedPreferences.getInstance();

    Set<int> parseSet(String key) {
      final raw = prefs.getString(_scoped(key, profileId));
      if (raw == null) return {};
      try {
        return (jsonDecode(raw) as List).cast<int>().toSet();
      } catch (_) {
        return {};
      }
    }

    Map<int, int> parseScores() {
      final raw = prefs.getString(_scoped(_kQuizScoresKey, profileId));
      if (raw == null) return {};
      try {
        return (jsonDecode(raw) as Map<String, dynamic>)
            .map((k, v) => MapEntry(int.parse(k), (v as num).toInt()));
      } catch (_) {
        return {};
      }
    }

    Map<int, Map<String, String>> parseAnswers() {
      final raw = prefs.getString(_scoped(_kQuizAnswersKey, profileId));
      if (raw == null) return {};
      try {
        return (jsonDecode(raw) as Map<String, dynamic>).map(
          (k, v) => MapEntry(int.parse(k), (v as Map<String, dynamic>).cast<String, String>()),
        );
      } catch (_) {
        return {};
      }
    }

    return ProgressState(
      viewedParts: parseSet(_kViewedKey),
      completedParts: parseSet(_kCompletedKey),
      lastPartNumber: prefs.getInt(_scoped(_kLastPartKey, profileId)),
      quizScores: parseScores(),
      quizAnswers: parseAnswers(),
      videoWatchPercents: () {
        final raw = prefs.getString(_scoped(_kVideoWatchKey, profileId));
        if (raw == null) return <int, int>{};
        try {
          return (jsonDecode(raw) as Map<String, dynamic>)
              .map((k, v) => MapEntry(int.parse(k), (v as num).toInt()));
        } catch (_) {
          return <int, int>{};
        }
      }(),
    );
  }

  Future<void> _saveLocal(ProgressState s, String profileId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_scoped(_kViewedKey, profileId), jsonEncode(s.viewedParts.toList()));
    await prefs.setString(_scoped(_kCompletedKey, profileId), jsonEncode(s.completedParts.toList()));
    if (s.lastPartNumber != null) {
      await prefs.setInt(_scoped(_kLastPartKey, profileId), s.lastPartNumber!);
    }
    await prefs.setString(_scoped(_kQuizScoresKey, profileId),
        jsonEncode(s.quizScores.map((k, v) => MapEntry(k.toString(), v))));
    await prefs.setString(_scoped(_kQuizAnswersKey, profileId),
        jsonEncode(s.quizAnswers.map((k, v) => MapEntry(k.toString(), v))));
    await prefs.setString(_scoped(_kVideoWatchKey, profileId),
        jsonEncode(s.videoWatchPercents.map((k, v) => MapEntry(k.toString(), v))));
  }

  // ── Server sync ────────────────────────────────────────────────────────────

  Future<void> _syncFromServer(
    ProgressState local, {
    required String loadedForProfileId,
    bool reconcileLocal = true,
  }) async {
    try {
      final response = await ApiClient.instance.dio.get('/api/mobile-progress/get');
      final data = response.data as Map<String, dynamic>;

      final serverViewed = (data['viewedParts'] as List?)?.cast<int>().toSet() ?? <int>{};
      final serverCompleted = (data['completedParts'] as List?)?.cast<int>().toSet() ?? <int>{};
      final serverScoresRaw = (data['quizScores'] as Map<String, dynamic>?) ?? {};
      final serverScores = serverScoresRaw.map((k, v) => MapEntry(int.parse(k), (v as num).toInt()));
      final serverLastPart = data['lastPartNumber'] as int?;
      final serverProfileId = data['activeProfileId'] as String?;

      // The server is the ultimate source of truth for which profile is
      // active. If the local cache we loaded was for a different (or not
      // yet known) profile, discard it instead of unioning it in — that
      // would leak one learner's progress into another's. Persist the
      // now-known id so every subsequent build() loads the right bucket
      // from the start.
      final effectiveProfileId = serverProfileId ?? loadedForProfileId;
      final localMatchesProfile = serverProfileId == null || serverProfileId == loadedForProfileId;
      final baseLocal = localMatchesProfile ? local : const ProgressState();

      if (serverProfileId != null) {
        _profileId = serverProfileId;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConstants.keyActiveProfileId, serverProfileId);
      }

      // Merge: take the union of local + server (never lose local-only data
      // recorded for the SAME profile while offline).
      //
      // Quiz scores specifically take the max per part rather than letting
      // the server value win outright: recordQuizScore() updates local state
      // synchronously but pushes to the server fire-and-forget (_trackServer),
      // so a sync that lands in the small window before that POST completes
      // would otherwise clobber a just-recorded higher local score with the
      // server's stale (lower) one.
      final mergedScores = <int, int>{...baseLocal.quizScores};
      for (final entry in serverScores.entries) {
        final localBest = mergedScores[entry.key] ?? 0;
        mergedScores[entry.key] = entry.value > localBest ? entry.value : localBest;
      }

      // Audit H9 fix: completedParts used to be a straight union
      // ({...local, ...server}) that could only ever grow — a part
      // optimistically marked complete client-side the instant
      // recordQuizScore() saw score >= 80 (before the server independently
      // re-verifies the answers — see recordQuizScore's doc comment) stuck
      // around FOREVER even if the server's authoritative check (real
      // answers re-graded, quizScoreVerified, essentials-vs-complete plan
      // rules — see /api/mobile-progress/get) came back false, e.g. a stale
      // bulk-synced score with no answers to re-grade, or this exact H8 fix
      // narrowing what counts as "complete". Only keep a local-only
      // completion around while the server genuinely hasn't caught up to it
      // yet (its recorded score for that part is still behind the local
      // one) — once the server has seen the same-or-better score and still
      // says "not completed", trust that over local.
      final pendingLocalCompleted = baseLocal.completedParts
          .difference(serverCompleted)
          .where((part) {
        final localScore = baseLocal.quizScores[part];
        if (localScore == null) return false;
        final srvScore = serverScores[part];
        return srvScore == null || srvScore < localScore;
      });

      // lastPartNumber takes the max of local/server for the same reason as
      // quiz scores above: the server now derives this as the furthest part
      // ever reached (MAX(partNumber), not most-recent-timestamp — see
      // mobile-progress/get) specifically so it's monotonic, but a sync
      // landing before a recent markPartViewed() finishes its fire-and-forget
      // server push must not regress it locally in the meantime either.
      final mergedLastPart = (serverLastPart == null)
          ? baseLocal.lastPartNumber
          : (baseLocal.lastPartNumber == null || serverLastPart > baseLocal.lastPartNumber!)
              ? serverLastPart
              : baseLocal.lastPartNumber;

      final merged = ProgressState(
        viewedParts: {...baseLocal.viewedParts, ...serverViewed},
        completedParts: {...serverCompleted, ...pendingLocalCompleted},
        lastPartNumber: mergedLastPart,
        quizScores: mergedScores,
        // Not synced from the server (it never returns raw answers back) —
        // carry the locally-cached recovery copy forward untouched so a
        // later pushLocalToServer() can still resubmit it for verification.
        quizAnswers: baseLocal.quizAnswers,
        // Server doesn't return watch % today — keep local pending values
        // until bulk-sync pushes them (Audit C4).
        videoWatchPercents: baseLocal.videoWatchPercents,
      );

      state = AsyncData(merged);
      await _saveLocal(merged, effectiveProfileId);
      // Clean up the placeholder bucket once it's been reconciled so it
      // doesn't get accidentally reused/unioned later.
      if (loadedForProfileId != effectiveProfileId) {
        await _clearScoped(loadedForProfileId);
      }

      // Reconcile anything recorded locally that the server never received —
      // e.g. progress tracked while offline, or a _trackServer POST that
      // silently failed (see below). This used to only ever run right after
      // a guest→registered upgrade or a fresh login (pushLocalToServer was
      // never called otherwise), so an EXISTING signed-in user's offline
      // progress sat in local storage forever: it kept displaying correctly
      // on THIS device (local ∪ server is merged above), but the server —
      // and therefore every other device, the family dashboard, and the web
      // app — never learned about it, and it was permanently lost the
      // moment local storage was cleared or the app reinstalled. Running
      // this on every sync (app start, profile switch, pull-to-refresh)
      // closes that gap. Safe to call unconditionally: bulk-sync is
      // additive/idempotent — scores only ever rise, viewed rows are only
      // created if missing.
      if (reconcileLocal) unawaited(_pushToServer(merged));
    } catch (e) {
      // Server sync failed — keep using local data, but surface it via
      // syncFailed so screens can show an "offline" hint instead of quietly
      // pretending everything is in sync (see manualRefresh/pull-to-refresh).
      debugPrint('[Progress] server sync failed: $e');
      final base = state.valueOrNull ?? local;
      state = AsyncData(base.copyWith(syncFailed: true));
    }
  }

  /// Awaited, user-triggered resync — used by pull-to-refresh. Unlike the
  /// fire-and-forget sync in build()/normal flow, this returns only once the
  /// server round-trip (both pull and push) has actually completed, so a
  /// RefreshIndicator shows its spinner for a meaningful duration and gives
  /// the user a real answer to "did my progress actually save?" — previously
  /// unanswerable, since sync failures were only ever silently debugPrint'd.
  Future<void> manualRefresh() async {
    final current = state.valueOrNull ?? await _loadLocal(_profileId ?? _kUnscopedSuffix);
    await _syncFromServer(current, loadedForProfileId: _profileId ?? _kUnscopedSuffix);
  }

  Future<void> _trackServer(Map<String, dynamic> body) async {
    try {
      await ApiClient.instance.dio.post('/api/mobile-progress/track', data: body);
    } catch (e) {
      // Silently dropped events are exactly what _pushToServer (run on every
      // _syncFromServer) exists to catch up on later — see its doc comment.
      debugPrint('[Progress] track event failed: $e');
    }
  }

  // ── Public actions ─────────────────────────────────────────────────────────

  Future<void> markPartViewed(int partNumber) async {
    final current = state.valueOrNull ?? const ProgressState();
    final prevLast = current.lastPartNumber ?? 0;
    // Monotonic furthest-part (matches server get route's Math.max) — opening
    // an earlier part must not regress Continue / lastPartNumber.
    final nextLast = partNumber > prevLast ? partNumber : current.lastPartNumber;
    if (current.viewedParts.contains(partNumber) &&
        current.lastPartNumber == nextLast) {
      return;
    }

    final updated = current.copyWith(
      viewedParts: {...current.viewedParts, partNumber},
      lastPartNumber: nextLast,
    );
    state = AsyncData(updated);
    await _saveLocal(updated, _profileId ?? _kUnscopedSuffix);
    _trackServer({'type': 'part_opened', 'partNumber': partNumber});
  }

  Future<void> trackAssetOpened(int partNumber, String assetId) async {
    _trackServer({'type': 'asset_opened', 'partNumber': partNumber, 'assetId': assetId});
  }

  Future<void> trackVideoProgress(int partNumber, int watchPercent) async {
    final clamped = watchPercent.clamp(0, 100);
    final current = state.valueOrNull ?? const ProgressState();
    final prev = current.videoWatchPercents[partNumber] ?? 0;
    if (clamped > prev) {
      final updated = current.copyWith(
        videoWatchPercents: {...current.videoWatchPercents, partNumber: clamped},
      );
      state = AsyncData(updated);
      await _saveLocal(updated, _profileId ?? _kUnscopedSuffix);
    }
    _trackServer({'type': 'video_progress', 'partNumber': partNumber, 'watchPercent': clamped});
  }

  /// [answers] (questionId -> chosen option text) is required so the server
  /// can independently recompute the score from the part's authoritative
  /// quiz data — a bare client-supplied [score] is never trusted on its own
  /// (see /api/mobile-progress/track's quiz_completed handling).
  Future<void> recordQuizScore(int partNumber, int score, {required Map<String, String> answers}) async {
    final current = state.valueOrNull ?? const ProgressState();
    final prevBest = current.quizScores[partNumber] ?? 0;
    final isNewBest = score > prevBest;
    final newBest = isNewBest ? score : prevBest;
    final newScores = Map<int, int>.from(current.quizScores)..[partNumber] = newBest;
    // Only cache the answers behind the current best score — this is what
    // gets replayed to bulk-sync if the immediate `track` POST below never
    // makes it to the server (offline attempt), so it must correspond to the
    // score actually being kept.
    final newAnswers = Map<int, Map<String, String>>.from(current.quizAnswers);
    if (isNewBest) newAnswers[partNumber] = answers;
    // Do NOT optimistically add to completedParts — server re-grade +
    // quizScoreVerified is the source of truth (Continue would otherwise
    // advance before verify). Sync after track pulls the canonical set.

    final updated = current.copyWith(
      quizScores: newScores,
      quizAnswers: newAnswers,
    );
    state = AsyncData(updated);
    await _saveLocal(updated, _profileId ?? _kUnscopedSuffix);
    await _trackServer({
      'type': 'quiz_completed',
      'partNumber': partNumber,
      'score': score,
      'answers': answers,
    });
    await _syncFromServer(
      state.valueOrNull ?? updated,
      loadedForProfileId: _profileId ?? _kUnscopedSuffix,
      reconcileLocal: false,
    );
  }

  /// Pushes any local-only progress (viewedParts/quizScores the server may
  /// not have) up via bulk-sync. Shared by [pushLocalToServer] and the
  /// automatic reconciliation in [_syncFromServer] — see that method's doc
  /// comment for why this can't be limited to just the login/upgrade moment.
  Future<void> _pushToServer(ProgressState current) async {
    if (current.viewedParts.isEmpty &&
        current.quizScores.isEmpty &&
        current.videoWatchPercents.isEmpty) return;
    try {
      await ApiClient.instance.dio.post('/api/mobile-progress/bulk-sync', data: {
        'viewedParts': current.viewedParts.toList(),
        'quizScores': current.quizScores.map((k, v) => MapEntry(k.toString(), v)),
        'quizAnswers': current.quizAnswers.map((k, v) => MapEntry(k.toString(), v)),
        'videoWatchPercents':
            current.videoWatchPercents.map((k, v) => MapEntry(k.toString(), v)),
      });
    } catch (e) {
      debugPrint('[Progress] bulk sync failed: $e');
    }
  }

  /// One-time, best-effort push of progress recorded on this device (as a
  /// guest, or before signing in) onto the now-authenticated user. Call
  /// right after account creation or a successful login. Safe to call
  /// repeatedly — the server only ever raises scores, never lowers them.
  Future<void> pushLocalToServer() async {
    final current = state.valueOrNull;
    if (current == null) return;
    await _pushToServer(current);
    // Pull back the merged, canonical state so both sides stay consistent.
    // reconcileLocal: false — we just pushed everything above, no need for
    // _syncFromServer to immediately push again.
    await _syncFromServer(
      current,
      loadedForProfileId: _profileId ?? _kUnscopedSuffix,
      reconcileLocal: false,
    );
  }

  static const _kBaseKeys = [
    _kViewedKey,
    _kCompletedKey,
    _kLastPartKey,
    _kQuizScoresKey,
    _kQuizAnswersKey,
    _kVideoWatchKey,
  ];

  Future<void> _clearScoped(String profileId) async {
    final prefs = await SharedPreferences.getInstance();
    for (final base in _kBaseKeys) {
      await prefs.remove(_scoped(base, profileId));
    }
  }

  /// Wipes every learner profile's local progress cache on this device —
  /// used on logout / account deletion so a different user (or a different
  /// family member) signing in next never sees a prior user's cached
  /// viewed parts or quiz scores, even momentarily before the first server
  /// sync completes.
  Future<void> clearAll() async {
    state = const AsyncData(ProgressState());
    _profileId = null;
    final prefs = await SharedPreferences.getInstance();
    final prefix = _kBaseKeys.map((b) => '$b::').toSet();
    for (final key in prefs.getKeys().toList()) {
      if (prefix.any((p) => key.startsWith(p))) {
        await prefs.remove(key);
      }
    }
    // Also drop legacy unscoped keys from before this fix, if present.
    for (final base in _kBaseKeys) {
      await prefs.remove(base);
    }
    await prefs.remove(AppConstants.keyActiveProfileId);
  }

  /// Removes the on-device cache for one specific profile — call after a
  /// profile is deleted so its stale progress data doesn't linger forever.
  Future<void> clearForProfile(String profileId) => _clearScoped(profileId);

  /// Forces a hard reload for a newly-switched-to learner profile and waits
  /// for it to complete before returning. Call this (awaited) instead of
  /// `ref.invalidate(progressProvider)` right before navigating away from
  /// the profile switcher.
  ///
  /// Why not just invalidate: riverpod's default `skipLoadingOnRefresh: true`
  /// means `AsyncValue.valueOrNull`/`.when(data: ...)` keeps returning the
  /// PREVIOUS profile's already-loaded ProgressState while the invalidated
  /// provider's build() is still awaiting SharedPreferences/server reads for
  /// the new profile — so a caller that pops back to the dashboard right
  /// after invalidating can render the old profile's "Continue Learning"
  /// part number for one or more frames. Explicitly going through
  /// AsyncLoading (dropping `previous`) and awaiting the rebuild closes
  /// that window.
  Future<void> reset() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(build);
  }
}

final progressProvider =
    AsyncNotifierProvider<ProgressNotifier, ProgressState>(ProgressNotifier.new);
