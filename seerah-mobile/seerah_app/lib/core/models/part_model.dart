import '../data/parts_titles_fr.dart';

class PartModel {
  final int partNumber;
  final String title;
  final String subtitle;
  final String era;
  final String description;
  final String? titleAr;
  final String? subtitleAr;

  const PartModel({
    required this.partNumber,
    required this.title,
    required this.subtitle,
    required this.era,
    required this.description,
    this.titleAr,
    this.subtitleAr,
  });

  String get id => 'part-$partNumber';

  /// English title/subtitle stay the source of truth for [description] and
  /// any other field with no translation available yet.
  String localizedTitle(String lang) {
    if (lang == 'ar') return titleAr ?? title;
    if (lang == 'fr') return kPartTitlesFr[partNumber]?.title ?? title;
    return title;
  }

  String localizedSubtitle(String lang) {
    if (lang == 'ar') return subtitleAr ?? subtitle;
    if (lang == 'fr') return kPartTitlesFr[partNumber]?.subtitle ?? subtitle;
    return subtitle;
  }
}

class EraModel {
  final String id;
  final String name;
  final String mood;
  final String atmosphere;
  final List<String> themeWords;
  final String? nameAr;

  const EraModel({
    required this.id,
    required this.name,
    required this.mood,
    required this.atmosphere,
    required this.themeWords,
    this.nameAr,
  });

  String localizedName(String lang) {
    if (lang == 'ar') return nameAr ?? name;
    if (lang == 'fr') return kEraNamesFr[id] ?? name;
    return name;
  }
}

class PartContent {
  final String? briefingText;
  final String? studyGuideText;
  final String? statementOfFactsText;

  const PartContent({
    this.briefingText,
    this.studyGuideText,
    this.statementOfFactsText,
  });

  factory PartContent.fromJson(Map<String, dynamic> json) {
    return PartContent(
      briefingText: json['briefingText'] as String?,
      studyGuideText: json['studyGuideText'] as String?,
      statementOfFactsText: json['statementOfFactsText'] as String?,
    );
  }
}

class FlashcardModel {
  final String question;
  final String answer;

  const FlashcardModel({required this.question, required this.answer});

  factory FlashcardModel.fromJson(Map<String, dynamic> json) {
    return FlashcardModel(
      // Server returns side1/side2 (Flashcard type). Fall back to legacy keys.
      question: json['side1'] as String?
          ?? json['question'] as String?
          ?? json['front'] as String?
          ?? '',
      answer: json['side2'] as String?
          ?? json['answer'] as String?
          ?? json['back'] as String?
          ?? '',
    );
  }
}

class QuizQuestion {
  final String id;
  final String question;
  final List<String> options;
  final int correctIndex;
  final String? explanation;

  const QuizQuestion({
    required this.id,
    required this.question,
    required this.options,
    required this.correctIndex,
    this.explanation,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> json) {
    final options = (json['options'] as List?)?.cast<String>() ?? [];
    return QuizQuestion(
      id: json['id'] as String? ?? '',
      question: json['question'] as String? ?? '',
      options: options,
      // Server now sends correctIndex directly; fall back to 0 if absent.
      correctIndex: json['correctIndex'] as int? ?? 0,
      explanation: json['explanation'] as String?,
    );
  }
}
