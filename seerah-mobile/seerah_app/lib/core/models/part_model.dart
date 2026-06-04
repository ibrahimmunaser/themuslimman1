class PartModel {
  final int partNumber;
  final String title;
  final String subtitle;
  final String era;
  final String description;

  const PartModel({
    required this.partNumber,
    required this.title,
    required this.subtitle,
    required this.era,
    required this.description,
  });

  String get id => 'part-$partNumber';
}

class EraModel {
  final String id;
  final String name;
  final String mood;
  final String atmosphere;
  final List<String> themeWords;

  const EraModel({
    required this.id,
    required this.name,
    required this.mood,
    required this.atmosphere,
    required this.themeWords,
  });
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
      question: json['question'] as String? ?? json['front'] as String? ?? '',
      answer: json['answer'] as String? ?? json['back'] as String? ?? '',
    );
  }
}

class QuizQuestion {
  final String question;
  final List<String> options;
  final int correctIndex;
  final String? explanation;

  const QuizQuestion({
    required this.question,
    required this.options,
    required this.correctIndex,
    this.explanation,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> json) {
    final options = (json['options'] as List?)?.cast<String>() ?? [];
    return QuizQuestion(
      question: json['question'] as String? ?? '',
      options: options,
      correctIndex: json['correctIndex'] as int? ?? 0,
      explanation: json['explanation'] as String?,
    );
  }
}
