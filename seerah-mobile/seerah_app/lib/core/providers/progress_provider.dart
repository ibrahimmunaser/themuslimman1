import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ─── Keys ────────────────────────────────────────────────────────────────────

const _kViewedKey      = 'seerah:viewed_parts';    // JSON list of ints
const _kCompletedKey   = 'seerah:completed_parts'; // JSON list of ints
const _kLastPartKey    = 'seerah:last_part';        // int
const _kQuizScoresKey  = 'seerah:quiz_scores';      // JSON map {partNum: score}

// ─── State ────────────────────────────────────────────────────────────────────

class ProgressState {
  /// Parts the user has opened at least once.
  final Set<int> viewedParts;
  /// Parts where the user passed the quiz (≥ 80 %).
  final Set<int> completedParts;
  /// Last part the user navigated to (used for "continue learning").
  final int? lastPartNumber;
  /// Best quiz score per part (0–100).
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

  /// Fraction of parts viewed out of the given total (0.0–1.0).
  double viewedFraction(int total) =>
      total == 0 ? 0.0 : (viewedParts.length / total).clamp(0.0, 1.0);

  /// Fraction of parts completed out of the given total (0.0–1.0).
  double completedFraction(int total) =>
      total == 0 ? 0.0 : (completedParts.length / total).clamp(0.0, 1.0);

  /// Viewed parts that belong to a specific era (list of part numbers).
  int viewedInEra(List<int> eraParts) =>
      eraParts.where((p) => viewedParts.contains(p)).length;

  /// Completed parts in a specific era.
  int completedInEra(List<int> eraParts) =>
      eraParts.where((p) => completedParts.contains(p)).length;
}

// ─── Notifier ─────────────────────────────────────────────────────────────────

class ProgressNotifier extends AsyncNotifier<ProgressState> {
  @override
  Future<ProgressState> build() => _load();

  Future<ProgressState> _load() async {
    final prefs = await SharedPreferences.getInstance();

    Set<int> parseSet(String key) {
      final raw = prefs.getString(key);
      if (raw == null) return {};
      try {
        final list = (jsonDecode(raw) as List).cast<int>();
        return list.toSet();
      } catch (_) {
        return {};
      }
    }

    Map<int, int> parseScores() {
      final raw = prefs.getString(_kQuizScoresKey);
      if (raw == null) return {};
      try {
        final map = (jsonDecode(raw) as Map<String, dynamic>);
        return map.map((k, v) => MapEntry(int.parse(k), (v as num).toInt()));
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

  /// Record that the user opened a part.
  Future<void> markPartViewed(int partNumber) async {
    final current = state.valueOrNull ?? const ProgressState();
    if (current.viewedParts.contains(partNumber) &&
        current.lastPartNumber == partNumber) {
      return; // nothing changed
    }

    final updated = current.copyWith(
      viewedParts: {...current.viewedParts, partNumber},
      lastPartNumber: partNumber,
    );
    state = AsyncData(updated);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
        _kViewedKey, jsonEncode(updated.viewedParts.toList()));
    await prefs.setInt(_kLastPartKey, partNumber);
  }

  /// Record a quiz score. Marks part as completed if score ≥ 80.
  Future<void> recordQuizScore(int partNumber, int score) async {
    final current = state.valueOrNull ?? const ProgressState();

    final prevBest = current.quizScores[partNumber] ?? 0;
    final newBest = score > prevBest ? score : prevBest;
    final newScores = Map<int, int>.from(current.quizScores)..[partNumber] = newBest;

    final newCompleted = score >= 80
        ? {...current.completedParts, partNumber}
        : current.completedParts;

    final updated = current.copyWith(
      quizScores: newScores,
      completedParts: newCompleted,
    );
    state = AsyncData(updated);

    final prefs = await SharedPreferences.getInstance();
    final scoresJson = jsonEncode(
        newScores.map((k, v) => MapEntry(k.toString(), v)));
    await prefs.setString(_kQuizScoresKey, scoresJson);
    if (score >= 80) {
      await prefs.setString(
          _kCompletedKey, jsonEncode(newCompleted.toList()));
    }
  }

  /// Clear all progress (e.g. on sign-out).
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
    AsyncNotifierProvider<ProgressNotifier, ProgressState>(
        ProgressNotifier.new);
