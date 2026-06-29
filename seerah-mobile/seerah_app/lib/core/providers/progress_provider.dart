import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../network/api_client.dart';

// ─── Keys ────────────────────────────────────────────────────────────────────

const _kViewedKey      = 'seerah:viewed_parts';
const _kCompletedKey   = 'seerah:completed_parts';
const _kLastPartKey    = 'seerah:last_part';
const _kQuizScoresKey  = 'seerah:quiz_scores';

// ─── State ────────────────────────────────────────────────────────────────────

class ProgressState {
  final Set<int> viewedParts;
  final Set<int> completedParts;
  final int? lastPartNumber;
  final Map<int, int> quizScores;

  const ProgressState({
    this.viewedParts = const {},
    this.completedParts = const {},
    this.lastPartNumber,
    this.quizScores = const {},
  });

  ProgressState copyWith({
    Set<int>? viewedParts,
    Set<int>? completedParts,
    int? lastPartNumber,
    Map<int, int>? quizScores,
  }) =>
      ProgressState(
        viewedParts: viewedParts ?? this.viewedParts,
        completedParts: completedParts ?? this.completedParts,
        lastPartNumber: lastPartNumber ?? this.lastPartNumber,
        quizScores: quizScores ?? this.quizScores,
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
  @override
  Future<ProgressState> build() async {
    // Start with local cache for instant UI, then try server sync.
    final local = await _loadLocal();
    // Fire-and-forget server sync — don't block the UI.
    _syncFromServer(local);
    return local;
  }

  // ── Local persistence ──────────────────────────────────────────────────────

  Future<ProgressState> _loadLocal() async {
    final prefs = await SharedPreferences.getInstance();

    Set<int> parseSet(String key) {
      final raw = prefs.getString(key);
      if (raw == null) return {};
      try {
        return (jsonDecode(raw) as List).cast<int>().toSet();
      } catch (_) {
        return {};
      }
    }

    Map<int, int> parseScores() {
      final raw = prefs.getString(_kQuizScoresKey);
      if (raw == null) return {};
      try {
        return (jsonDecode(raw) as Map<String, dynamic>)
            .map((k, v) => MapEntry(int.parse(k), (v as num).toInt()));
      } catch (_) {
        return {};
      }
    }

    return ProgressState(
      viewedParts: parseSet(_kViewedKey),
      completedParts: parseSet(_kCompletedKey),
      lastPartNumber: prefs.getInt(_kLastPartKey),
      quizScores: parseScores(),
    );
  }

  Future<void> _saveLocal(ProgressState s) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kViewedKey, jsonEncode(s.viewedParts.toList()));
    await prefs.setString(_kCompletedKey, jsonEncode(s.completedParts.toList()));
    if (s.lastPartNumber != null) await prefs.setInt(_kLastPartKey, s.lastPartNumber!);
    await prefs.setString(_kQuizScoresKey,
        jsonEncode(s.quizScores.map((k, v) => MapEntry(k.toString(), v))));
  }

  // ── Server sync ────────────────────────────────────────────────────────────

  Future<void> _syncFromServer(ProgressState local) async {
    try {
      final response = await ApiClient.instance.dio.get('/api/mobile-progress/get');
      final data = response.data as Map<String, dynamic>;

      final serverViewed = (data['viewedParts'] as List?)?.cast<int>().toSet() ?? <int>{};
      final serverCompleted = (data['completedParts'] as List?)?.cast<int>().toSet() ?? <int>{};
      final serverScoresRaw = (data['quizScores'] as Map<String, dynamic>?) ?? {};
      final serverScores = serverScoresRaw.map((k, v) => MapEntry(int.parse(k), (v as num).toInt()));
      final serverLastPart = data['lastPartNumber'] as int?;

      // Merge: take the union of local + server (never lose local-only data).
      final merged = ProgressState(
        viewedParts: {...local.viewedParts, ...serverViewed},
        completedParts: {...local.completedParts, ...serverCompleted},
        lastPartNumber: serverLastPart ?? local.lastPartNumber,
        quizScores: {...local.quizScores, ...serverScores},
      );

      state = AsyncData(merged);
      await _saveLocal(merged);
    } catch (e) {
      // Server sync failed — keep using local data silently.
      debugPrint('[Progress] server sync failed: $e');
    }
  }

  Future<void> _trackServer(Map<String, dynamic> body) async {
    try {
      await ApiClient.instance.dio.post('/api/mobile-progress/track', data: body);
    } catch (e) {
      debugPrint('[Progress] track event failed: $e');
    }
  }

  // ── Public actions ─────────────────────────────────────────────────────────

  Future<void> markPartViewed(int partNumber) async {
    final current = state.valueOrNull ?? const ProgressState();
    if (current.viewedParts.contains(partNumber) &&
        current.lastPartNumber == partNumber) return;

    final updated = current.copyWith(
      viewedParts: {...current.viewedParts, partNumber},
      lastPartNumber: partNumber,
    );
    state = AsyncData(updated);
    await _saveLocal(updated);
    _trackServer({'type': 'part_opened', 'partNumber': partNumber});
  }

  Future<void> trackAssetOpened(int partNumber, String assetId) async {
    _trackServer({'type': 'asset_opened', 'partNumber': partNumber, 'assetId': assetId});
  }

  Future<void> trackVideoProgress(int partNumber, int watchPercent) async {
    _trackServer({'type': 'video_progress', 'partNumber': partNumber, 'watchPercent': watchPercent});
  }

  Future<void> recordQuizScore(int partNumber, int score) async {
    final current = state.valueOrNull ?? const ProgressState();
    final prevBest = current.quizScores[partNumber] ?? 0;
    final newBest = score > prevBest ? score : prevBest;
    final newScores = Map<int, int>.from(current.quizScores)..[partNumber] = newBest;
    final newCompleted = score >= 80
        ? {...current.completedParts, partNumber}
        : current.completedParts;

    final updated = current.copyWith(quizScores: newScores, completedParts: newCompleted);
    state = AsyncData(updated);
    await _saveLocal(updated);
    _trackServer({'type': 'quiz_completed', 'partNumber': partNumber, 'score': score});
  }

  Future<void> clearAll() async {
    state = const AsyncData(ProgressState());
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kViewedKey);
    await prefs.remove(_kCompletedKey);
    await prefs.remove(_kLastPartKey);
    await prefs.remove(_kQuizScoresKey);
  }
}

final progressProvider =
    AsyncNotifierProvider<ProgressNotifier, ProgressState>(ProgressNotifier.new);
