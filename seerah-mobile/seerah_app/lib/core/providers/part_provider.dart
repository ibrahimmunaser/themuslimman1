import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/part_model.dart';
import '../network/api_client.dart';

// Slide image file (medium + thumb URLs)
class SlideFile {
  final String medium;
  final String thumb;
  const SlideFile({required this.medium, required this.thumb});

  factory SlideFile.fromJson(Map<String, dynamic> json) => SlideFile(
    medium: json['medium'] as String? ?? '',
    thumb:  json['thumb']  as String? ?? '',
  );
}

class SlideSet {
  final List<SlideFile> presented;
  final List<SlideFile> detailed;
  final List<SlideFile> facts;
  const SlideSet({required this.presented, required this.detailed, required this.facts});
}

final slidesProvider = FutureProvider.family<SlideSet, int>((ref, partNumber) async {
  final partId = 'part-$partNumber';
  final response = await ApiClient.instance.dio.get('/api/slides/$partId');
  final data = response.data as Map<String, dynamic>;

  List<SlideFile> parseList(dynamic raw) {
    if (raw is! List) return [];
    return raw.map((e) => SlideFile.fromJson(e as Map<String, dynamic>)).toList();
  }

  return SlideSet(
    presented: parseList(data['presented']),
    detailed:  parseList(data['detailed']),
    facts:     parseList(data['facts']),
  );
});

// Fetches briefing/study guide text for a part
final partContentProvider = FutureProvider.family<PartContent, int>((ref, partNumber) async {
  final response = await ApiClient.instance.dio.get('/api/part/$partNumber/content');
  return PartContent.fromJson(response.data as Map<String, dynamic>);
});

// Fetches flashcard deck for a part.
// Server returns a FlashcardSet: { easy: [...], medium: [...], full: [...] }
// where each card has { side1, side2, id, card_number, tags }.
// We prefer "medium" level; fall back to easy, then full.
final flashcardsProvider = FutureProvider.family<List<FlashcardModel>, int>((ref, partNumber) async {
  final partId = 'part-$partNumber';
  final response = await ApiClient.instance.dio.get('/api/flashcards/$partId');
  final data = response.data;

  List<dynamic> cards = [];
  if (data is List) {
    cards = data;
  } else if (data is Map) {
    // Prefer medium deck; fall back to easy, then full
    final medium = data['medium'] as List?;
    final easy   = data['easy']   as List?;
    final full   = data['full']   as List?;
    cards = (medium?.isNotEmpty == true ? medium
           : easy?.isNotEmpty   == true ? easy
           : full) ?? [];
  }
  return cards.map((c) => FlashcardModel.fromJson(c as Map<String, dynamic>)).toList();
});

// Fetches quiz questions for a part
final quizProvider = FutureProvider.family<List<QuizQuestion>, int>((ref, partNumber) async {
  final partId = 'part-$partNumber';
  final response = await ApiClient.instance.dio.get('/api/quiz/$partId');
  final data = response.data;

  List<dynamic> questions = [];
  if (data is List) {
    questions = data;
  } else if (data is Map) {
    questions = (data['questions'] ?? []) as List;
  }
  return questions.map((q) => QuizQuestion.fromJson(q as Map<String, dynamic>)).toList();
});

// Gets all signed asset URLs for a part (video, audio, mindmap, thumbnail).
// Uses the /api/part/{n}/assets endpoint — the single production source of truth.
class PartAssets {
  final String? videoUrl;
  final String? audioUrl;
  final String? mindmapUrl;
  final String? thumbnailUrl;
  const PartAssets({this.videoUrl, this.audioUrl, this.mindmapUrl, this.thumbnailUrl});
}

final partAssetsProvider = FutureProvider.family<PartAssets, int>((ref, partNumber) async {
  final response = await ApiClient.instance.dio.get('/api/part/$partNumber/assets');
  final data = response.data as Map<String, dynamic>;
  return PartAssets(
    videoUrl: data['videoUrl'] as String?,
    audioUrl: data['audioUrl'] as String?,
    mindmapUrl: data['mindmapUrl'] as String?,
    thumbnailUrl: data['thumbnailUrl'] as String?,
  );
});

// Infographic image URLs (concise, standard, bento grid) from dedicated API.
class InfographicSet {
  final String? concise;
  final String? standard;
  final String? bentoGrid;

  const InfographicSet({this.concise, this.standard, this.bentoGrid});

  bool get hasAny =>
      (concise?.isNotEmpty ?? false) ||
      (standard?.isNotEmpty ?? false) ||
      (bentoGrid?.isNotEmpty ?? false);
}

final infographicsProvider = FutureProvider.family<InfographicSet, int>((ref, partNumber) async {
  final response = await ApiClient.instance.dio.get('/api/infographics/$partNumber');
  final data = response.data as Map<String, dynamic>;
  return InfographicSet(
    concise: data['concise'] as String?,
    standard: data['standard'] as String?,
    bentoGrid: data['bentoGrid'] as String?,
  );
});
