import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/part_model.dart';
import '../network/api_client.dart';

// Fetches briefing/study guide text for a part
final partContentProvider = FutureProvider.family<PartContent, int>((ref, partNumber) async {
  final response = await ApiClient.instance.dio.get('/api/part/$partNumber/content');
  return PartContent.fromJson(response.data as Map<String, dynamic>);
});

// Fetches flashcard deck for a part
final flashcardsProvider = FutureProvider.family<List<FlashcardModel>, int>((ref, partNumber) async {
  final partId = 'part-$partNumber';
  final response = await ApiClient.instance.dio.get('/api/flashcards/$partId');
  final data = response.data;

  List<dynamic> cards = [];
  if (data is List) {
    cards = data;
  } else if (data is Map) {
    cards = (data['easy'] ?? data['medium'] ?? data['full'] ?? data['cards'] ?? []) as List;
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

// Gets the signed video URL for a part
final videoUrlProvider = FutureProvider.family<String?, int>((ref, partNumber) async {
  try {
    final response = await ApiClient.instance.dio.get('/api/media/video/$partNumber');
    final data = response.data;

    if (data is Map) {
      return data['url'] as String? ?? data['videoUrl'] as String?;
    }
    if (data is String && data.startsWith('http')) return data;

    // Use the real URI from after any redirects
    final realUri = response.realUri.toString();
    if (realUri.startsWith('http') && !realUri.contains('/api/media/')) {
      return realUri;
    }
    return null;
  } catch (_) {
    return null;
  }
});
