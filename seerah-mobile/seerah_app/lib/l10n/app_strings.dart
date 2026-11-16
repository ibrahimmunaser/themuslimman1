/// Lightweight localization dictionary for the Seerah app.
///
/// Course languages match the website (en / ar / fr plus the twelve
/// translated courses). A full `flutter gen-l10n` /
/// ARB pipeline would be pure overhead — this is a plain Dart map with a
/// single lookup helper — `t(lang, key)` — used throughout the UI instead
/// of hardcoded English strings.
library;

import 'course_numbers.dart';
import 'course_packs.dart';

const Map<String, Map<String, String>> _kStrings = {
  // ── Bottom navigation ────────────────────────────────────────────────────
  'navHome': {'en': 'Home', 'ar': 'الرئيسية', 'fr': 'Accueil'},
  'navSeerah': {'en': 'Seerah', 'ar': 'السيرة', 'fr': 'Sîra'},
  'navQuran': {'en': 'Quran', 'ar': 'القرآن', 'fr': 'Coran'},
  'navSalah': {'en': 'Salah', 'ar': 'الصلاة', 'fr': 'Salat'},
  'navLessons': {'en': 'Lessons', 'ar': 'الدروس', 'fr': 'Leçons'},
  'navResources': {'en': 'Resources', 'ar': 'الموارد', 'fr': 'Ressources'},
  'navReference': {'en': 'Reference', 'ar': 'المراجع', 'fr': 'Référence'},
  'navProgress': {'en': 'Progress', 'ar': 'التقدم', 'fr': 'Progression'},
  'qiblaShort': {'en': 'Qibla', 'ar': 'القبلة', 'fr': 'Qibla'},
  'continuePartNamed': {
    'en': 'Continue Part {n}: {title}',
    'ar': 'تابع الجزء {n}: {title}',
    'fr': 'Continuer la partie {n} : {title}',
  },
  'nextPrayer': {'en': 'Next prayer', 'ar': 'الصلاة التالية', 'fr': 'Prochaine prière'},
  'prayerTimesUnavailable': {
    'en': 'Set your location to see prayer times',
    'ar': 'حدد موقعك لعرض أوقات الصلاة',
    'fr': 'Définissez votre position pour voir les horaires',
  },
  'nOfNCompleted': {
    'en': '{done} of {total} parts completed',
    'ar': '{done} من {total} أجزاء مكتملة',
    'fr': '{done} parties sur {total} terminées',
  },

  // ── Common ───────────────────────────────────────────────────────────────
  'back': {'en': 'Back', 'ar': 'رجوع', 'fr': 'Retour'},
  'language': {'en': 'Language', 'ar': 'اللغة', 'fr': 'Langue'},
  'appearance': {'en': 'Appearance', 'ar': 'المظهر', 'fr': 'Apparence'},
  'themeBlackGold': {'en': 'Black & Gold', 'ar': 'أسود وذهبي', 'fr': 'Noir et or', 'id': 'Hitam & Emas', 'ms': 'Hitam & Emas', 'zh': '黑金', 'ru': 'Чёрный и золотой', 'sw': 'Nyeusi na Dhahabu', 'es': 'Negro y Dorado', 'de': 'Schwarz & Gold', 'tr': 'Siyah ve Altın', 'hi': 'काला और सुनहरा', 'ur': 'کالا اور سنہرا', 'bn': 'কালো ও সোনালি', 'fa': 'مشکی و طلایی'},
  'themeEmeraldNight': {'en': 'Emerald Night', 'ar': 'ليل زمردي', 'fr': 'Nuit émeraude', 'id': 'Malam Zamrud', 'ms': 'Malam Zamrud', 'zh': '翡翠之夜', 'ru': 'Изумрудная ночь', 'sw': 'Usiku wa Zumaridi', 'es': 'Noche Esmeralda', 'de': 'Smaragdnacht', 'tr': 'Zümrüt Gece', 'hi': 'पन्ना रात्रि', 'ur': 'زمردی رات', 'bn': 'পান্না রাত', 'fa': 'شب زمردی'},
  'themeMidnightBlue': {'en': 'Midnight Blue', 'ar': 'أزرق منتصف الليل', 'fr': 'Bleu de minuit', 'id': 'Biru Tengah Malam', 'ms': 'Biru Tengah Malam', 'zh': '午夜蓝', 'ru': 'Полуночный синий', 'sw': 'Bluu ya Usiku wa Manane', 'es': 'Azul Medianoche', 'de': 'Mitternachtsblau', 'tr': 'Gece Yarısı Mavisi', 'hi': 'मध्यरात्रि नीला', 'ur': 'نصف شب نیلا', 'bn': 'মধ্যরাতের নীল', 'fa': 'آبی نیمه\u200cشب'},
  'themeRoyalPlum': {'en': 'Royal Plum', 'ar': 'بنفسجي ملكي', 'fr': 'Prune royale', 'id': 'Ungu Kerajaan', 'ms': 'Ungu Diraja', 'zh': '皇家紫', 'ru': 'Королевская слива', 'sw': 'Zambarau ya Kifalme', 'es': 'Ciruela Real', 'de': 'Königspflaume', 'tr': 'Kraliyet Eriği', 'hi': 'शाही बेर', 'ur': 'شاہی آلوبخارا', 'bn': 'রাজকীয় বরই', 'fa': 'آلوی سلطنتی'},
  'themeWarmMocha': {'en': 'Warm Mocha', 'ar': 'موكا دافئ', 'fr': 'Moka chaleureux', 'id': 'Moka Hangat', 'ms': 'Moka Hangat', 'zh': '暖摩卡', 'ru': 'Тёплая мокка', 'sw': 'Moka ya Joto', 'es': 'Moca Cálido', 'de': 'Warmer Mocha', 'tr': 'Sıcak Mokka', 'hi': 'गर्म मोका', 'ur': 'گرم موکا', 'bn': 'উষ্ণ মোকা', 'fa': 'موکای گرم'},
  'themeIvoryForest': {'en': 'Ivory & Forest', 'ar': 'عاجي وغابي', 'fr': 'Ivoire et forêt', 'id': 'Gading & Hutan', 'ms': 'Gading & Hutan', 'zh': '象牙与森林', 'ru': 'Слоновая кость и лес', 'sw': 'Pembe na Msitu', 'es': 'Marfil y Bosque', 'de': 'Elfenbein & Wald', 'tr': 'Fildişi ve Orman', 'hi': 'हाथीदांत और वन', 'ur': 'ہاتھی دانت اور جنگل', 'bn': 'হাতির দাঁত ও বন', 'fa': 'عاجی و جنگلی'},
  'themeSoftSage': {'en': 'Soft Sage', 'ar': 'أخضر مريمية هادئ', 'fr': 'Sauge douce', 'id': 'Sage Lembut', 'ms': 'Sage Lembut', 'zh': '柔和鼠尾草', 'ru': 'Нежный шалфей', 'sw': 'Kijani Laini cha Sage', 'es': 'Salvia Suave', 'de': 'Sanftes Salbeigrün', 'tr': 'Yumuşak Adaçayı', 'hi': 'मुलायम सेज', 'ur': 'نرم سیج', 'bn': 'নরম সেজ', 'fa': 'مریم\u200cگلی ملایم'},
  'themeSandTerracotta': {'en': 'Sand & Terracotta', 'ar': 'رملي وطيني', 'fr': 'Sable et terre cuite', 'id': 'Pasir & Terakota', 'ms': 'Pasir & Terakota', 'zh': '沙色与赤陶', 'ru': 'Песочный и терракотовый', 'sw': 'Mchanga na Terakota', 'es': 'Arena y Terracota', 'de': 'Sand & Terrakotta', 'tr': 'Kum ve Terrakota', 'hi': 'रेत और टेराकोटा', 'ur': 'ریت اور ٹیراکوٹا', 'bn': 'বালি ও টেরাকোটা', 'fa': 'شنی و سفالی'},
  'themeObsidianSilver': {'en': 'Obsidian & Silver', 'ar': 'سبج وفضي', 'fr': 'Obsidienne et argent', 'id': 'Obsidian & Perak', 'ms': 'Obsidian & Perak', 'zh': '黑曜石与银', 'ru': 'Обсидиан и серебро', 'sw': 'Obsidiani na Fedha', 'es': 'Obsidiana y Plata', 'de': 'Obsidian & Silber', 'tr': 'Obsidyen ve Gümüş', 'hi': 'ऑब्सीडियन और चांदी', 'ur': 'اوبسیڈین اور چاندی', 'bn': 'অবসিডিয়ান ও রুপা', 'fa': 'ابسیدین و نقره\u200cای'},
  'themeOceanTeal': {'en': 'Ocean Teal', 'ar': 'أزرق محيطي', 'fr': 'Bleu océan', 'id': 'Teal Samudra', 'ms': 'Teal Lautan', 'zh': '海洋青', 'ru': 'Океанический бирюзовый', 'sw': 'Rangi ya Bahari ya Teal', 'es': 'Turquesa Oceánico', 'de': 'Ozean-Türkis', 'tr': 'Okyanus Camgöbeği', 'hi': 'महासागर टील', 'ur': 'سمندری فیروزی', 'bn': 'সমুদ্র টিল', 'fa': 'فیروزه\u200cای اقیانوسی'},
  'themeBurgundyRose': {'en': 'Burgundy & Rose', 'ar': 'عنابي ووردي', 'fr': 'Bordeaux et rose', 'id': 'Burgundi & Mawar', 'ms': 'Burgundi & Mawar', 'zh': '酒红与玫瑰', 'ru': 'Бордовый и розовый', 'sw': 'Zambarau Nyekundu na Waridi', 'es': 'Borgoña y Rosa', 'de': 'Burgund & Rosé', 'tr': 'Bordo ve Gül', 'hi': 'बरगंडी और गुलाब', 'ur': 'برگنڈی اور گلابی', 'bn': 'বার্গান্ডি ও গোলাপ', 'fa': 'زرشکی و رز'},
  'themePearlSapphire': {'en': 'Pearl & Sapphire', 'ar': 'لؤلؤي وياقوتي', 'fr': 'Perle et saphir', 'id': 'Mutiara & Safir', 'ms': 'Mutiara & Nilam', 'zh': '珍珠与蓝宝石', 'ru': 'Жемчуг и сапфир', 'sw': 'Lulu na Yakuti', 'es': 'Perla y Zafiro', 'de': 'Perle & Saphir', 'tr': 'İnci ve Safir', 'hi': 'मोती और नीलम', 'ur': 'موتی اور نیلم', 'bn': 'মুক্তা ও নীলকান্তমণি', 'fa': 'مروارید و یاقوت کبود'},
  'themeBlushRosewood': {'en': 'Blush & Rosewood', 'ar': 'وردي وخشب الورد', 'fr': 'Rose poudré et bois de rose', 'id': 'Merah Muda & Kayu Mawar', 'ms': 'Merah Jambu & Kayu Mawar', 'zh': '腮红与玫瑰木', 'ru': 'Румянец и розовое дерево', 'sw': 'Waridi Hafifu na Mti wa Waridi', 'es': 'Rubor y Palo de Rosa', 'de': 'Blush & Rosenholz', 'tr': 'Allık ve Gül Ağacı', 'hi': 'ब्लश और रोज़वुड', 'ur': 'بلش اور روزووڈ', 'bn': 'ব্লাশ ও রোজউড', 'fa': 'صورتی ملایم و چوب گل سرخ'},
  'themeOliveLinen': {'en': 'Olive & Linen', 'ar': 'زيتوني وكتاني', 'fr': 'Olive et lin', 'id': 'Zaitun & Linen', 'ms': 'Zaitun & Linen', 'zh': '橄榄与亚麻', 'ru': 'Оливковый и льняной', 'sw': 'Zaituni na Kitani', 'es': 'Oliva y Lino', 'de': 'Olive & Leinen', 'tr': 'Zeytin ve Keten', 'hi': 'जैतून और लिनन', 'ur': 'زیتونی اور کتان', 'bn': 'জলপাই ও লিনেন', 'fa': 'زیتونی و کتانی'},
  'cancel': {'en': 'Cancel', 'ar': 'إلغاء', 'fr': 'Annuler'},
  'save': {'en': 'Save', 'ar': 'حفظ', 'fr': 'Enregistrer'},
  'done': {'en': 'Done', 'ar': 'تم', 'fr': 'Terminé'},
  'edit': {'en': 'Edit', 'ar': 'تعديل', 'fr': 'Modifier'},
  'delete': {'en': 'Delete', 'ar': 'حذف', 'fr': 'Supprimer'},
  'close': {'en': 'Close', 'ar': 'إغلاق', 'fr': 'Fermer'},
  'ok': {'en': 'OK', 'ar': 'حسنًا', 'fr': 'OK'},
  'clear': {'en': 'Clear', 'ar': 'مسح', 'fr': 'Effacer'},
  'retry': {'en': 'Retry', 'ar': 'إعادة المحاولة', 'fr': 'Réessayer'},
  'tryAgain': {'en': 'Try Again', 'ar': 'حاول مرة أخرى', 'fr': 'Réessayer'},
  'viewPlans': {
    'en': 'View Plans',
    'ar': 'عرض الخطط',
    'fr': 'Voir les formules',
  },
  'continueLearning': {
    'en': 'Continue Learning',
    'ar': 'استمر في التعلم',
    'fr': 'Continuer l\'apprentissage',
  },
  'goBack': {'en': 'Go Back', 'ar': 'رجوع', 'fr': 'Retour'},
  'next': {'en': 'Next', 'ar': 'التالي', 'fr': 'Suivant'},
  'prev': {'en': 'Prev', 'ar': 'السابق', 'fr': 'Préc.'},
  'searchEllipsis': {'en': 'Search…', 'ar': 'بحث…', 'fr': 'Rechercher…'},
  'parts': {'en': 'parts', 'ar': 'جزء', 'fr': 'parties'},
  'partsLabel': {'en': 'Parts', 'ar': 'الأجزاء', 'fr': 'Parties'},
  'nPartsSuffix': {'en': '{n} parts', 'ar': '{n} جزء', 'fr': '{n} parties'},
  'locked': {'en': 'Locked', 'ar': 'مغلق', 'fr': 'Verrouillé'},
  'studied': {'en': 'Studied', 'ar': 'تمت دراسته', 'fr': 'Étudié'},
  'completed': {'en': 'Completed', 'ar': 'مكتمل', 'fr': 'Terminé'},
  'signIn': {'en': 'Sign In', 'ar': 'تسجيل الدخول', 'fr': 'Se connecter'},
  'verifyingPurchaseBody': {
    'en':
        "Verifying your purchase — this can take up to a minute. Please don't close the app.",
    'ar':
        'جارٍ التحقق من شرائك — قد يستغرق ذلك حتى دقيقة واحدة. يرجى عدم إغلاق التطبيق.',
  },
  'pendingPurchasesPlural': {
    'en':
        'You have {n} pending purchases — tap Claim to unlock access. No account required.',
    'ar':
        'لديك {n} عمليات شراء معلّقة — اضغط على مطالبة لفتح الوصول. لا حاجة لحساب.',
    'fr':
        'You have {n} pending purchases — tap Claim to unlock access. No account required.',
  },
  'pendingPurchaseSingular': {
    'en':
        'You have a pending purchase — tap Claim to unlock access. No account required.',
    'ar':
        'لديك عملية شراء معلّقة — اضغط على مطالبة لفتح الوصول. لا حاجة لحساب.',
    'fr':
        'You have a pending purchase — tap Claim to unlock access. No account required.',
  },
  'claim': {'en': 'Claim', 'ar': 'مطالبة', 'fr': 'Réclamer'},
  'offlineBannerBody': {
    'en':
        "Couldn't reach the server — showing your last saved progress. Pull down to retry.",
    'ar':
        'تعذّر الوصول إلى الخادم — يتم عرض آخر تقدّم محفوظ. اسحب للأسفل لإعادة المحاولة.',
  },

  // ── Welcome screen ───────────────────────────────────────────────────────
  'welcomeTitleLine1': {
    'en': 'Complete Seerah',
    'ar': 'السيرة الكاملة',
    'fr': 'Sîra complète',
  },
  'welcomeReturning': {
    'en': 'Sign in',
    'ar': 'تسجيل الدخول',
    'fr': 'Se connecter',
  },
  'welcomeCourseHeadline': {
    'en': '100-Part Seerah Course',
    'ar': 'دورة السيرة المكوّنة من ١٠٠ جزء',
    'fr': 'Cours de Sîra en 100 parties',
  },
  'welcomeTagline': {
    'en': 'Learn the life of the\nProphet Muhammad ﷺ\nin 100 structured parts',
    'ar': 'تعلّم سيرة\nالنبي محمد ﷺ\nفي ١٠٠ جزء منظّم',
    'fr': 'Apprenez la vie du\nProphète Muhammad ﷺ\nen 100 parties structurées',
  },
  'welcomeFormats': {
    'en': 'Watch, listen, or read',
    'ar': 'شاهد أو استمع أو اقرأ',
    'fr': 'Regarder, écouter ou lire',
  },
  'welcomeStartFree': {
    'en': 'Watch the First Revelation — Free',
    'ar': 'شاهد الوحي الأول — مجانًا',
    'fr': 'Regardez la Première Révélation — gratuitement',
  },
  'welcomeStartFull': {
    'en': 'Start Full Course',
    'ar': 'ابدأ الدورة الكاملة',
    'fr': 'Commencer le cours complet',
  },
  'welcomeTour': {
    'en': 'Welcome Tour',
    'ar': 'جولة الترحيب',
    'fr': 'Visite de bienvenue',
  },
  'welcomeAlreadyAccess': {
    'en': 'Already have access? Sign in',
    'ar': 'لديك وصول بالفعل؟ سجّل الدخول',
    'fr': 'Vous avez déjà accès ? Connectez-vous',
  },
  'welcomeRestore': {
    'en': 'Restore purchase',
    'ar': 'استرجاع الشراء',
    'fr': 'Restaurer l\'achat',
  },
  'welcomeRestoreSuccess': {
    'en': 'Purchase restored! Full access unlocked.',
    'ar': 'تم استرجاع الشراء! تم فتح الوصول الكامل.',
    'fr': 'Achat restauré ! Accès complet débloqué.',
  },
  'welcomeRestoreNone': {
    'en': 'No previous purchases found.',
    'ar': 'لم يتم العثور على عمليات شراء سابقة.',
    'fr': 'Aucun achat précédent trouvé.',
  },
  'welcomeRestoreError': {
    'en': 'Could not restore purchases. Please try again.',
    'ar': 'تعذّر استرجاع المشتريات. حاول مرة أخرى.',
    'fr': 'Impossible de restaurer les achats. Veuillez réessayer.',
  },
  'welcomeSubtext': {
    'en':
        'Video lessons, quizzes, flashcards, and progress tracking — built to help you learn step by step.',
    'ar':
        'دروس فيديو، اختبارات، بطاقات تعليمية، وتتبّع للتقدم — صُمم لمساعدتك على التعلم خطوة بخطوة.',
    'fr':
        'Leçons vidéo, quiz, flashcards et suivi de progression — pour apprendre étape par étape.',
  },
  'featureWatchListenRead': {
    'en': 'Watch, listen, or read',
    'ar': 'شاهد أو استمع أو اقرأ',
    'fr': 'Regarder, écouter ou lire',
  },
  'featureWatchListenReadDetail': {
    'en': 'Video · Audio · Reading',
    'ar': 'فيديو · صوت · قراءة',
    'fr': 'Vidéo · Audio · Lecture',
  },
  'featurePracticeReview': {
    'en': 'Practice and review',
    'ar': 'تدرّب وراجع',
    'fr': 'S\'exercer et réviser',
  },
  'featurePracticeReviewDetail': {
    'en': 'Flashcards · Quizzes · Slides',
    'ar': 'بطاقات تعليمية · اختبارات · شرائح',
    'fr': 'Flashcards · Quiz · Diapositives',
  },
  'featureTrackProgress': {
    'en': 'Track your progress',
    'ar': 'تابع تقدّمك',
    'fr': 'Suivre votre progression',
  },
  'featureTrackProgressDetail': {
    'en': 'Pick up where you left off',
    'ar': 'استمر من حيث توقفت',
    'fr': 'Reprenez où vous vous êtes arrêté',
  },

  // ── Landing / pricing screen ─────────────────────────────────────────────
  'choosePlan': {
    'en': 'Choose your plan',
    'ar': 'اختر خطتك',
    'fr': 'Choisissez votre formule',
  },
  'purchaseCancelled': {
    'en': 'Purchase cancelled.',
    'ar': 'تم إلغاء الشراء.',
    'fr': 'Achat annulé.',
  },
  'noPurchasesToRestore': {
    'en': 'No previous purchases found to restore.',
    'ar': 'لم يتم العثور على مشتريات سابقة للاسترجاع.',
    'fr': 'Aucun achat précédent à restaurer.',
  },
  'jazakAllahKhayran': {
    'en': 'JazakAllahu Khayran!',
    'ar': 'جزاك الله خيرًا!',
    'fr': 'JazakAllahu Khayran !',
  },
  'purchaseSuccessBody': {
    'en':
        'Your purchase was successful. Full access has been unlocked. May Allah bless your learning.',
    'ar': 'تم شراؤك بنجاح. تم فتح الوصول الكامل. بارك الله في تعلّمك.',
    'fr':
        'Votre achat a réussi. L\'accès complet est débloqué. Qu\'Allah bénisse votre apprentissage.',
  },
  'startLearning': {
    'en': 'Start Learning',
    'ar': 'ابدأ التعلم',
    'fr': 'Commencer à apprendre',
  },
  'whatsIncluded': {'en': "What's included", 'ar': 'ما الذي يشمله'},
  'includedVideos': {
    'en': '100 structured video lessons',
    'ar': '١٠٠ درس فيديو منظّم',
    'fr': '100 leçons vidéo structurées',
  },
  'includedNotes': {
    'en': 'Reading notes & briefings',
    'ar': 'ملاحظات قراءة وموجزات',
    'fr': 'Notes de lecture et briefings',
  },
  'includedQuizzes': {
    'en': 'Quizzes & flashcards',
    'ar': 'اختبارات وبطاقات تعليمية',
    'fr': 'Quiz et flashcards',
  },
  'includedLifetime': {
    'en': 'Cancel anytime',
    'ar': 'يمكن الإلغاء في أي وقت',
    'fr': 'Annulez à tout moment',
  },
  'includedProgress': {
    'en': 'Progress tracking',
    'ar': 'تتبّع التقدم',
    'fr': 'Suivi de progression',
  },
  'couldNotStartCheckout': {
    'en': 'Could not start checkout. Please try again.',
    'ar': 'تعذّر بدء الدفع. حاول مرة أخرى.',
    'fr': 'Impossible de démarrer le paiement. Veuillez réessayer.',
  },
  'purchaseAlreadyProcessing': {
    'en':
        'A purchase is already being processed. Please wait for it to finish.',
    'ar': 'يتم معالجة عملية شراء بالفعل. يرجى الانتظار حتى تنتهي.',
    'fr': 'Un achat est déjà en cours. Veuillez patienter.',
  },
  'noAccountRequired': {
    'en': 'No account required to purchase. Tap a plan to buy.',
    'ar': 'لا حاجة لحساب للشراء. اضغط على خطة للشراء.',
    'fr': 'Aucun compte requis pour acheter. Touchez une formule pour acheter.',
  },
  'restorePurchases': {
    'en': 'Restore Purchases',
    'ar': 'استرجاع المشتريات',
    'fr': 'Restaurer les achats',
  },
  'alreadyLearningSignIn': {
    'en': 'Already learning on another device? Sign in',
    'ar': 'تتعلّم بالفعل على جهاز آخر؟ سجّل الدخول',
    'fr': 'Vous apprenez déjà sur un autre appareil ? Connectez-vous',
  },
  'alreadyLearningPrompt': {
    'en': 'Already learning on another device?',
    'ar': 'تتعلّم بالفعل على جهاز آخر؟',
    'fr': 'Vous apprenez déjà sur un autre appareil ?',
  },
  'planMonthly': {'en': 'Monthly', 'ar': 'شهري', 'fr': 'Mensuel'},
  'planLifetime': {'en': 'Lifetime', 'ar': 'مدى الحياة', 'fr': 'À vie'},
  'mostPopular': {
    'en': 'Popular',
    'ar': 'رائج',
    'fr': 'Populaire',
    'id': 'Populer',
    'ms': 'Popular',
    'zh': '热门',
    'ru': 'Популярно',
    'sw': 'Maarufu',
    'es': 'Popular',
    'de': 'Beliebt',
    'tr': 'Popüler',
    'hi': 'लोकप्रिय',
    'ur': 'مقبول',
    'bn': 'জনপ্রিয়',
    'fa': 'محبوب',
  },
  // Lifetime plan badge. Kept in this map for every course language so the
  // other 12 don't fall through to English.
  'recommended': {
    'en': 'Keep Forever',
    'ar': 'احتفظ به للأبد',
    'fr': 'Gardez-le pour toujours',
    'id': 'Simpan Selamanya',
    'ms': 'Simpan Selamanya',
    'zh': '永久保留',
    'ru': 'Оставьте навсегда',
    'sw': 'Weka Milele',
    'es': 'Consérvalo para siempre',
    'de': 'Für immer behalten',
    'tr': 'Sonsuza Kadar Sakla',
    'hi': 'हमेशा के लिए रखें',
    'ur': 'ہمیشہ کے لیے رکھیں',
    'bn': 'চিরকালের জন্য রাখুন',
    'fa': 'برای همیشه نگه دارید',
  },
  'oneLearnerPayOnce': {
    'en': '1 learner • pay once, own forever',
    'ar': 'متعلّم واحد • دفعة واحدة، امتلاك دائم',
    'fr': '1 apprenant • payer une fois, pour toujours',
  },
  'oneLearnerCancelAnytime': {
    'en': '1 learner • cancel anytime',
    'ar': 'متعلّم واحد • إلغاء في أي وقت',
    'fr': '1 apprenant • annuler à tout moment',
  },
  'payOnce': {'en': 'pay once', 'ar': 'دفعة واحدة', 'fr': 'payer une fois'},
  'perMonth': {'en': '/month', 'ar': '/شهر', 'fr': '/mois'},
  'instantAccess': {
    'en': 'Instant access',
    'ar': 'وصول فوري',
    'fr': 'Accès immédiat',
  },
  'cancelAnytime': {
    'en': 'Cancel anytime',
    'ar': 'إلغاء في أي وقت',
    'fr': 'Annuler à tout moment',
  },
  // Trust-badge pill used instead of "cancelAnytime" next to the Lifetime
  // plan specifically — there's nothing to "cancel" on a one-time,
  // non-renewing purchase, so that wording was a leftover from when this
  // screen also offered monthly plans.
  'oneTimePayment': {
    'en': 'One-time payment',
    'ar': 'دفعة واحدة',
    'fr': 'Paiement unique',
  },
  // Button label inside the plan card — gives the purchase action an
  // unmistakable, explicit tap target instead of relying on the whole row
  // being tappable with only a small trailing chevron as the cue.
  'getFullAccess': {
    'en': 'Get Full Access',
    'ar': 'احصل على الوصول الكامل',
    'fr': 'Obtenir l\'accès complet',
  },
  // Headline the plan screens lead with — replaces the generic "Choose your
  // plan" title so the page opens on the value proposition instead of a
  // label. ﷺ is the Arabic honorific for the Prophet Muhammad.
  // All 9 entries below are hand-translated for all 15 supported course
  // languages (see kCourseLangOptions in course_langs.dart) rather than
  // left to the auto-translation fallback in t(): these are brand-new
  // strings (or, for planScreenSubtitle, a changed English source string)
  // that cannot already exist in the generated assets/i18n/*.json phrase
  // packs, which only translate English text that existed at generation
  // time. Without an explicit entry here, t() would silently render these
  // in English for every language below except ar/fr.
  'planHeadline': {
    'en': "Learn the Prophet's ﷺ life, in order.",
    'ar': 'تعرّف على سيرة النبي ﷺ بالترتيب.',
    'fr': "Découvrez la vie du Prophète ﷺ, dans l'ordre.",
    'id': 'Pelajari kehidupan Nabi ﷺ secara berurutan.',
    'ms': 'Pelajari kehidupan Nabi ﷺ secara tersusun.',
    'zh': '按顺序学习先知ﷺ的生平。',
    'ru': 'Изучайте жизнь Пророка ﷺ по порядку.',
    'sw': 'Jifunze maisha ya Mtume ﷺ kwa mpangilio.',
    'es': 'Aprende la vida del Profeta ﷺ en orden.',
    'de': 'Lerne das Leben des Propheten ﷺ in der richtigen Reihenfolge.',
    'tr': 'Peygamberimizin ﷺ hayatını sırasıyla öğrenin.',
    'hi': 'पैगंबर ﷺ के जीवन को क्रम से सीखें।',
    'ur': 'نبی ﷺ کی زندگی کو ترتیب سے سیکھیں۔',
    'bn': 'নবী ﷺ-এর জীবন ক্রমানুসারে শিখুন।',
    'fa': 'زندگی پیامبر ﷺ را به ترتیب بیاموزید.',
  },
  // Short value-proposition line shown under [planHeadline] so the page
  // leads with what the learner gets, not straight into the plan rows.
  'planScreenSubtitle': {
    'en': 'The complete 100-part Seerah course',
    'ar': 'دورة السيرة الكاملة المكوّنة من ١٠٠ جزء',
    'fr': 'Le cours complet de la Sira en 100 parties',
    'id': 'Kursus Seerah lengkap, 100 bagian',
    'ms': 'Kursus Seerah lengkap, 100 bahagian',
    'zh': '完整的100集先知传记课程',
    'ru': 'Полный курс Сиры из 100 частей',
    'sw': 'Kozi kamili ya Seerah ya sehemu 100',
    'es': 'El curso completo de la Seerah en 100 partes',
    'de': 'Der komplette Seerah-Kurs mit 100 Teilen',
    'tr': '100 bölümden oluşan eksiksiz Siyer kursu',
    'hi': 'संपूर्ण 100-भागों वाला सीरह कोर्स',
    'ur': 'مکمل 100 حصوں پر مشتمل سیرت کورس',
    'bn': 'সম্পূর্ণ ১০০-পর্বের সীরাহ কোর্স',
    'fa': 'دوره کامل سیره در ۱۰۰ بخش',
  },
  // Three compact benefit chips shown above the plan rows — the redesigned
  // page states what the learner gets before the price, rather than after.
  'benefitVideos': {
    'en': 'Video lessons & visual summaries',
    'ar': 'دروس فيديو وملخصات مرئية',
    'fr': 'Leçons vidéo et résumés visuels',
    'id': 'Pelajaran video & ringkasan visual',
    'ms': 'Pelajaran video & ringkasan visual',
    'zh': '视频课程与图文摘要',
    'ru': 'Видеоуроки и наглядные сводки',
    'sw': 'Masomo ya video na muhtasari wa picha',
    'es': 'Lecciones en video y resúmenes visuales',
    'de': 'Videolektionen & visuelle Zusammenfassungen',
    'tr': 'Video dersler ve görsel özetler',
    'hi': 'वीडियो पाठ और विज़ुअल सारांश',
    'ur': 'ویڈیو اسباق اور تصویری خلاصے',
    'bn': 'ভিডিও পাঠ এবং ভিজ্যুয়াল সারসংক্ষেপ',
    'fa': 'درس‌های ویدیویی و خلاصه‌های تصویری',
  },
  'benefitFlashcards': {
    'en': 'Flashcards & quizzes',
    'ar': 'بطاقات تعليمية واختبارات',
    'fr': 'Flashcards et quiz',
    'id': 'Kartu hafalan & kuis',
    'ms': 'Kad imbas & kuiz',
    'zh': '闪卡与测验',
    'ru': 'Карточки и тесты',
    'sw': 'Kadi za kukariri na maswali',
    'es': 'Tarjetas didácticas y cuestionarios',
    'de': 'Lernkarten & Quizze',
    'tr': 'Bilgi kartları ve testler',
    'hi': 'फ्लैशकार्ड और क्विज़',
    'ur': 'فلیش کارڈز اور کوئزز',
    'bn': 'ফ্ল্যাশকার্ড এবং কুইজ',
    'fa': 'فلش‌کارت‌ها و آزمون‌ها',
  },
  'benefit15Languages': {
    'en': '15 languages',
    'ar': '١٥ لغة',
    'fr': '15 langues',
    'id': '15 bahasa',
    'ms': '15 bahasa',
    'zh': '15种语言',
    'ru': '15 языков',
    'sw': 'Lugha 15',
    'es': '15 idiomas',
    'de': '15 Sprachen',
    'tr': '15 dil',
    'hi': '15 भाषाएं',
    'ur': '15 زبانیں',
    'bn': '১৫টি ভাষা',
    'fa': '۱۵ زبان',
  },
  // Caption under the compact Lifetime plan row specifically — kept off the
  // Monthly row, which uses the existing [cancelAnytime] string instead, so
  // each plan's own promise isn't implied to apply to both.
  'lifetimeAccessCaption': {
    'en': 'Lifetime access',
    'ar': 'وصول مدى الحياة',
    'fr': 'Accès à vie',
    'id': 'Akses selamanya',
    'ms': 'Akses sepanjang hayat',
    'zh': '终身访问',
    'ru': 'Доступ навсегда',
    'sw': 'Ufikiaji wa maisha yote',
    'es': 'Acceso de por vida',
    'de': 'Lebenslanger Zugang',
    'tr': 'Ömür boyu erişim',
    'hi': 'जीवनभर एक्सेस',
    'ur': 'تاحیات رسائی',
    'bn': 'লাইফটাইম অ্যাক্সেস',
    'fa': 'دسترسی مادام‌العمر',
  },
  // Suffix appended directly after the store-formatted Lifetime price, e.g.
  // "$48.99 once" — mirrors how [perMonth] suffixes the Monthly price.
  'onceSuffix': {
    'en': 'once',
    'ar': 'دفعة واحدة',
    'fr': 'une fois',
    'id': 'sekali',
    'ms': 'sekali',
    'zh': '一次性',
    'ru': 'единоразово',
    'sw': 'mara moja',
    'es': 'pago único',
    'de': 'einmalig',
    'tr': 'tek seferlik',
    'hi': 'एकमुश्त',
    'ur': 'یک بار',
    'bn': 'একবার',
    'fa': 'یک‌بار',
  },
  // Single shared CTA button below the two compact plan rows — its label
  // switches with whichever row is currently selected.
  'getLifetimeAccessCta': {
    'en': 'Get Lifetime Access',
    'ar': 'احصل على الوصول مدى الحياة',
    'fr': "Obtenir l'accès à vie",
    'id': 'Dapatkan Akses Selamanya',
    'ms': 'Dapatkan Akses Sepanjang Hayat',
    'zh': '获取终身访问权限',
    'ru': 'Получить доступ навсегда',
    'sw': 'Pata Ufikiaji wa Maisha Yote',
    'es': 'Obtener acceso de por vida',
    'de': 'Lebenslangen Zugang erhalten',
    'tr': 'Ömür Boyu Erişim Al',
    'hi': 'लाइफटाइम एक्सेस प्राप्त करें',
    'ur': 'تاحیات رسائی حاصل کریں',
    'bn': 'লাইফটাইম অ্যাক্সেস নিন',
    'fa': 'دریافت دسترسی مادام‌العمر',
  },
  'subscribeMonthlyCta': {
    'en': 'Subscribe Monthly',
    'ar': 'اشترك شهريًا',
    'fr': "S'abonner mensuellement",
    'id': 'Berlangganan Bulanan',
    'ms': 'Melanggan Bulanan',
    'zh': '按月订阅',
    'ru': 'Оформить подписку помесячно',
    'sw': 'Jisajili kwa Mwezi',
    'es': 'Suscribirse mensualmente',
    'de': 'Monatlich abonnieren',
    'tr': 'Aylık Abone Ol',
    'hi': 'मासिक सब्सक्राइब करें',
    'ur': 'ماہانہ سبسکرائب کریں',
    'bn': 'মাসিক সাবস্ক্রাইব করুন',
    'fa': 'اشتراک ماهانه',
  },
  'watchPart1': {
    'en': 'Watch the First Revelation',
    'ar': 'شاهد الوحي الأول',
    'fr': 'Regarder la Première Révélation',
  },
  'part1NoAccountNeeded': {
    'en': 'The First Revelation · No account needed',
    'ar': 'الوحي الأول · لا حاجة لحساب',
    'fr': 'La Première Révélation · Aucun compte requis',
  },
  'part1AlwaysFree': {
    'en': 'The First Revelation — Always Free',
    'ar': 'الوحي الأول — مجاني دائمًا',
    'fr': 'La Première Révélation — Toujours gratuite',
  },
  'chooseYourPlan': {
    'en': 'Choose Your Plan',
    'ar': 'اختر خطتك',
    'fr': 'Choisissez votre formule',
  },
  'youHaveFullAccess': {
    'en': 'You have full access to the course',
    'ar': 'لديك وصول كامل إلى الدورة',
    'fr': 'You have full access to the course',
  },
  'couldNotRestore': {
    'en': 'Could not restore. Please try again.',
    'ar': 'تعذّر الاسترجاع. حاول مرة أخرى.',
    'fr': 'Could not restore. Please try again.',
  },
  'refundInstantCancel': {
    'en': '{refund}  ·  Instant access  ·  One-time payment',
    'ar': '{refund}  ·  وصول فوري  ·  دفعة واحدة',
    'fr': '{refund}  ·  Instant access  ·  One-time payment',
  },
  'included100Videos': {
    'en': '100 structured video lessons',
    'ar': '١٠٠ درس فيديو منظّم',
    'fr': '100 structured video lessons',
  },
  'includedReadingNotes': {
    'en': 'Reading notes & briefings',
    'ar': 'ملاحظات قرائية وموجزات',
    'fr': 'Reading notes & briefings',
  },
  'includedQuizzesFlashcards': {
    'en': 'Quizzes & flashcards',
    'ar': 'اختبارات وبطاقات تعليمية',
    'fr': 'Quizzes & flashcards',
  },
  'includedProgress8Eras': {
    'en': 'Progress tracking across all 8 eras',
    'ar': 'تتبّع التقدم عبر جميع العصور الثمانية',
    'fr': 'Progress tracking across all 8 eras',
  },
  'includedSlidesMindmaps': {
    'en': 'Slides, mindmaps, and infographics',
    'ar': 'شرائح وإنفوغرافيك',
    'fr': 'Diapositives et infographies',
  },
  'includedLifetimeOption': {
    'en': 'Lifetime access option available',
    'ar': 'خيار الوصول مدى الحياة متوفر',
    'fr': 'Lifetime access option available',
  },
  'includedCancelAnytime': {
    'en': 'Cancel anytime, no lock-in',
    'ar': 'ألغِ في أي وقت، بلا التزام',
    'fr': 'Annulez à tout moment, sans engagement',
  },
  'monthlyVsLifetime': {
    'en': 'Monthly vs lifetime',
    'ar': 'شهري مقابل مدى الحياة',
    'fr': 'Monthly vs lifetime',
  },
  'lowerUpfrontCost': {
    'en': 'Lower upfront cost',
    'ar': 'تكلفة أولية أقل',
    'fr': 'Lower upfront cost',
  },
  'cancelFromStoreAccount': {
    'en': 'Cancel anytime from your store account',
    'ar': 'إلغاء في أي وقت من حساب متجرك',
    'fr': 'Cancel anytime from your store account',
  },
  'payOnceKeepForever': {
    'en': 'Pay once, keep access forever',
    'ar': 'ادفع مرة واحدة واحتفظ بالوصول للأبد',
    'fr': 'Pay once, keep access forever',
  },
  'oneTime': {'en': 'one-time', 'ar': 'دفعة واحدة', 'fr': 'one-time'},
  'only': {
    'en': 'Only',
    'ar': 'فقط',
    'fr': 'Seulement',
    'id': 'Hanya',
    'ms': 'Hanya',
    'zh': '只要',
    'ru': 'Всего',
    'sw': 'Tu',
    'es': 'Solo',
    'de': 'Nur',
    'tr': 'Sadece',
    'hi': 'सिर्फ़',
    'ur': 'صرف',
    'bn': 'মাত্র',
    'fa': 'فقط',
  },
  'bestLongTermValue': {
    'en': 'Best long-term value if you plan to study for years',
    'ar': 'أفضل قيمة على المدى الطويل إن كنت تخطط للدراسة لسنوات',
    'fr': 'Best long-term value if you plan to study for years',
  },
  'wantToPreviewFirst': {
    'en': 'Want to preview first?',
    'ar': 'تريد معاينة أولًا؟',
    'fr': 'Want to preview first?',
  },
  'watchPart1FreeNoPurchase': {
    'en': 'Watch the First Revelation — Free. No purchase needed',
    'ar': 'شاهد الوحي الأول — مجانًا. لا حاجة للشراء',
    'fr': 'Regardez la Première Révélation — gratuitement. Aucun achat requis',
  },
  'pricingQuestions': {
    'en': 'Pricing questions',
    'ar': 'أسئلة حول التسعير',
    'fr': 'Pricing questions',
  },
  'faqWhatIncludedQ': {
    'en': 'What is included?',
    'ar': 'ما الذي يشمله الاشتراك؟',
    'fr': 'What is included?',
  },
  'faqWhatIncludedA': {
    'en':
        'Every plan includes the full 100-part Seerah course with video lessons, readings, quizzes, flashcards, summaries, mind maps, and progress tracking.',
    'ar':
        'تشمل كل خطة دورة السيرة الكاملة المكوّنة من ١٠٠ جزء مع دروس فيديو وقراءات واختبارات وبطاقات تعليمية وملخصات وخرائط ذهنية وتتبّع للتقدم.',
    'fr':
        'Every plan includes the full 100-part Seerah course with video lessons, readings, quizzes, flashcards, summaries, mind maps, and progress tracking.',
  },
  'faqCancelAnytimeQ': {
    'en': 'Can I cancel anytime?',
    'ar': 'هل يمكنني الإلغاء في أي وقت؟',
    'fr': 'Can I cancel anytime?',
  },
  'faqCancelAnytimeA': {
    'en':
        'Existing monthly subscriptions can still be canceled anytime from your App Store or Google Play settings. New purchases are lifetime only.',
    'ar':
        'لا يزال بإمكانك إلغاء الاشتراكات الشهرية الحالية في أي وقت من إعدادات متجر آبل أو جوجل بلاي. المشتريات الجديدة مدى الحياة فقط.',
    'fr':
        'Existing monthly subscriptions can still be canceled anytime from your App Store or Google Play settings. New purchases are lifetime only.',
  },
  'faqRefundGuaranteeQ': {
    'en': 'Is there a refund guarantee?',
    'ar': 'هل هناك ضمان استرجاع الأموال؟',
    'fr': 'Is there a refund guarantee?',
  },
  'faqPart1FreeQ': {
    'en': 'Is there a free preview?',
    'ar': 'هل هناك معاينة مجانية؟',
    'fr': 'Y a-t-il un aperçu gratuit ?',
  },
  'faqPart1FreeA': {
    'en':
        'Yes. The First Revelation is completely free with no account required. Watch it before choosing a plan.',
    'ar':
        'نعم. الوحي الأول مجاني تمامًا ولا يتطلب حسابًا. شاهده قبل اختيار خطة.',
    'fr':
        'Oui. La Première Révélation est entièrement gratuite, sans compte requis. Regardez-la avant de choisir un plan.',
  },
  'faqMonthlyVsLifetimeQ': {
    'en': "What's the difference between monthly and lifetime?",
    'ar': 'ما الفرق بين الخطة الشهرية والخطة مدى الحياة؟',
  },
  'faqMonthlyVsLifetimeA': {
    'en':
        'New purchases are lifetime only — pay once, access forever. Existing monthly subscribers keep their plan until they cancel or upgrade.',
    'ar':
        'المشتريات الجديدة مدى الحياة فقط — دفعة واحدة، وصول للأبد. مشتركو الخطط الشهرية الحاليون يحتفظون بخطتهم حتى الإلغاء أو الترقية.',
    'fr':
        'Les nouveaux achats sont à vie uniquement — un paiement, un accès pour toujours. Les abonnés mensuels existants gardent leur formule jusqu’à l’annulation ou le passage à vie.',
  },
  'checkConnectionRetrySupport': {
    'en':
        'Check your internet connection, then tap Retry. If this keeps happening, contact support@themuslimman.com.',
    'ar':
        'تحقق من اتصالك بالإنترنت، ثم اضغط إعادة المحاولة. إذا استمرت المشكلة، تواصل مع support@themuslimman.com.',
    'fr':
        'Check your internet connection, then tap Retry. If this keeps happening, contact support@themuslimman.com.',
  },
  'videoPlaybackError': {
    'en': 'Video playback error. Please check your connection and try again.',
    'ar': 'خطأ في تشغيل الفيديو. تحقق من اتصالك وحاول مرة أخرى.',
    'fr': 'Video playback error. Please check your connection and try again.',
  },
  'checkConnectionRetry': {
    'en':
        'Check your internet connection, then tap Retry. If this keeps happening, contact support@themuslimman.com.',
    'ar':
        'تحقق من اتصالك بالإنترنت، ثم اضغط على إعادة المحاولة. إذا استمرت المشكلة، تواصل مع support@themuslimman.com.',
    'fr':
        'Check your internet connection, then tap Retry. If this keeps happening, contact support@themuslimman.com.',
  },

  // ── Login / Signup ───────────────────────────────────────────────────────
  'signInToSeerah': {
    'en': 'Sign in to Seerah',
    'ar': 'سجّل الدخول إلى السيرة',
    'fr': 'Sign in to Seerah',
  },
  'signInOnlyIfAccess': {
    'en':
        'Sign in only if you already have access on another device. Purchasing does not require an account.',
    'ar':
        'سجّل الدخول فقط إذا كان لديك وصول بالفعل على جهاز آخر. الشراء لا يتطلب حسابًا.',
    'fr':
        'Sign in only if you already have access on another device. Purchasing does not require an account.',
  },
  'email': {'en': 'Email', 'ar': 'البريد الإلكتروني', 'fr': 'Email'},
  'password': {'en': 'Password', 'ar': 'كلمة المرور', 'fr': 'Password'},
  'enterValidEmail': {
    'en': 'Enter a valid email',
    'ar': 'أدخل بريدًا إلكترونيًا صحيحًا',
    'fr': 'Enter a valid email',
  },
  'passwordMinChars': {
    'en': 'Password must be at least 8 characters',
    'ar': 'يجب أن تتكون كلمة المرور من ٨ أحرف على الأقل',
    'fr': 'Password must be at least 8 characters',
  },
  'forgotPassword': {
    'en': 'Forgot password?',
    'ar': 'نسيت كلمة المرور؟',
    'fr': 'Forgot password?',
  },
  'purchaseOnThisDevice': {
    'en': 'Purchase on this device',
    'ar': 'الشراء على هذا الجهاز',
    'fr': 'Purchase on this device',
  },
  'guestHasAccessWarning': {
    'en':
        'This guest session already has course access. Signing into a different account will leave that purchase on the guest.\n\nCreate an account instead to keep your purchase, or cancel.',
    'ar':
        'تحتوي جلسة الضيف هذه على وصول للدورة بالفعل. تسجيل الدخول بحساب مختلف سيترك هذا الشراء مع الضيف.\n\nأنشئ حسابًا بدلًا من ذلك للحفاظ على شرائك، أو ألغِ العملية.',
    'fr':
        'This guest session already has course access. Signing into a different account will leave that purchase on the guest.\n\nCreate an account instead to keep your purchase, or cancel.',
  },
  'createAccount': {
    'en': 'Create Account',
    'ar': 'إنشاء حساب',
    'fr': 'Create Account',
  },
  'wantToPurchaseNoAccount': {
    'en': 'Want to purchase? No account needed — view plans',
    'ar': 'تريد الشراء؟ لا حاجة لحساب — عرض الخطط',
    'fr': 'Want to purchase? No account needed — view plans',
  },
  'createYourAccount': {
    'en': 'Create Your Account',
    'ar': 'أنشئ حسابك',
    'fr': 'Create Your Account',
  },
  'saveYourProgress': {
    'en': 'Save Your Progress',
    'ar': 'حفظ تقدّمك',
    'fr': 'Save Your Progress',
  },
  'familyPlanConfirmedBody': {
    'en':
        'Your Family plan is confirmed. Create an account — anyone in your household can sign in with it and add their own learner profile (up to 5).',
    'ar':
        'تم تأكيد خطتك العائلية. أنشئ حسابًا — يمكن لأي فرد في منزلك تسجيل الدخول به وإضافة ملفه التعليمي الخاص (حتى ٥).',
    'fr':
        'Your Family plan is confirmed. Create an account — anyone in your household can sign in with it and add their own learner profile (up to 5).',
  },
  'purchaseConfirmedCreateAccount': {
    'en':
        'Your purchase is confirmed. Create an account so you can sign in on Android, iOS, and the website.',
    'ar':
        'تم تأكيد شرائك. أنشئ حسابًا لتتمكن من تسجيل الدخول على أندرويد وآيفون والموقع.',
    'fr':
        'Your purchase is confirmed. Create an account so you can sign in on Android, iOS, and the website.',
  },
  'createAccountAnyDevice': {
    'en': 'Create an account to access your course from any device.',
    'ar': 'أنشئ حسابًا للوصول إلى دورتك من أي جهاز.',
    'fr': 'Create an account to access your course from any device.',
  },
  'fullName': {'en': 'Full Name', 'ar': 'الاسم الكامل', 'fr': 'Full Name'},
  'enterYourName': {
    'en': 'Enter your name',
    'ar': 'أدخل اسمك',
    'fr': 'Enter your name',
  },
  'signInInstead': {
    'en': 'Sign In Instead',
    'ar': 'سجّل الدخول بدلًا من ذلك',
    'fr': 'Sign In Instead',
  },
  'skipForNow': {'en': 'Skip for now', 'ar': 'تخطّ الآن', 'fr': 'Skip for now'},
  'alreadyHaveAccount': {
    'en': 'Already have an account?',
    'ar': 'لديك حساب بالفعل؟',
    'fr': 'Already have an account?',
  },
  'signInLower': {'en': 'Sign in', 'ar': 'سجّل الدخول', 'fr': 'Sign in'},
  'agreeTermsPrefix': {
    'en':
        'By continuing you agree to our Terms of Use (EULA) and Privacy Policy.',
    'ar': 'بالمواصلة، فإنك توافق على شروط الاستخدام وسياسة الخصوصية.',
    'fr':
        'By continuing you agree to our Terms of Use (EULA) and Privacy Policy.',
  },
  'byContinuingYouAgreeToOur': {
    'en': 'By continuing you agree to our ',
    'ar': 'بالمواصلة، فإنك توافق على ',
    'fr': 'By continuing you agree to our ',
  },
  'andConnector': {'en': ' and ', 'ar': ' و ', 'fr': ' and '},
  'termsOfUse': {
    'en': 'Terms of Use (EULA)',
    'ar': 'شروط الاستخدام',
    'fr': 'Terms of Use (EULA)',
  },
  'privacyPolicy': {
    'en': 'Privacy Policy',
    'ar': 'سياسة الخصوصية',
    'fr': 'Privacy Policy',
  },
  'couldntSendVerification': {
    'en': "Couldn't send verification email",
    'ar': 'تعذّر إرسال بريد التحقق',
  },
  'checkYourEmail': {
    'en': 'Check your email',
    'ar': 'تحقق من بريدك الإلكتروني',
    'fr': 'Check your email',
  },
  'gotIt': {'en': 'Got it', 'ar': 'حسنًا', 'fr': 'Got it'},
  'verifyEmailFailedBody': {
    'en':
        "Your account was created, but we couldn't send a verification email to {email} right now. The First Revelation is free to explore right away, and if you purchase a plan we'll verify your email automatically — otherwise, use \"Resend Email\" from your profile once you're signed in.",
    'ar':
        'تم إنشاء حسابك، ولكن تعذّر إرسال بريد التحقق إلى {email} الآن. الوحي الأول مجاني للاستكشاف فورًا، وإذا اشتريت خطة سنتحقق من بريدك تلقائيًا — وإلا، استخدم "إعادة إرسال البريد" من ملفك الشخصي بعد تسجيل الدخول.',
  },
  'verifyEmailSentBody': {
    'en':
        "We've sent a verification link to {email}. The First Revelation is free to explore right away. If you purchase a plan before verifying, we'll verify your email for you automatically — otherwise, click the link so you can also sign in from other devices.",
    'ar':
        'أرسلنا رابط تحقق إلى {email}. الوحي الأول مجاني للاستكشاف فورًا. إذا اشتريت خطة قبل التحقق، سنتحقق من بريدك تلقائيًا — وإلا، اضغط على الرابط لتتمكن من تسجيل الدخول من أجهزة أخرى أيضًا.',
  },
  'showPassword': {
    'en': 'Show password',
    'ar': 'إظهار كلمة المرور',
    'fr': 'Show password',
  },
  'hidePassword': {
    'en': 'Hide password',
    'ar': 'إخفاء كلمة المرور',
    'fr': 'Hide password',
  },
  'forgotPasswordTitle': {
    'en': 'Forgot Password',
    'ar': 'نسيت كلمة المرور',
    'fr': 'Forgot Password',
  },

  // ── Dashboard ────────────────────────────────────────────────────────────
  'profile': {'en': 'Profile', 'ar': 'الملف الشخصي', 'fr': 'Profil'},
  'assalamAlaykum': {
    'en': 'As-salamu alaykum,',
    'ar': 'السلام عليكم،',
    'fr': 'As-salamu alaykum,',
  },
  'student': {'en': 'Student', 'ar': 'طالب', 'fr': 'Student'},
  'dashboardIntro': {
    'en': 'Continue your journey through the life of the Prophet ﷺ.',
    'ar': 'استمر في رحلتك عبر سيرة النبي ﷺ.',
    'fr': 'Continue your journey through the life of the Prophet ﷺ.',
  },
  'dashboardFreeIntro': {
    'en': 'Part 15, The First Revelation, is free — begin the Seerah today.',
    'ar': 'الجزء ١٥، الوحي الأول، مجاني — ابدأ السيرة النبوية اليوم.',
    'fr': 'La partie 15, la Première Révélation, est gratuite — commencez la Sîra dès aujourd\'hui.',
  },
  'freePartStartDescription': {
    'en': 'Begin with the First Revelation — the night in Cave Hira — then follow the Seerah as one connected story.',
    'ar': 'ابدأ بالوحي الأول في غار حراء، ثم تابع السيرة النبوية كقصة متكاملة.',
    'fr': 'Commencez par la Première Révélation, la nuit dans la grotte de Hira, puis suivez la Sîra comme un récit continu.',
  },
  'fullAccess': {'en': 'Full Access', 'ar': 'وصول كامل', 'fr': 'Full Access'},
  'eras': {'en': 'Eras', 'ar': 'العصور', 'fr': 'Eras'},
  'resources': {'en': 'Resources', 'ar': 'الموارد', 'fr': 'Resources'},
  'reference': {'en': 'Reference', 'ar': 'المراجع', 'fr': 'Reference'},
  'references': {
    'en': 'References',
    'ar': 'المراجع',
    'fr': 'Références',
    'es': 'Referencias',
    'de': 'Quellen',
    'tr': 'Kaynaklar',
    'ur': 'حوالہ جات',
    'id': 'Referensi',
    'ms': 'Rujukan',
    'hi': 'संदर्भ',
    'bn': 'তথ্যসূত্র',
    'fa': 'منابع',
    'ru': 'Источники',
    'zh': '参考资料',
    'sw': 'Marejeleo',
  },
  'freeSample': {'en': 'Free sample', 'ar': 'عينة مجانية', 'fr': 'Échantillon gratuit'},
  'continueLearningTitle': {
    'en': 'Continue Learning',
    'ar': 'استمر في التعلم',
    'fr': 'Continue Learning',
  },
  'continueLabel': {'en': 'Continue', 'ar': 'استمر', 'fr': 'Continue'},
  'pickUpWhereLeftOff': {
    'en': 'Pick up where you left off',
    'ar': 'استمر من حيث توقفت',
    'fr': 'Pick up where you left off',
  },
  'startHere': {'en': 'Start here', 'ar': 'ابدأ هنا', 'fr': 'Start here'},
  'freeStartHere': {
    'en': 'Free — Start Here',
    'ar': 'مجاني — ابدأ هنا',
    'fr': 'Free — Start Here',
  },
  'resumeUnlockContinue': {
    'en': 'Resume — Unlock to Continue',
    'ar': 'استمر — افتح الوصول للمواصلة',
    'fr': 'Resume — Unlock to Continue',
  },
  'upNext': {'en': 'Up next', 'ar': 'التالي', 'fr': 'Up next'},
  'quickAccess': {
    'en': 'Quick Access',
    'ar': 'وصول سريع',
    'fr': 'Quick Access',
  },
  'lessons': {'en': 'Lessons', 'ar': 'الدروس', 'fr': 'Leçons'},
  'myProgress': {'en': 'My Progress', 'ar': 'تقدّمي', 'fr': 'My Progress'},
  'unlockAllParts': {
    'en': 'Unlock All {n} Parts',
    'ar': 'افتح جميع الأجزاء ({n})',
    'fr': 'Unlock All {n} Parts',
  },
  'unlockAllPartsBody': {
    'en':
        'Get full access to the Seerah course — videos, reading notes, flashcards, and quizzes for every part.',
    'ar':
        'احصل على وصول كامل لدورة السيرة — فيديوهات، ملاحظات قراءة، بطاقات تعليمية، واختبارات لكل جزء.',
    'fr':
        'Obtenez un accès complet au cours de la Sîra — vidéos, notes de lecture, flashcards et quiz pour chaque partie.',
  },
  'courseOverview': {
    'en': 'Course Overview',
    'ar': 'نظرة عامة على الدورة',
    'fr': 'Course Overview',
  },
  'allErasOfSeerah': {
    'en': 'All {n} eras of the Seerah',
    'ar': 'جميع عصور السيرة ({n})',
    'fr': 'All {n} eras of the Seerah',
  },

  // ── Course screen ────────────────────────────────────────────────────────
  'searchPartsEllipsis': {
    'en': 'Search parts…',
    'ar': 'ابحث عن الأجزاء…',
    'fr': 'Rechercher des parties…',
  },
  'noPartsFound': {
    'en': 'No parts found',
    'ar': 'لم يتم العثور على أجزاء',
    'fr': 'Aucune partie trouvée',
  },
  'tryDifferentSearch': {
    'en': 'Try a different search term or browse by era.',
    'ar': 'حاول استخدام كلمة بحث مختلفة أو تصفّح حسب العصر.',
    'fr': 'Essayez une autre recherche',
  },

  // ── Part hub screen ──────────────────────────────────────────────────────
  'watchPartN': {
    'en': 'Watch — Part {n}',
    'ar': 'شاهد — الجزء {n}',
    'fr': 'Watch — Part {n}',
  },
  'briefingPartN': {
    'en': 'Briefing — Part {n}',
    'ar': 'الموجز — الجزء {n}',
    'fr': 'Briefing — Part {n}',
  },
  'keyFactsPartN': {
    'en': 'Key Facts — Part {n}',
    'ar': 'أهم الحقائق — الجزء {n}',
    'fr': 'Key Facts — Part {n}',
  },
  'readPartN': {
    'en': 'Read — Part {n}',
    'ar': 'اقرأ — الجزء {n}',
    'fr': 'Read — Part {n}',
  },
  'flashcardsPartN': {
    'en': 'Flashcards — Part {n}',
    'ar': 'البطاقات التعليمية — الجزء {n}',
    'fr': 'Flashcards — Part {n}',
  },
  'quizPartN': {
    'en': 'Quiz — Part {n}',
    'ar': 'الاختبار — الجزء {n}',
    'fr': 'Quiz — Part {n}',
  },
  'slidesPartN': {
    'en': 'Slides — Part {n}',
    'ar': 'الشرائح — الجزء {n}',
    'fr': 'Slides — Part {n}',
  },
  'infographicsPartN': {
    'en': 'Infographics — Part {n}',
    'ar': 'الإنفوغرافيك — الجزء {n}',
    'fr': 'Infographics — Part {n}',
  },
  'audioPartN': {
    'en': 'Audio — Part {n}',
    'ar': 'الصوت — الجزء {n}',
    'fr': 'Audio — Part {n}',
  },
  'listenPartN': {
    'en': 'Listen — Part {n}',
    'ar': 'استمع — الجزء {n}',
    'fr': 'Listen — Part {n}',
  },
  'mindmapPartN': {
    'en': 'Mindmap — Part {n}',
    'ar': 'الخريطة الذهنية — الجزء {n}',
    'fr': 'Mindmap — Part {n}',
  },
  'partNotAvailable': {
    'en': "Part {n} isn't available right now. Please try again.",
    'ar': 'الجزء {n} غير متاح حاليًا. حاول مرة أخرى.',
  },
  'assetNotAvailableGeneric': {
    'en': "{title} isn't available right now. Please try again.",
    'ar': '{title} غير متاح حاليًا. حاول مرة أخرى.',
  },
  'notAvailable': {
    'en': 'Not available',
    'ar': 'غير متاح',
    'fr': 'Not available',
  },
  'studyMaterials': {
    'en': 'Study Materials',
    'ar': 'المواد التعليمية',
    'fr': 'Study Materials',
  },
  'watch': {'en': 'Watch', 'ar': 'شاهد', 'fr': 'Watch'},
  'fullVideoLecture': {
    'en': 'Full video lecture',
    'ar': 'محاضرة فيديو كاملة',
    'fr': 'Full video lecture',
  },
  'watchCompleteLesson': {
    'en': 'Watch the complete lesson with visuals',
    'ar': 'شاهد الدرس الكامل مع الرسومات',
    'fr': 'Watch the complete lesson with visuals',
  },
  'listen': {'en': 'Listen', 'ar': 'استمع', 'fr': 'Listen'},
  'audioLesson': {'en': 'Audio lesson', 'ar': 'درس صوتي', 'fr': 'Audio lesson'},
  'read': {'en': 'Read', 'ar': 'اقرأ', 'fr': 'Read'},
  'studyNotes': {
    'en': 'Study notes',
    'ar': 'ملاحظات الدراسة',
    'fr': 'Study notes',
  },
  'slides': {'en': 'Slides', 'ar': 'الشرائح', 'fr': 'Slides'},
  'visualPresentation': {
    'en': 'Visual presentation',
    'ar': 'عرض مرئي',
    'fr': 'Visual presentation',
  },
  'infographics': {
    'en': 'Infographics',
    'ar': 'الإنفوغرافيك',
    'fr': 'Infographics',
  },
  'visualSummary': {
    'en': 'Visual summary',
    'ar': 'ملخص مرئي',
    'fr': 'Visual summary',
  },
  'mindmap': {'en': 'Mindmap', 'ar': 'الخريطة الذهنية', 'fr': 'Mindmap'},
  'visualOverviewConcepts': {
    'en': 'Visual overview of key concepts',
    'ar': 'نظرة مرئية على المفاهيم الأساسية',
    'fr': 'Visual overview of key concepts',
  },
  'practiceReview': {
    'en': 'Practice & Review',
    'ar': 'التدريب والمراجعة',
    'fr': 'Practice & Review',
  },
  'flashcards': {
    'en': 'Flashcards',
    'ar': 'البطاقات التعليمية',
    'fr': 'Flashcards',
  },
  'spacedRepetitionCards': {
    'en': 'Spaced-repetition cards',
    'ar': 'بطاقات التكرار المتباعد',
    'fr': 'Spaced-repetition cards',
  },
  'reviewFlipCards': {
    'en': 'Review key facts with flip cards',
    'ar': 'راجع أهم الحقائق ببطاقات القلب',
    'fr': 'Review key facts with flip cards',
  },
  'quiz': {'en': 'Quiz', 'ar': 'الاختبار', 'fr': 'Quiz'},
  'testYourKnowledge': {
    'en': 'Test your knowledge',
    'ar': 'اختبر معرفتك',
    'fr': 'Test your knowledge',
  },
  'mcqInstantFeedback': {
    'en': 'Multiple-choice questions with instant feedback',
    'ar': 'أسئلة اختيار من متعدد مع تغذية راجعة فورية',
    'fr': 'Multiple-choice questions with instant feedback',
  },
  'continueFullCourse': {
    'en': 'Continue the full {n}-part course',
    'ar': 'استمر في الدورة الكاملة المكوّنة من {n} جزءًا',
    'fr': 'Continue the full {n}-part course',
  },
  'unlockFullAccessBody': {
    'en':
        'You started the path. Unlock the full course for {only} {price}/month to continue the Seerah step by step.',
    'ar':
        'لقد بدأت الطريق. افتح الدورة الكاملة مقابل {only} {price} شهريًا لمواصلة السيرة خطوة بخطوة.',
    'fr':
        'Vous avez commencé le chemin. Débloquez le cours complet pour {only} {price}/mois afin de continuer la Sîra étape par étape.',
  },
  'unlockFullAccessBodyPlain': {
    'en':
        'You started the path. Unlock the full course with a monthly subscription to continue the Seerah step by step.',
    'ar':
        'لقد بدأت الطريق. افتح الدورة الكاملة باشتراك شهري لمواصلة السيرة خطوة بخطوة.',
    'fr':
        'Vous avez commencé le chemin. Débloquez le cours complet avec un abonnement mensuel pour continuer la Sîra étape par étape.',
  },
  'unlockFullAccess': {
    'en': 'Unlock full access',
    'ar': 'افتح الوصول الكامل',
    'fr': 'Unlock full access',
  },
  'getTheFullCourse': {
    'en': 'Get the full course',
    'ar': 'احصل على الدورة كاملة',
    'fr': 'Accéder au cours complet',
  },
  // ── Bottom nav lock dialog (Lessons/Resources/Reference/Progress gated
  // behind a plan for guests/no-access users — Home and Part 15 stay free) ──
  'lockedNavBody': {
    'en':
        'Pick a plan to unlock Lessons, Resources, Reference, and Progress — The First Revelation (Part 15) stays free either way.',
    'ar':
        'اختر خطة لفتح الدروس والموارد والمرجع والتقدم — الوحي الأول (الجزء 15) يبقى مجانيًا على أي حال.',
    'fr':
        'Choisissez une formule pour débloquer Leçons, Ressources, Référence et Progrès — La Première Révélation (Partie 15) reste gratuite.',
  },
  'partN': {'en': 'Part {n}', 'ar': 'الجزء {n}', 'fr': 'Part {n}'},
  'requiresFullAccessBody': {
    'en':
        'This part requires full access.\nUnlock all {n} parts of the Seerah course with a monthly subscription.',
    'ar':
        'يتطلب هذا الجزء وصولًا كاملًا.\nافتح جميع أجزاء دورة السيرة ({n}) باشتراك شهري.',
    'fr':
        'Cette partie nécessite un accès complet.\nDébloquez les {n} parties du cours de la Sîra avec un abonnement mensuel.',
  },
  'lifetimeAccessTitle': {
    'en': 'Lifetime access',
    'ar': 'وصول مدى الحياة',
    'fr': 'Lifetime access',
  },
  'noSubscriptionNoRenewal': {
    'en': 'No subscription. No renewal.',
    'ar': 'بلا اشتراك. بلا تجديد.',
    'fr': 'No subscription. No renewal.',
  },
  'faqIsSubscriptionQ': {
    'en': 'Is this a subscription?',
    'ar': 'هل هذا اشتراك؟',
    'fr': 'Is this a subscription?',
  },
  'faqIsSubscriptionA': {
    'en':
        'No. Lifetime access is {only} {price}. You keep access forever with no renewal.',
    'ar':
        'لا. الوصول مدى الحياة {only} {price}. تحتفظ بالوصول للأبد دون تجديد.',
    'fr':
        'Non. L’accès à vie, c’est {only} {price}. Vous conservez l’accès pour toujours, sans renouvellement.',
  },
  'faqIsSubscriptionAPlain': {
    'en':
        'Your choice — pay monthly (cancel anytime), or pay once for lifetime access with no subscription at all.',
    'ar': 'الخيار لك — ادفع شهريًا (ألغِ في أي وقت)، أو ادفع مرة واحدة للحصول على وصول مدى الحياة بلا أي اشتراك.',
    'fr':
        'À vous de choisir — payez mensuellement (annulez à tout moment), ou payez une seule fois pour un accès à vie sans aucun abonnement.',
  },

  // ── Video tab ────────────────────────────────────────────────────────────
  'unableToLoadVideoConnection': {
    'en': 'Unable to load video.\nPlease check your connection and try again.',
    'ar': 'تعذّر تحميل الفيديو.\nتحقق من اتصالك وحاول مرة أخرى.',
    'fr': 'Unable to load video.\nPlease check your connection and try again.',
  },
  'unableToLoadVideoSub': {
    'en':
        "Unable to load video.\nMake sure you're signed in with an active subscription.",
    'ar': 'تعذّر تحميل الفيديو.\nتأكد من تسجيل الدخول باشتراك فعّال.',
  },
  'videoNotAvailableYet': {
    'en': 'Video not available for this part yet.',
    'ar': 'الفيديو غير متاح لهذا الجزء حتى الآن.',
    'fr': 'Video not available for this part yet.',
  },
  'couldNotInitVideo': {
    'en': 'Could not initialize video player.',
    'ar': 'تعذّر تهيئة مشغّل الفيديو.',
    'fr': 'Could not initialize video player.',
  },
  'videoUnavailable': {
    'en': 'Video unavailable',
    'ar': 'الفيديو غير متاح',
    'fr': 'Video unavailable',
  },

  // ── Read tab ─────────────────────────────────────────────────────────────
  'briefing': {'en': 'Briefing', 'ar': 'الموجز', 'fr': 'Briefing'},
  'studyGuide': {
    'en': 'Study Guide',
    'ar': 'دليل الدراسة',
    'fr': 'Study Guide',
  },
  'keyFacts': {'en': 'Key Facts', 'ar': 'أهم الحقائق', 'fr': 'Key Facts'},
  'failedToLoadContent': {
    'en': 'Failed to load content',
    'ar': 'تعذّر تحميل المحتوى',
    'fr': 'Failed to load content',
  },
  'sectionNotAvailable': {
    'en': '{section} not available for this part',
    'ar': '{section} غير متاح لهذا الجزء',
    'fr': '{section} not available for this part',
  },

  // ── Flashcards tab ───────────────────────────────────────────────────────
  'flashcardsUnavailable': {
    'en': 'Flashcards unavailable',
    'ar': 'البطاقات التعليمية غير متاحة',
    'fr': 'Flashcards unavailable',
  },
  'noFlashcardsForPart': {
    'en': 'No flashcards for this part',
    'ar': 'لا توجد بطاقات تعليمية لهذا الجزء',
    'fr': 'No flashcards for this part',
  },
  'levelLabel': {'en': 'Level:', 'ar': 'المستوى:', 'fr': 'Level:'},
  'easy': {'en': 'Easy', 'ar': 'سهل', 'fr': 'Easy'},
  'medium': {'en': 'Medium', 'ar': 'متوسط', 'fr': 'Medium'},
  'hard': {'en': 'Hard', 'ar': 'صعب', 'fr': 'Hard'},
  'countCards': {'en': '{n} cards', 'ar': '{n} بطاقة', 'fr': '{n} cards'},
  'restart': {'en': 'Restart', 'ar': 'إعادة البدء', 'fr': 'Restart'},
  'question': {'en': 'QUESTION', 'ar': 'السؤال', 'fr': 'QUESTION'},
  'answer': {'en': 'ANSWER', 'ar': 'الإجابة', 'fr': 'ANSWER'},
  'tapToRevealAnswer': {
    'en': 'Tap to reveal answer',
    'ar': 'اضغط لإظهار الإجابة',
    'fr': 'Tap to reveal answer',
  },
  'flipCard': {'en': 'Flip card', 'ar': 'اقلب البطاقة', 'fr': 'Flip card'},
  'showQuestion': {
    'en': 'Show question',
    'ar': 'إظهار السؤال',
    'fr': 'Show question',
  },
  'flashcardAnswer': {
    'en': 'Flashcard answer',
    'ar': 'إجابة البطاقة',
    'fr': 'Flashcard answer',
  },
  'flashcardQuestion': {
    'en': 'Flashcard question',
    'ar': 'سؤال البطاقة',
    'fr': 'Flashcard question',
  },
  'doubleTapShowQuestion': {
    'en': 'Double tap to show question',
    'ar': 'اضغط مرتين لإظهار السؤال',
    'fr': 'Double tap to show question',
  },
  'doubleTapRevealAnswer': {
    'en': 'Double tap to reveal answer',
    'ar': 'اضغط مرتين لإظهار الإجابة',
    'fr': 'Double tap to reveal answer',
  },

  // ── Quiz tab ─────────────────────────────────────────────────────────────
  'quizUnavailable': {
    'en': 'Quiz unavailable',
    'ar': 'الاختبار غير متاح',
    'fr': 'Quiz unavailable',
  },
  'noQuizForPartYet': {
    'en': 'No quiz for this part yet',
    'ar': 'لا يوجد اختبار لهذا الجزء حتى الآن',
    'fr': 'No quiz for this part yet',
  },
  'questionXofY': {
    'en': 'Question {x} of {y}',
    'ar': 'السؤال {x} من {y}',
    'fr': 'Question {x} of {y}',
  },
  'scoreLabel': {'en': 'Score: {n}', 'ar': 'النتيجة: {n}', 'fr': 'Score: {n}'},
  'nextQuestion': {
    'en': 'Next Question',
    'ar': 'السؤال التالي',
    'fr': 'Next Question',
  },
  'seeResults': {'en': 'See Results', 'ar': 'عرض النتائج', 'fr': 'See Results'},
  'submitAnswer': {
    'en': 'Submit Answer',
    'ar': 'إرسال الإجابة',
    'fr': 'Submit Answer',
  },
  'wellDone': {'en': 'Well done!', 'ar': 'أحسنت!', 'fr': 'Well done!'},
  'keepGoing': {'en': 'Keep going!', 'ar': 'واصل التقدم!', 'fr': 'Keep going!'},
  'scoreOutOfCorrect': {
    'en': '{score} out of {total} correct',
    'ar': '{score} من {total} صحيحة',
    'fr': '{score} out of {total} correct',
  },
  'passedWithPct': {
    'en': 'You passed with {pct}%',
    'ar': 'لقد نجحت بنسبة {pct}٪',
    'fr': 'You passed with {pct}%',
  },
  'need80ToPass': {
    'en': 'Need 80% to pass — try again!',
    'ar': 'تحتاج إلى ٨٠٪ للنجاح — حاول مرة أخرى!',
    'fr': 'Need 80% to pass — try again!',
  },

  // ── Slides tab ───────────────────────────────────────────────────────────
  'slidesUnavailable': {
    'en': 'Slides unavailable',
    'ar': 'الشرائح غير متاحة',
    'fr': 'Slides unavailable',
  },
  'noSlidesForDeck': {
    'en': 'No slides for this deck',
    'ar': 'لا توجد شرائح لهذه المجموعة',
    'fr': 'No slides for this deck',
  },
  'presented': {'en': 'Presented', 'ar': 'العرض', 'fr': 'Presented'},
  'detailed': {'en': 'Detailed', 'ar': 'مفصّل', 'fr': 'Detailed'},
  'slideN': {'en': 'Slide {n}', 'ar': 'الشريحة {n}', 'fr': 'Slide {n}'},
  'swipeToNavigate': {
    'en': 'Swipe to navigate',
    'ar': 'اسحب للتنقل',
    'fr': 'Swipe to navigate',
  },

  // ── Audio tab ────────────────────────────────────────────────────────────
  'audioUnavailable': {
    'en': 'Audio unavailable',
    'ar': 'الصوت غير متاح',
    'fr': 'Audio unavailable',
  },
  'audioNotAvailableYet': {
    'en': 'Audio not available for this part yet.',
    'ar': 'الصوت غير متاح لهذا الجزء حتى الآن.',
    'fr': 'Audio not available for this part yet.',
  },
  'audioPlaybackError': {
    'en': 'Audio playback error. Please check your connection and try again.',
    'ar': 'خطأ في تشغيل الصوت. تحقق من اتصالك وحاول مرة أخرى.',
    'fr': 'Audio playback error. Please check your connection and try again.',
  },
  'audioLessonTitle': {
    'en': 'Audio Lesson',
    'ar': 'الدرس الصوتي',
    'fr': 'Audio Lesson',
  },
  'audioLessonListenGo': {
    'en': 'Audio Lesson • Listen on the go',
    'ar': 'درس صوتي • استمع أثناء التنقل',
    'fr': 'Audio Lesson • Listen on the go',
  },
  'rewind15': {
    'en': 'Rewind 15 seconds',
    'ar': 'إرجاع ١٥ ثانية',
    'fr': 'Rewind 15 seconds',
  },
  'play': {'en': 'Play', 'ar': 'تشغيل', 'fr': 'Play'},
  'pause': {'en': 'Pause', 'ar': 'إيقاف مؤقت', 'fr': 'Pause'},
  'forward15': {
    'en': 'Forward 15 seconds',
    'ar': 'تقديم ١٥ ثانية',
    'fr': 'Forward 15 seconds',
  },
  'couldNotLoadAudio': {
    'en': 'Could not load audio.',
    'ar': 'تعذّر تحميل الصوت.',
    'fr': 'Could not load audio.',
  },

  // ── Mindmap tab ──────────────────────────────────────────────────────────
  'pinchToZoom': {
    'en': 'Pinch to zoom',
    'ar': 'قرّب أو بعّد للتكبير',
    'fr': 'Pinch to zoom',
  },
  'mindmapUnavailable': {
    'en': 'Mindmap unavailable',
    'ar': 'الخريطة الذهنية غير متاحة',
    'fr': 'Mindmap unavailable',
  },

  // ── Infographics tab ─────────────────────────────────────────────────────
  'standard': {'en': 'Standard', 'ar': 'قياسي', 'fr': 'Standard'},
  'concise': {'en': 'Concise', 'ar': 'مختصر', 'fr': 'Concise'},
  'bentoGrid': {'en': 'Bento Grid', 'ar': 'شبكة بينتو', 'fr': 'Bento Grid'},
  'infographicsUnavailable': {
    'en': 'Infographics unavailable',
    'ar': 'الإنفوغرافيك غير متاح',
    'fr': 'Infographics unavailable',
  },

  // ── Resources screen ─────────────────────────────────────────────────────
  'deepenUnderstanding': {
    'en': 'Deepen your understanding of the Seerah',
    'ar': 'عمّق فهمك للسيرة النبوية',
    'fr': 'Deepen your understanding of the Seerah',
  },
  'resourceTypesStat': {
    'en': '{n} resource types • {parts} parts each',
    'ar': '{n} نوع من الموارد • {parts} جزءًا لكل نوع',
    'fr': '{n} resource types • {parts} parts each',
  },
  'videos': {'en': 'Videos', 'ar': 'الفيديوهات', 'fr': 'Videos'},
  'watchFullVideoLesson': {
    'en': 'Watch each part as a full video lesson',
    'ar': 'شاهد كل جزء كدرس فيديو كامل',
    'fr': 'Watch each part as a full video lesson',
  },
  'audio': {'en': 'Audio', 'ar': 'الصوت', 'fr': 'Audio'},
  'listenEveryLessonGo': {
    'en': 'Listen to every lesson on the go',
    'ar': 'استمع إلى كل درس أثناء التنقل',
    'fr': 'Listen to every lesson on the go',
  },
  'briefings': {'en': 'Briefings', 'ar': 'الموجزات', 'fr': 'Briefings'},
  'inDepthStudyNotes': {
    'en': 'In-depth study notes for every part',
    'ar': 'ملاحظات دراسة متعمقة لكل جزء',
    'fr': 'In-depth study notes for every part',
  },
  'essentialFactsNumbered': {
    'en': 'Essential facts from each lesson, numbered',
    'ar': 'الحقائق الأساسية من كل درس، مرقّمة',
    'fr': 'Essential facts from each lesson, numbered',
  },
  'detailedSlideDecks': {
    'en': 'Detailed slide decks for every lesson',
    'ar': 'شرائح مفصّلة لكل درس',
    'fr': 'Detailed slide decks for every lesson',
  },
  'visualSummaryEachPart': {
    'en': 'Visual summary for each part',
    'ar': 'ملخص مرئي لكل جزء',
    'fr': 'Visual summary for each part',
  },
  'mindmaps': {'en': 'Mindmaps', 'ar': 'الخرائط الذهنية', 'fr': 'Mindmaps'},
  'visualOverviewsConnecting': {
    'en': 'Visual overviews connecting key concepts',
    'ar': 'نظرات مرئية تربط المفاهيم الأساسية',
    'fr': 'Visual overviews connecting key concepts',
  },
  'spacedRepFlipCards': {
    'en': 'Spaced-repetition flip cards for every lesson',
    'ar': 'بطاقات قلب بالتكرار المتباعد لكل درس',
    'fr': 'Spaced-repetition flip cards for every lesson',
  },
  'quizzes': {'en': 'Quizzes', 'ar': 'الاختبارات', 'fr': 'Quizzes'},
  'testKnowledgeAfterLesson': {
    'en': 'Test your knowledge after each lesson',
    'ar': 'اختبر معرفتك بعد كل درس',
    'fr': 'Test your knowledge after each lesson',
  },
  'nPassed': {'en': '{n} passed', 'ar': '{n} ناجح', 'fr': '{n} passed'},
  'nViewedStudied': {
    'en': '{n} studied',
    'ar': '{n} تمت دراسته',
    'fr': '{n} studied',
  },
  'continueWatching': {
    'en': 'Continue Watching',
    'ar': 'استمر في المشاهدة',
    'fr': 'Continue Watching',
  },
  'nPartsTapToOpen': {
    'en': '{n} parts  •  Tap any part to open {type}',
    'ar': '{n} جزء  •  اضغط على أي جزء لفتح {type}',
    'fr': '{n} parts  •  Tap any part to open {type}',
  },

  // ── Reference screens ────────────────────────────────────────────────────
  'referenceLibrary': {
    'en': 'Reference Library',
    'ar': 'مكتبة المراجع',
    'fr': 'Reference Library',
  },
  'familyHousehold': {
    'en': 'Family & Household',
    'ar': 'الأسرة والبيت',
    'fr': 'Family & Household',
  },
  'wivesChildrenHousehold': {
    'en': 'Wives, children, and household of the Prophet ﷺ',
    'ar': 'زوجات وأبناء وأهل بيت النبي ﷺ',
    'fr': 'Wives, children, and household of the Prophet ﷺ',
  },
  'wivesOfProphet': {
    'en': 'Wives of the Prophet ﷺ (Mothers of the Believers)',
    'ar': 'زوجات النبي ﷺ (أمهات المؤمنين)',
    'fr': 'Wives of the Prophet ﷺ (Mothers of the Believers)',
  },
  'hadChildrenWithProphet': {
    'en': 'Had children with the Prophet ﷺ',
    'ar': 'ولدت للنبي ﷺ أبناءً',
    'fr': 'Had children with the Prophet ﷺ',
  },
  'childrenOfProphet': {
    'en': 'Children of the Prophet ﷺ',
    'ar': 'أبناء النبي ﷺ',
    'fr': 'Children of the Prophet ﷺ',
  },
  'notFound': {'en': 'Not Found', 'ar': 'غير موجود', 'fr': 'Not Found'},
  'sectionNotYetAvailable': {
    'en': 'Section not yet available.',
    'ar': 'القسم غير متاح حتى الآن.',
    'fr': 'Section not yet available.',
  },
  'motherLabel': {
    'en': 'Mother: {name}',
    'ar': 'الأم: {name}',
    'fr': 'Mother: {name}',
  },
  'historicalNote': {
    'en': 'Historical Note',
    'ar': 'ملاحظة تاريخية',
    'fr': 'Historical Note',
  },
  'rayhanaNote': {
    'en':
        'Some scholars counted Rayhana bint Zayd among the wives of the Prophet ﷺ while others considered her differently. Her status is noted here as a matter of historical difference of opinion.',
    'ar':
        'اعتبر بعض العلماء ريحانة بنت زيد من زوجات النبي ﷺ، بينما رأى آخرون غير ذلك. حالتها مذكورة هنا كخلاف تاريخي في الرأي.',
    'fr':
        'Some scholars counted Rayhana bint Zayd among the wives of the Prophet ﷺ while others considered her differently. Her status is noted here as a matter of historical difference of opinion.',
  },
  'timelineOfSeerah': {
    'en': 'Timeline of the Seerah',
    'ar': 'الخط الزمني للسيرة',
    'fr': 'Timeline of the Seerah',
  },
  'datesApproximate': {
    'en': 'Dates before the Hijrah are approximate in the Gregorian calendar.',
    'ar': 'التواريخ قبل الهجرة تقريبية بالتقويم الميلادي.',
    'fr': 'Dates before the Hijrah are approximate in the Gregorian calendar.',
  },
  'keyPeople': {'en': 'Key People', 'ar': 'أبرز الشخصيات', 'fr': 'Key People'},
  'searchPeopleEllipsis': {
    'en': 'Search people…',
    'ar': 'ابحث عن شخصية…',
    'fr': 'Search people…',
  },
  'clearSearch': {
    'en': 'Clear search',
    'ar': 'مسح البحث',
    'fr': 'Clear search',
  },
  'all': {'en': 'All', 'ar': 'الكل', 'fr': 'All'},
  'noResultsFound': {
    'en': 'No results found',
    'ar': 'لم يتم العثور على نتائج',
    'fr': 'No results found',
  },
  'battlesExpeditions': {
    'en': 'Battles and Expeditions',
    'ar': 'الغزوات والسرايا',
    'fr': 'Battles and Expeditions',
  },
  'majorMilitaryEvents': {
    'en': 'Major military events in the life of the Prophet ﷺ',
    'ar': 'أهم الأحداث العسكرية في حياة النبي ﷺ',
    'fr': 'Major military events in the life of the Prophet ﷺ',
  },
  'miraclesAndSigns': {
    'en': 'Miracles and Signs',
    'ar': 'المعجزات والآيات',
    'fr': 'Miracles and Signs',
  },
  'verifiedNarrations': {
    'en':
        "Verified narrations from the Qur'an, Sahih al-Bukhari, and Sahih Muslim only.",
    'ar': 'روايات موثقة من القرآن الكريم وصحيح البخاري وصحيح مسلم فقط.',
  },
  'sourceVerification': {
    'en': 'Source Verification',
    'ar': 'التحقق من المصدر',
    'fr': 'Source Verification',
  },
  'sourceVerificationBody': {
    'en':
        "Only miracles with clear evidence from the Qur'an or Sahih al-Bukhari/Muslim are listed here. Popular stories without verified chains have been excluded.",
    'ar':
        'لا يُدرج هنا سوى المعجزات التي لها دليل واضح من القرآن أو صحيح البخاري/مسلم. تم استثناء القصص الشائعة التي لا سند موثّق لها.',
  },
  'terms': {'en': 'Terms', 'ar': 'المصطلحات', 'fr': 'Terms'},
  'searchTermsEllipsis': {
    'en': 'Search terms…',
    'ar': 'ابحث عن المصطلحات…',
    'fr': 'Search terms…',
  },
  'placesAndMaps': {
    'en': 'Places and Maps',
    'ar': 'الأماكن والخرائط',
    'fr': 'Places and Maps',
  },
  'keyCitiesRoutes': {
    'en': 'Key cities, routes, and locations in the Seerah',
    'ar': 'أهم المدن والطرق والمواقع في السيرة',
    'fr': 'Key cities, routes, and locations in the Seerah',
  },
  'tribesAndLineage': {
    'en': 'Tribes and Lineage',
    'ar': 'القبائل والنسب',
    'fr': 'Tribes and Lineage',
  },
  'prophetLineageAndTribes': {
    'en': "The Prophet's ﷺ lineage and major Arab tribes",
    'ar': 'نسب النبي ﷺ وأهم القبائل العربية',
  },
  'prophetLineageSummary': {
    'en': "The Prophet's ﷺ Lineage (Summary)",
    'ar': 'نسب النبي ﷺ (ملخص)',
  },
  'qurayshClansMakkah': {
    'en': 'Quraysh Clans of Makkah',
    'ar': 'بطون قريش في مكة',
    'fr': 'Quraysh Clans of Makkah',
  },
  'majorTribesMadinahAnsar': {
    'en': 'Major Tribes of Madinah (Ansar)',
    'ar': 'أهم قبائل المدينة (الأنصار)',
    'fr': 'Major Tribes of Madinah (Ansar)',
  },
  'jewishTribesMadinah': {
    'en': 'Jewish Tribes of Madinah',
    'ar': 'القبائل اليهودية في المدينة',
    'fr': 'Jewish Tribes of Madinah',
  },

  // ── Progress screen ──────────────────────────────────────────────────────
  'myProgressTitle': {'en': 'My Progress', 'ar': 'تقدّمي', 'fr': 'My Progress'},
  'courseMap': {'en': 'Course Map', 'ar': 'خريطة الدورة', 'fr': 'Course Map'},
  'quickLinks': {'en': 'Quick Links', 'ar': 'روابط سريعة', 'fr': 'Quick Links'},
  'learningTips': {
    'en': 'Learning Tips',
    'ar': 'نصائح للتعلم',
    'fr': 'Learning Tips',
  },
  'partsStudied': {
    'en': 'Parts Studied',
    'ar': 'الأجزاء المدروسة',
    'fr': 'Parts Studied',
  },
  'partsStudiedOfTotal': {
    'en': '{viewed} of {total} parts studied',
    'ar': '{viewed} من {total} أجزاء مدروسة',
    'fr': '{viewed} of {total} parts studied',
  },
  'quizzesLabel': {'en': 'Quizzes', 'ar': 'الاختبارات', 'fr': 'Quizzes'},
  'percentComplete': {
    'en': '{n}% complete',
    'ar': '{n}٪ مكتمل',
    'fr': '{n}% complete',
  },
  'quizzesPassed': {
    'en': 'Quizzes Passed',
    'ar': 'الاختبارات المجتازة',
    'fr': 'Quizzes Passed',
  },
  'unlockFullProgress': {
    'en': 'Unlock Full Progress',
    'ar': 'افتح التقدم الكامل',
    'fr': 'Unlock Full Progress',
  },
  'unlockFullProgressBody': {
    'en':
        'Get access to all {parts} parts across {eras} eras. Videos, reading, flashcards, and quizzes for every lesson.',
    'ar':
        'احصل على وصول لجميع الأجزاء ({parts}) عبر العصور ({eras}). فيديوهات وقراءة وبطاقات تعليمية واختبارات لكل درس.',
    'fr':
        'Get access to all {parts} parts across {eras} eras. Videos, reading, flashcards, and quizzes for every lesson.',
  },
  'quizHistory': {
    'en': 'Quiz History',
    'ar': 'سجل الاختبارات',
    'fr': 'Quiz History',
  },
  'seeAllScores': {
    'en': 'See all scores',
    'ar': 'عرض جميع النتائج',
    'fr': 'See all scores',
  },
  'certificate': {'en': 'Certificate', 'ar': 'الشهادة', 'fr': 'Certificate'},
  'viewRequirements': {
    'en': 'View requirements',
    'ar': 'عرض المتطلبات',
    'fr': 'View requirements',
  },
  'tipWatchFirstTitle': {
    'en': 'Watch first',
    'ar': 'شاهد أولًا',
    'fr': 'Watch first',
  },
  'tipWatchFirstBody': {
    'en':
        'Start each part by watching the video. It gives you the full context and narrative.',
    'ar': 'ابدأ كل جزء بمشاهدة الفيديو. فهو يمنحك السياق الكامل والسرد.',
    'fr':
        'Start each part by watching the video. It gives you the full context and narrative.',
  },
  'tipListenGoTitle': {
    'en': 'Listen on the go',
    'ar': 'استمع أثناء التنقل',
    'fr': 'Listen on the go',
  },
  'tipListenGoBody': {
    'en':
        'Use the audio version while commuting or doing other tasks to reinforce what you learned.',
    'ar':
        'استخدم النسخة الصوتية خلال التنقل أو أثناء أداء مهام أخرى لترسيخ ما تعلمته.',
    'fr':
        'Use the audio version while commuting or doing other tasks to reinforce what you learned.',
  },
  'tipReadBriefingTitle': {
    'en': 'Read the briefing',
    'ar': 'اقرأ الموجز',
    'fr': 'Read the briefing',
  },
  'tipReadBriefingBody': {
    'en':
        'Go through the briefing notes and key facts to solidify the main points.',
    'ar': 'راجع ملاحظات الموجز وأهم الحقائق لترسيخ النقاط الأساسية.',
    'fr':
        'Go through the briefing notes and key facts to solidify the main points.',
  },
  'tipStudySlidesTitle': {
    'en': 'Study the slides',
    'ar': 'ادرس الشرائح',
    'fr': 'Study the slides',
  },
  'tipStudySlidesBody': {
    'en':
        'Review the slide decks and infographics for a visual summary of each lesson.',
    'ar': 'راجع الشرائح والإنفوغرافيك للحصول على ملخص مرئي لكل درس.',
    'fr':
        'Review the slide decks and infographics for a visual summary of each lesson.',
  },
  'tipCheckMindmapTitle': {
    'en': 'Check the mindmap',
    'ar': 'راجع الخريطة الذهنية',
    'fr': 'Check the mindmap',
  },
  'tipCheckMindmapBody': {
    'en':
        'Use the mindmap to see how concepts in a lesson connect to each other.',
    'ar':
        'استخدم الخريطة الذهنية لمعرفة كيفية ارتباط المفاهيم في الدرس ببعضها.',
    'fr':
        'Use the mindmap to see how concepts in a lesson connect to each other.',
  },
  'tipReviewFlashcardsTitle': {
    'en': 'Review with flashcards',
    'ar': 'راجع بالبطاقات التعليمية',
    'fr': 'Review with flashcards',
  },
  'tipReviewFlashcardsBody': {
    'en': 'Go through the flashcards to lock in the most important facts.',
    'ar': 'راجع البطاقات التعليمية لترسيخ أهم الحقائق.',
    'fr': 'Go through the flashcards to lock in the most important facts.',
  },
  'tipTestYourselfTitle': {
    'en': 'Test yourself',
    'ar': 'اختبر نفسك',
    'fr': 'Test yourself',
  },
  'tipTestYourselfBody': {
    'en': "Take the quiz to see what you've truly retained. Aim for 80%+.",
    'ar': 'أدِّ الاختبار لمعرفة ما رسخ فعلًا في ذهنك. استهدف ٨٠٪ أو أكثر.',
  },
  'tipGoInOrderTitle': {
    'en': 'Go in order',
    'ar': 'اتبع الترتيب',
    'fr': 'Go in order',
  },
  'tipGoInOrderBody': {
    'en': 'The Seerah is a connected story. Each era builds on the one before.',
    'ar': 'السيرة قصة متصلة. كل عصر يُبنى على ما قبله.',
    'fr': 'The Seerah is a connected story. Each era builds on the one before.',
  },

  // ── Quiz history / certificate ───────────────────────────────────────────
  'quizHistoryTitle': {
    'en': 'Quiz History',
    'ar': 'سجل الاختبارات',
    'fr': 'Quiz History',
  },
  'failedToLoadProgress': {
    'en': 'Failed to load progress',
    'ar': 'تعذّر تحميل التقدم',
    'fr': 'Failed to load progress',
  },
  'noQuizzesTakenYet': {
    'en': 'No quizzes taken yet',
    'ar': 'لم يتم إجراء أي اختبار حتى الآن',
    'fr': 'No quizzes taken yet',
  },
  'completePartQuizToSee': {
    'en': 'Complete a part quiz to see your scores here.',
    'ar': 'أكمل اختبار أحد الأجزاء لترى نتائجك هنا.',
    'fr': 'Complete a part quiz to see your scores here.',
  },
  'attempted': {'en': 'Attempted', 'ar': 'محاولات', 'fr': 'Attempted'},
  'passed': {'en': 'Passed', 'ar': 'ناجح', 'fr': 'Passed'},
  'avgScore': {'en': 'Avg Score', 'ar': 'المتوسط', 'fr': 'Avg Score'},
  'certificateTitle': {
    'en': 'Certificate',
    'ar': 'الشهادة',
    'fr': 'Certificate',
  },
  'certOfCompletion': {
    'en': 'Certificate of Completion',
    'ar': 'شهادة إتمام',
    'fr': 'Certificate of Completion',
  },
  'certLocked': {
    'en': 'Certificate Locked',
    'ar': 'الشهادة مغلقة',
    'fr': 'Certificate Locked',
  },
  'completeSeerahOfProphet': {
    'en': 'The Complete Seerah of the Prophet ﷺ',
    'ar': 'السيرة الكاملة للنبي ﷺ',
    'fr': 'The Complete Seerah of the Prophet ﷺ',
  },
  'hasSuccessfullyCompleted': {
    'en':
        'has successfully completed all {n} parts\nof the Seerah of the Prophet Muhammad ﷺ',
    'ar': 'أكمل بنجاح جميع أجزاء ({n})\nسيرة النبي محمد ﷺ',
    'fr':
        'has successfully completed all {n} parts\nof the Seerah of the Prophet Muhammad ﷺ',
  },
  'shareCertificate': {
    'en': 'Share Certificate',
    'ar': 'مشاركة الشهادة',
    'fr': 'Share Certificate',
  },
  'preparingEllipsis': {
    'en': 'Preparing…',
    'ar': 'جارٍ التحضير…',
    'fr': 'Preparing…',
  },
  'requirements': {
    'en': 'Requirements',
    'ar': 'المتطلبات',
    'fr': 'Requirements',
  },
  'studyAllParts': {
    'en': 'Study all {n} parts',
    'ar': 'ادرس جميع الأجزاء ({n})',
    'fr': 'Study all {n} parts',
  },
  'passQuizForNParts': {
    'en': 'Pass the quiz (80%+) for {req}+ of the {n} parts',
    'ar': 'اجتز الاختبار (٨٠٪+) لـ {req}+ من أجزاء الدورة ({n})',
    'fr': 'Pass the quiz (80%+) for {req}+ of the {n} parts',
  },
  'keepStudyingBody': {
    'en':
        'Keep studying and passing quizzes. Your certificate will unlock automatically when you meet all requirements.',
    'ar':
        'استمر في الدراسة واجتياز الاختبارات. ستُفتح شهادتك تلقائيًا عند استيفاء جميع المتطلبات.',
    'fr':
        'Keep studying and passing quizzes. Your certificate will unlock automatically when you meet all requirements.',
  },
  'couldNotShareCertificate': {
    'en': 'Could not share certificate. Please try again.',
    'ar': 'تعذّرت مشاركة الشهادة. حاول مرة أخرى.',
    'fr': 'Could not share certificate. Please try again.',
  },
  'completedCourseShareText': {
    'en': 'I completed The Complete Seerah of the Prophet ﷺ course! 🎓',
    'ar': 'أكملت دورة السيرة الكاملة للنبي ﷺ! 🎓',
    'fr': 'I completed The Complete Seerah of the Prophet ﷺ course! 🎓',
  },
  'myCertificateSubject': {
    'en': 'My Seerah Certificate of Completion',
    'ar': 'شهادة إتمام دورة السيرة الخاصة بي',
    'fr': 'My Seerah Certificate of Completion',
  },

  // ── Profile / Profiles ───────────────────────────────────────────────────
  'guest': {'en': 'Guest', 'ar': 'ضيف', 'fr': 'Guest'},
  'noAccountYet': {
    'en': 'No account yet',
    'ar': 'لا يوجد حساب حتى الآن',
    'fr': 'No account yet',
  },
  'freePlan': {'en': 'Free Plan', 'ar': 'الخطة المجانية', 'fr': 'Free Plan'},
  'learnerProfile': {
    'en': 'Learner Profile',
    'ar': 'الملف التعليمي',
    'fr': 'Learner Profile',
  },
  'myProfile': {'en': 'My Profile', 'ar': 'ملفي الشخصي', 'fr': 'My Profile'},
  'tapToSwitchLearner': {
    'en': 'Tap to switch learner',
    'ar': 'اضغط لتبديل المتعلّم',
    'fr': 'Tap to switch learner',
  },
  'manageProfiles': {
    'en': 'Manage Profiles',
    'ar': 'إدارة الملفات',
    'fr': 'Manage Profiles',
  },
  'account': {'en': 'Account', 'ar': 'الحساب', 'fr': 'Compte'},
  'changePassword': {
    'en': 'Change Password',
    'ar': 'تغيير كلمة المرور',
    'fr': 'Change Password',
  },
  'currentPassword': {
    'en': 'Current password',
    'ar': 'كلمة المرور الحالية',
    'fr': 'Mot de passe actuel',
  },
  'enterCurrentPassword': {
    'en': 'Enter current password',
    'ar': 'أدخل كلمة المرور الحالية',
    'fr': 'Saisir le mot de passe actuel',
  },
  'newPasswordField': {
    'en': 'New password',
    'ar': 'كلمة المرور الجديدة',
    'fr': 'Nouveau mot de passe',
  },
  'atLeast8Chars': {
    'en': 'At least 8 characters',
    'ar': '٨ أحرف على الأقل',
    'fr': 'Au moins 8 caractères',
  },
  'confirmNewPassword': {
    'en': 'Confirm new password',
    'ar': 'تأكيد كلمة المرور الجديدة',
    'fr': 'Confirmer le nouveau mot de passe',
  },
  'reenterNewPassword': {
    'en': 'Re-enter new password',
    'ar': 'أعد إدخال كلمة المرور الجديدة',
    'fr': 'Ressaisir le nouveau mot de passe',
  },
  'passwordsMatch': {
    'en': 'Passwords match',
    'ar': 'كلمتا المرور متطابقتان',
    'fr': 'Les mots de passe correspondent',
  },
  'passwordsDontMatch': {
    'en': "Passwords don't match",
    'ar': 'كلمتا المرور غير متطابقتين',
    'fr': 'Les mots de passe ne correspondent pas',
  },
  'updatePasswordButton': {
    'en': 'Update Password',
    'ar': 'تحديث كلمة المرور',
    'fr': 'Mettre à jour le mot de passe',
  },
  'passwordUpdatedSuccess': {
    'en': 'Password updated successfully.',
    'ar': 'تم تحديث كلمة المرور بنجاح.',
    'fr': 'Mot de passe mis à jour avec succès.',
  },
  'saving': {
    'en': 'Saving…',
    'ar': 'جارٍ الحفظ…',
    'fr': 'Enregistrement…',
  },
  'couldNotUpdatePassword': {
    'en': 'Could not update password. Please try again.',
    'ar': 'تعذّر تحديث كلمة المرور. يرجى المحاولة مرة أخرى.',
    'fr': 'Impossible de mettre à jour le mot de passe. Veuillez réessayer.',
  },
  'billingSubscription': {
    'en': 'Billing & Subscription',
    'ar': 'الفواتير والاشتراك',
    'fr': 'Billing & Subscription',
  },
  'currentPlan': {
    'en': 'Current Plan',
    'ar': 'خطتك الحالية',
    'fr': 'Plan actuel',
  },
  'individualPlan': {
    'en': 'Individual Plan',
    'ar': 'الخطة الفردية',
    'fr': 'Plan Individuel',
  },
  'familyPlan': {
    'en': 'Family Plan',
    'ar': 'خطة العائلة',
    'fr': 'Plan Famille',
  },
  'lifetimeAccess': {
    'en': 'Lifetime access',
    'ar': 'وصول مدى الحياة',
    'fr': 'Accès à vie',
  },
  'renewsOn': {
    'en': 'Renews {date}',
    'ar': 'يُجدَّد: {date}',
    'fr': 'Se renouvelle le {date}',
  },
  'cancelsOn': {
    'en': 'Cancels {date}',
    'ar': 'ينتهي: {date}',
    'fr': 'Se termine le {date}',
  },
  'billedViaAppStore': {
    'en': 'Billed through the App Store — see Settings for the exact amount.',
    'ar': 'تتم الفوترة عبر App Store — راجع الإعدادات لمعرفة المبلغ بالضبط.',
    'fr': "Facturé via l'App Store — voir Réglages pour le montant exact.",
  },
  'billedViaPlayStore': {
    'en': 'Billed through Google Play — see your subscriptions for the exact amount.',
    'ar': 'تتم الفوترة عبر Google Play — راجع اشتراكاتك لمعرفة المبلغ بالضبط.',
    'fr': 'Facturé via Google Play — voir vos abonnements pour le montant exact.',
  },
  'accountSettings': {
    'en': 'Account settings',
    'ar': 'إعدادات الحساب',
    'fr': 'Paramètres du compte',
  },
  'exitGuestMode': {
    'en': 'Exit Guest Mode',
    'ar': 'الخروج من وضع الضيف',
    'fr': 'Quitter le mode invité',
  },
  'exitGuestModeQuestion': {
    'en': 'Exit Guest Mode?',
    'ar': 'الخروج من وضع الضيف؟',
    'fr': 'Quitter le mode invité ?',
  },
  'giftCourse': {
    'en': 'Gift the course',
    'ar': 'إهداء الدورة',
    'fr': 'Offrir le cours',
  },
  'support': {'en': 'Support', 'ar': 'الدعم', 'fr': 'Support'},
  'helpAndFaq': {
    'en': 'Help & FAQ',
    'ar': 'المساعدة والأسئلة الشائعة',
    'fr': 'Help & FAQ',
  },
  'contactUs': {'en': 'Contact Us', 'ar': 'اتصل بنا', 'fr': 'Contact Us'},
  'legal': {'en': 'Legal', 'ar': 'قانوني', 'fr': 'Legal'},

  // ── Help & FAQ (native screen — see help_faq_screen.dart) ──────────────
  // English/Arabic/French copied verbatim from the website's /help page
  // (app/help/page.tsx); the other 12 languages copied from the matching
  // entries in the website's shell phrase pack (data/i18n/shell/*.json) so
  // the wording matches exactly rather than relying on a best-effort
  // fallback translation.
  'faqCatGettingStarted': {
    'en': 'Getting Started',
    'ar': 'البدء',
    'fr': 'Pour commencer',
    'id': 'Memulai',
    'ms': 'Bermula',
    'zh': '入门指南',
    'ru': 'Начало работы',
    'sw': 'Kuanza',
    'es': 'Primeros Pasos',
    'de': 'Erste Schritte',
    'tr': 'Başlarken',
    'hi': 'शुरुआत करें',
    'ur': 'شروع کریں',
    'bn': 'শুরু করা যাক',
    'fa': 'شروع به کار',
  },
  'faqCatAccountBilling': {
    'en': 'Account & Billing',
    'ar': 'الحساب والفواتير',
    'fr': 'Compte et facturation',
    'id': 'Akun & Tagihan',
    'ms': 'Akaun & Bil',
    'zh': '账户与账单',
    'ru': 'Аккаунт и оплата',
    'sw': 'Akaunti na Malipo',
    'es': 'Cuenta y Facturación',
    'de': 'Konto & Abrechnung',
    'tr': 'Hesap ve Faturalandırma',
    'hi': 'खाता और बिलिंग',
    'ur': 'اکاؤنٹ اور بلنگ',
    'bn': 'অ্যাকাউন্ট ও বিলিং',
    'fa': 'حساب کاربری و صورتحساب',
  },
  'faqCatCourseAccess': {
    'en': 'Course Access',
    'ar': 'الوصول إلى الدورة',
    'fr': 'Accès au cours',
    'id': 'Akses Kursus',
    'ms': 'Akses Kursus',
    'zh': '课程权限',
    'ru': 'Доступ к курсу',
    'sw': 'Ufikiaji wa Kozi',
    'es': 'Acceso al Curso',
    'de': 'Kurszugang',
    'tr': 'Kurs Erişimi',
    'hi': 'कोर्स एक्सेस',
    'ur': 'کورس تک رسائی',
    'bn': 'কোর্স অ্যাক্সেস',
    'fa': 'دسترسی به دوره',
  },
  'faqCatCertificate': {
    'en': 'Certificate',
    'ar': 'الشهادة',
    'fr': 'Certificat',
    'id': 'Sertifikat',
    'ms': 'Sijil',
    'zh': '证书',
    'ru': 'Сертификат',
    'sw': 'Cheti',
    'es': 'Certificado',
    'de': 'Zertifikat',
    'tr': 'Sertifika',
    'hi': 'प्रमाणपत्र',
    'ur': 'سرٹیفکیٹ',
    'bn': 'সার্টিফিকেট',
    'fa': 'گواهینامه',
  },
  'helpFaqSubtitle': {
    'en': 'Find answers to common questions about your course',
    'ar': 'ابحث عن إجابات للأسئلة الشائعة حول دورتك',
    'fr': 'Trouvez des réponses aux questions fréquentes sur votre cours',
    'id': 'Temukan jawaban atas pertanyaan umum seputar kursus Anda',
    'ms': 'Dapatkan jawapan kepada soalan lazim mengenai kursus anda',
    'zh': '查找关于课程的常见问题解答',
    'ru': 'Ответы на частые вопросы о вашем курсе',
    'sw': 'Pata majibu ya maswali ya kawaida kuhusu kozi yako',
    'es': 'Encuentra respuestas a las preguntas frecuentes sobre tu curso',
    'de': 'Antworten auf häufige Fragen zu Ihrem Kurs',
    'tr': 'Kursunuzla ilgili sık sorulan soruların yanıtlarını bulun',
    'hi': 'अपने कोर्स से जुड़े सामान्य सवालों के जवाब पाएँ',
    'ur': 'اپنے کورس سے متعلق عام سوالات کے جوابات تلاش کریں',
    'bn': 'আপনার কোর্স সম্পর্কে সাধারণ প্রশ্নের উত্তর খুঁজুন',
    'fa': 'پاسخ پرسش‌های پرتکرار درباره دوره خود را بیابید',
  },
  'faqQAccess': {
    'en': 'How do I access my course?',
    'ar': 'كيف أصل إلى دورتي؟',
    'fr': 'Comment accéder à mon cours ?',
    'id': 'Bagaimana cara mengakses kursus saya?',
    'ms': 'Bagaimana cara untuk mengakses kursus saya?',
    'zh': '如何访问我的课程？',
    'ru': 'Как мне получить доступ к курсу?',
    'sw': 'Ninawezaje kufikia kozi yangu?',
    'es': '¿Cómo accedo a mi curso?',
    'de': 'Wie greife ich auf meinen Kurs zu?',
    'tr': 'Kursuma nasıl erişebilirim?',
    'hi': 'मैं अपने कोर्स तक कैसे पहुँचूँ?',
    'ur': 'میں اپنے کورس تک کیسے رسائی حاصل کروں؟',
    'bn': 'আমি কীভাবে আমার কোর্সে প্রবেশ করব?',
    'fa': 'چگونه به دوره خود دسترسی پیدا کنم؟',
  },
  'faqAAccess': {
    'en': 'After purchasing, you can access your course from the Dashboard or My Courses page. Simply click on the course card to start learning.',
    'ar': 'بعد الشراء، يمكنك الوصول إلى دورتك من لوحة التحكم. فقط انقر على بطاقة الدورة لبدء التعلم.',
    'fr': "Après l'achat, vous pouvez accéder à votre cours depuis le Tableau de bord. Cliquez simplement sur la carte du cours pour commencer.",
    'id': 'Setelah membeli, Anda dapat mengakses kursus dari halaman Dasbor atau Kursus Saya. Cukup klik kartu kursus untuk mulai belajar.',
    'ms': 'Selepas pembelian, anda boleh mengakses kursus daripada halaman Papan Pemuka atau Kursus Saya. Cuma klik kad kursus untuk mula belajar.',
    'zh': '购买后，您可以在「控制面板」或「我的课程」页面访问课程。只需点击课程卡片即可开始学习。',
    'ru': 'После покупки вы можете открыть курс на странице «Личный кабинет» или «Мои курсы». Просто нажмите на карточку курса, чтобы начать обучение.',
    'sw': 'Baada ya kununua, unaweza kufikia kozi yako kutoka ukurasa wa Dashibodi au Kozi Zangu. Bonyeza kadi ya kozi ili uanze kujifunza.',
    'es': 'Después de comprar, puedes acceder a tu curso desde el Panel o la página Mis Cursos. Simplemente haz clic en la tarjeta del curso para comenzar a aprender.',
    'de': 'Nach dem Kauf finden Sie Ihren Kurs im Dashboard oder auf der Seite „Meine Kurse“. Klicken Sie einfach auf die Kurskarte, um mit dem Lernen zu beginnen.',
    'tr': 'Satın aldıktan sonra kursunuza Kontrol Paneli veya Kurslarım sayfasından erişebilirsiniz. Öğrenmeye başlamak için kurs kartına tıklamanız yeterlidir.',
    'hi': 'खरीदने के बाद, आप अपना कोर्स डैशबोर्ड या "मेरे कोर्स" पेज से देख सकते हैं। सीखना शुरू करने के लिए बस कोर्स कार्ड पर क्लिक करें।',
    'ur': 'خریداری کے بعد، آپ اپنے کورس تک ڈیش بورڈ یا "میرے کورسز" صفحے سے رسائی حاصل کر سکتے ہیں۔ سیکھنا شروع کرنے کے لیے بس کورس کارڈ پر کلک کریں۔',
    'bn': 'কেনার পর, আপনি ড্যাশবোর্ড বা "আমার কোর্স" পেজ থেকে আপনার কোর্সে প্রবেশ করতে পারবেন। শেখা শুরু করতে কেবল কোর্স কার্ডে ক্লিক করুন।',
    'fa': 'پس از خرید، می‌توانید از طریق داشبورد یا صفحه «دوره‌های من» به دوره خود دسترسی داشته باشید. برای شروع یادگیری فقط کافی است روی کارت دوره کلیک کنید.',
  },
  'faqQIncludes': {
    'en': 'What does Complete Seerah Early Access include?',
    'ar': 'ما الذي يتضمنه الوصول الكامل للسيرة النبوية؟',
    'fr': "Que comprend l'accès complet à Complete Seerah ?",
    'id': 'Apa saja yang termasuk dalam Akses Awal Complete Seerah?',
    'ms': 'Apakah yang termasuk dalam Akses Awal Complete Seerah?',
    'zh': 'Complete Seerah 抢先体验包含哪些内容？',
    'ru': 'Что включает ранний доступ Complete Seerah?',
    'sw': 'Ufikiaji wa Mapema wa Complete Seerah unajumuisha nini?',
    'es': '¿Qué incluye el Acceso Anticipado a Complete Seerah?',
    'de': 'Was beinhaltet der Complete Seerah Early Access?',
    'tr': 'Complete Seerah Erken Erişimi neleri kapsar?',
    'hi': 'Complete Seerah अर्ली एक्सेस में क्या शामिल है?',
    'ur': 'Complete Seerah ابتدائی رسائی میں کیا شامل ہے؟',
    'bn': 'Complete Seerah আর্লি অ্যাক্সেসে কী অন্তর্ভুক্ত আছে?',
    'fa': 'دسترسی زودهنگام Complete Seerah شامل چه موارد است؟',
  },
  'faqAIncludes': {
    'en': 'You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking. Full access from day one.',
    'ar': 'تحصل على رحلة السيرة النبوية الكاملة في ١٠٠ جزء: دروس فيديو، ملخصات، اختبارات، بطاقات تعليمية، خرائط ذهنية، موارد مرئية، أدلة دراسية، تقارير، وتتبع التقدم. وصول كامل منذ اليوم الأول.',
    'fr': "Vous obtenez le parcours complet de la Sîra en 100 parties : leçons vidéo, briefings, quiz, flashcards, cartes mentales, ressources visuelles, guides d'étude, rapports et suivi de progression. Accès complet dès le premier jour.",
    'id': 'Anda mendapatkan perjalanan Seerah lengkap 100 bagian: pelajaran video, ringkasan, kuis, kartu hafalan, peta pikiran, sumber visual, panduan belajar, laporan, dan pelacakan progres terpandu. Akses penuh sejak hari pertama.',
    'ms': 'Anda akan mendapat perjalanan Seerah penuh 100 bahagian: pelajaran video, ringkasan, kuiz, kad imbas, peta minda, sumber visual, panduan belajar, laporan, dan penjejakan kemajuan berpandu. Akses penuh sejak hari pertama.',
    'zh': '您将获得完整的 100 部分 Seerah 学习之旅：视频课程、简报、测验、记忆卡、思维导图、视觉资源、学习指南、报告以及引导式进度跟踪。从第一天起即可完整访问。',
    'ru': 'Вы получаете полное путешествие по Сире из 100 частей: видеоуроки, краткие обзоры, тесты, карточки, интеллект-карты, визуальные материалы, учебные пособия, отчёты и управляемое отслеживание прогресса. Полный доступ с первого дня.',
    'sw': 'Unapata safari kamili ya Seerah yenye sehemu 100: masomo ya video, muhtasari, maswali, kadi za kukariri, ramani za mawazo, rasilimali za kuona, miongozo ya kujifunza, ripoti, na ufuatiliaji wa maendeleo ulioongozwa. Ufikiaji kamili tangu siku ya kwanza.',
    'es': 'Obtienes el recorrido completo de la Seerah en 100 partes: videolecciones, resúmenes, cuestionarios, tarjetas de memoria, mapas mentales, recursos visuales, guías de estudio, informes y seguimiento guiado del progreso. Acceso completo desde el primer día.',
    'de': 'Sie erhalten die vollständige 100-teilige Sira-Reise: Videolektionen, Kurzfassungen, Quiz, Lernkarten, Mindmaps, visuelle Materialien, Studienleitfäden, Berichte und geführte Fortschrittsverfolgung. Voller Zugang von Tag eins an.',
    'tr': 'Tam 100 bölümlük Siyer yolculuğunu alırsınız: video dersler, özetler, sınavlar, bilgi kartları, zihin haritaları, görsel kaynaklar, çalışma kılavuzları, raporlar ve yönlendirilmiş ilerleme takibi. İlk günden tam erişim.',
    'hi': 'आपको पूरे 100-भाग वाले सीरा सफ़र का अनुभव मिलता है: वीडियो पाठ, सार, क्विज़, फ़्लैशकार्ड, माइंड मैप, विज़ुअल संसाधन, स्टडी गाइड, रिपोर्ट, और निर्देशित प्रगति ट्रैकिंग। पहले दिन से पूरी एक्सेस।',
    'ur': 'آپ کو مکمل 100 حصوں والے سیرت کے سفر تک رسائی ملتی ہے: ویڈیو اسباق، خلاصے، کوئز، فلیش کارڈز، ذہنی نقشے، بصری وسائل، اسٹڈی گائیڈز، رپورٹس، اور رہنما پیش رفت ٹریکنگ۔ پہلے دن سے مکمل رسائی۔',
    'bn': 'আপনি সম্পূর্ণ 100-পর্বের সিরাহ যাত্রা পাবেন: ভিডিও পাঠ, সারাংশ, কুইজ, ফ্ল্যাশকার্ড, মাইন্ড ম্যাপ, ভিজ্যুয়াল রিসোর্স, স্টাডি গাইড, রিপোর্ট এবং গাইডেড অগ্রগতি ট্র্যাকিং। প্রথম দিন থেকেই পূর্ণ অ্যাক্সেস।',
    'fa': 'شما سفر کامل 100 بخشی سیره را دریافت می‌کنید: درس‌های ویدیویی، خلاصه‌ها، کوئیزها، فلش‌کارت‌ها، نقشه‌های ذهنی، منابع تصویری، راهنماهای مطالعه، گزارش‌ها و پیگیری هدایت‌شده پیشرفت. دسترسی کامل از روز اول.',
  },
  'faqQStructure': {
    'en': 'How are lessons structured?',
    'ar': 'كيف تُبنى الدروس؟',
    'fr': 'Comment les leçons sont-elles structurées ?',
    'id': 'Bagaimana struktur pelajarannya?',
    'ms': 'Bagaimana struktur pelajarannya?',
    'zh': '课程结构是怎样的？',
    'ru': 'Как устроены уроки?',
    'sw': 'Masomo yamepangwaje?',
    'es': '¿Cómo están estructuradas las lecciones?',
    'de': 'Wie sind die Lektionen aufgebaut?',
    'tr': 'Dersler nasıl yapılandırılmıştır?',
    'hi': 'पाठ किस तरह संरचित हैं?',
    'ur': 'اسباق کس طرح ترتیب دیے گئے ہیں؟',
    'bn': 'পাঠগুলো কীভাবে সাজানো হয়েছে?',
    'fa': 'ساختار درس‌ها چگونه است؟',
  },
  'faqAStructure': {
    'en': 'Each part includes a video lesson, briefing, study guide, flashcards, quiz, mind map, slides, infographics, and reports — everything you need to learn, review, and retain each part.',
    'ar': 'كل جزء يشمل: درس فيديو، ملخص، دليل دراسي، بطاقات تعليمية، اختبار، خريطة ذهنية، شرائح، رسوم معلوماتية، وتقارير — كل ما تحتاجه للتعلم والمراجعة والاحتفاظ.',
    'fr': "Chaque partie comprend une leçon vidéo, un briefing, un guide d'étude, des flashcards, un quiz, une carte mentale, des diapositives, des infographies et des rapports — tout ce qu'il faut pour apprendre, réviser et mémoriser.",
    'id': 'Setiap bagian mencakup pelajaran video, ringkasan, panduan belajar, kartu hafalan, kuis, peta pikiran, slide, infografis, dan laporan — semua yang Anda butuhkan untuk mempelajari, meninjau, dan mengingat setiap bagian.',
    'ms': 'Setiap bahagian merangkumi pelajaran video, ringkasan, panduan belajar, kad imbas, kuiz, peta minda, slaid, infografik, dan laporan — segala yang anda perlukan untuk belajar, mengulang kaji, dan mengingati setiap bahagian.',
    'zh': '每个部分都包含视频课程、简报、学习指南、记忆卡、测验、思维导图、幻灯片、信息图和报告——学习、复习并牢记每个部分所需的一切。',
    'ru': 'Каждая часть включает видеоурок, краткий обзор, учебное пособие, карточки, тест, интеллект-карту, слайды, инфографику и отчёты — всё необходимое, чтобы изучить, повторить и запомнить материал.',
    'sw': 'Kila sehemu ina somo la video, muhtasari, mwongozo wa kujifunza, kadi za kukariri, maswali, ramani ya mawazo, slaidi, michoro ya taarifa, na ripoti — kila unachohitaji kujifunza, kupitia, na kukumbuka kila sehemu.',
    'es': 'Cada parte incluye una videolección, un resumen, una guía de estudio, tarjetas de memoria, un cuestionario, un mapa mental, diapositivas, infografías e informes: todo lo que necesitas para aprender, repasar y retener cada parte.',
    'de': 'Jeder Teil enthält eine Videolektion, eine Kurzfassung, einen Studienleitfaden, Lernkarten, ein Quiz, eine Mindmap, Folien, Infografiken und Berichte — alles, was Sie brauchen, um jeden Teil zu lernen, zu wiederholen und zu behalten.',
    'tr': 'Her bölüm; bir video ders, özet, çalışma kılavuzu, bilgi kartları, sınav, zihin haritası, slaytlar, infografikler ve raporlar içerir — her bölümü öğrenmek, tekrar etmek ve akılda tutmak için gereken her şey.',
    'hi': 'हर भाग में एक वीडियो पाठ, सार, स्टडी गाइड, फ़्लैशकार्ड, क्विज़, माइंड मैप, स्लाइड, इन्फोग्राफिक और रिपोर्ट शामिल हैं — हर भाग को सीखने, दोहराने और याद रखने के लिए ज़रूरी हर चीज़।',
    'ur': 'ہر حصے میں ایک ویڈیو سبق، خلاصہ، اسٹڈی گائیڈ، فلیش کارڈز، کوئز، ذہنی نقشہ، سلائیڈز، انفوگرافکس اور رپورٹس شامل ہیں — ہر حصے کو سیکھنے، دہرانے اور یاد رکھنے کے لیے درکار ہر چیز۔',
    'bn': 'প্রতিটি পর্বে রয়েছে একটি ভিডিও পাঠ, সারাংশ, স্টাডি গাইড, ফ্ল্যাশকার্ড, কুইজ, মাইন্ড ম্যাপ, স্লাইড, ইনফোগ্রাফিক এবং রিপোর্ট — প্রতিটি পর্ব শেখা, পুনরালোচনা এবং মনে রাখার জন্য প্রয়োজনীয় সবকিছু।',
    'fa': 'هر بخش شامل یک درس ویدیویی، خلاصه، راهنمای مطالعه، فلش‌کارت، کوئیز، نقشه ذهنی، اسلاید، اینفوگرافیک و گزارش است — هر آنچه برای یادگیری، مرور و به‌خاطرسپاری هر بخش نیاز دارید.',
  },
  // Payment-options Q&A is reworded for the app (no live price embedded —
  // the website's version substitutes a live Stripe price here, which this
  // native screen can't easily mirror) to point at Billing & Subscription
  // instead. Not sourced from the website pack, so only en/ar/fr are hand
  // written — same convention as every other app-only string in this file.
  'faqQPayment': {
    'en': 'What payment options are available?',
    'ar': 'ما خيارات الدفع المتاحة؟',
    'fr': 'Quelles options de paiement sont disponibles ?',
  },
  'faqAPayment': {
    'en': 'You can view current pricing and manage your plan anytime from Billing & Subscription in your Account.',
    'ar': 'يمكنك عرض الأسعار الحالية وإدارة خطتك في أي وقت من خلال "الفواتير والاشتراك" في حسابك.',
    'fr': 'Vous pouvez consulter les tarifs actuels et gérer votre forfait à tout moment depuis « Facturation et abonnement » dans votre compte.',
  },
  'faqQRefund': {
    'en': "What's your refund policy?",
    'ar': 'ما سياسة الاسترداد؟',
    'fr': 'Quelle est votre politique de remboursement ?',
    'id': 'Bagaimana kebijakan pengembalian dana Anda?',
    'ms': 'Apakah dasar bayaran balik anda?',
    'zh': '你们的退款政策是什么？',
    'ru': 'Какова ваша политика возврата средств?',
    'sw': 'Sera yenu ya kurejesha pesa ni ipi?',
    'es': '¿Cuál es vuestra política de reembolso?',
    'de': 'Wie lautet Ihre Rückerstattungsrichtlinie?',
    'tr': 'İade politikanız nedir?',
    'hi': 'आपकी रिफ़ंड पॉलिसी क्या है?',
    'ur': 'آپ کی رقم کی واپسی کی پالیسی کیا ہے؟',
    'bn': 'আপনাদের রিফান্ড নীতি কী?',
    'fa': 'سیاست بازگشت وجه شما چیست؟',
  },
  'faqARefund': {
    'en': "We offer a 7-Day Clarity Guarantee. If the course isn't what you expected, email us within 7 days for a full refund.",
    'ar': 'نقدم ضمان الوضوح لمدة ٧ أيام. إذا لم تكن الدورة كما توقعت، راسلنا خلال ٧ أيام لاسترداد كامل المبلغ.',
    'fr': "Nous offrons une garantie de clarté de 7 jours. Si le cours n'est pas ce que vous attendiez, écrivez-nous dans les 7 jours pour un remboursement intégral.",
    'id': 'Kami menawarkan Jaminan Kejelasan 7 Hari. Jika kursus ini tidak sesuai dengan harapan Anda, kirimkan email kepada kami dalam waktu 7 hari untuk mendapatkan pengembalian dana penuh.',
    'ms': 'Kami menawarkan Jaminan Kejelasan 7 Hari. Jika kursus ini tidak seperti yang anda jangkakan, e-mel kami dalam tempoh 7 hari untuk bayaran balik penuh.',
    'zh': '我们提供 7 天满意保证。如果课程未达到您的预期，请在 7 天内发邮件联系我们，即可获得全额退款。',
    'ru': 'Мы предоставляем 7-дневную гарантию удовлетворённости. Если курс не оправдал ваших ожиданий, напишите нам на email в течение 7 дней — мы вернём деньги в полном объёме.',
    'sw': 'Tunatoa Dhamana ya Uwazi ya Siku 7. Ikiwa kozi hii si kama ulivyotarajia, tutumie barua pepe ndani ya siku 7 ili upate kurejeshewa pesa kikamilifu.',
    'es': 'Ofrecemos una Garantía de Claridad de 7 días. Si el curso no es lo que esperabas, escríbenos por correo electrónico dentro de los 7 días para obtener un reembolso completo.',
    'de': 'Wir bieten eine 7-tägige Klarheits-Garantie. Entspricht der Kurs nicht Ihren Erwartungen, schreiben Sie uns innerhalb von 7 Tagen für eine vollständige Rückerstattung.',
    'tr': '7 Günlük Netlik Garantisi sunuyoruz. Kurs beklediğiniz gibi değilse, tam iade için 7 gün içinde bize e-posta gönderin.',
    'hi': 'हम 7-दिन की स्पष्टता गारंटी देते हैं। यदि कोर्स आपकी उम्मीदों पर खरा नहीं उतरता, तो पूरे रिफ़ंड के लिए 7 दिनों के भीतर हमें ईमेल करें।',
    'ur': 'ہم 7 دن کی وضاحت کی ضمانت دیتے ہیں۔ اگر کورس آپ کی توقع کے مطابق نہ ہو تو مکمل رقم کی واپسی کے لیے 7 دن کے اندر ہمیں ای میل کریں۔',
    'bn': 'আমরা 7 দিনের স্বচ্ছতা গ্যারান্টি দিই। কোর্সটি যদি আপনার প্রত্যাশার মতো না হয়, তাহলে সম্পূর্ণ রিফান্ডের জন্য 7 দিনের মধ্যে আমাদের ইমেইল করুন।',
    'fa': 'ما ضمانت شفافیت 7 روزه ارائه می‌دهیم. اگر دوره مطابق انتظار شما نبود، برای بازگشت کامل وجه ظرف 7 روز به ما ایمیل بزنید.',
  },
  'faqQOrder': {
    'en': 'Can I access parts in any order?',
    'ar': 'هل يمكنني الوصول إلى الأجزاء بأي ترتيب؟',
    'fr': "Puis-je accéder aux parties dans n'importe quel ordre ?",
    'id': 'Bisakah saya mengakses bagian dalam urutan apa pun?',
    'ms': 'Bolehkah saya mengakses bahagian mengikut sebarang susunan?',
    'zh': '可以不按顺序学习各个部分吗？',
    'ru': 'Можно ли проходить части в любом порядке?',
    'sw': 'Je, ninaweza kufikia sehemu kwa mpangilio wowote?',
    'es': '¿Puedo acceder a las partes en cualquier orden?',
    'de': 'Kann ich die Teile in beliebiger Reihenfolge aufrufen?',
    'tr': 'Bölümlere istediğim sırayla erişebilir miyim?',
    'hi': 'क्या मैं भागों को किसी भी क्रम में देख सकता/सकती हूँ?',
    'ur': 'کیا میں حصوں کو کسی بھی ترتیب میں دیکھ سکتا/سکتی ہوں؟',
    'bn': 'আমি কি পর্বগুলো যেকোনো ক্রমে দেখতে পারব?',
    'fa': 'آیا می‌توانم بخش‌ها را به هر ترتیبی مشاهده کنم؟',
  },
  'faqAOrder': {
    'en': 'Yes — all 100 parts are immediately accessible once your plan is active. You can jump to any lesson at any time. The parts are numbered to help you follow the Seerah chronologically, but there are no locks or requirements between lessons.',
    'ar': 'نعم — جميع الـ ١٠٠ جزء متاحة فور تفعيل خطتك. يمكنك الانتقال إلى أي درس في أي وقت. الأجزاء مرقّمة لمساعدتك على متابعة السيرة بشكل تسلسلي.',
    'fr': "Oui — les 100 parties sont immédiatement accessibles une fois votre plan actif. Vous pouvez aller à n'importe quelle leçon à tout moment. Les parties sont numérotées pour suivre la Sîra chronologiquement, mais il n'y a pas de verrous entre les leçons.",
    'id': 'Ya — semua 100 bagian dapat langsung diakses begitu paket Anda aktif. Anda dapat melompat ke pelajaran mana pun kapan saja. Bagian-bagian diberi nomor untuk membantu Anda mengikuti Seerah secara kronologis, tetapi tidak ada kunci atau persyaratan antar pelajaran.',
    'ms': 'Ya — kesemua 100 bahagian boleh diakses serta-merta sebaik sahaja pelan anda aktif. Anda boleh melompat ke mana-mana pelajaran pada bila-bila masa. Bahagian-bahagian diberi nombor untuk membantu anda mengikuti Seerah secara kronologi, tetapi tiada kunci atau syarat antara pelajaran.',
    'zh': '是的——只要您的套餐生效，全部 100 个部分即可立即访问。您可以随时跳转到任意一节课。各部分均按编号排列，便于您按时间顺序学习 Seerah，但各课程之间没有锁定或先修要求。',
    'ru': 'Да — все 100 частей становятся доступны сразу после активации вашего тарифа. Вы можете перейти к любому уроку в любой момент. Части пронумерованы, чтобы вам было удобнее следить за Сирой в хронологическом порядке, но между уроками нет блокировок или обязательных условий.',
    'sw': 'Ndiyo — sehemu zote 100 zinapatikana mara tu mpango wako unapoamilishwa. Unaweza kuruka kwenda somo lolote wakati wowote. Sehemu zimepangwa kwa namba ili kukusaidia kufuatilia Seerah kwa mpangilio wa matukio, lakini hakuna vifungo au masharti kati ya masomo.',
    'es': 'Sí: las 100 partes están disponibles de inmediato en cuanto tu plan esté activo. Puedes pasar a cualquier lección en cualquier momento. Las partes están numeradas para ayudarte a seguir la Seerah en orden cronológico, pero no hay bloqueos ni requisitos entre lecciones.',
    'de': 'Ja — sobald Ihr Plan aktiv ist, sind alle 100 Teile sofort zugänglich. Sie können jederzeit zu jeder Lektion springen. Die Teile sind nummeriert, damit Sie die Sira chronologisch verfolgen können, es gibt jedoch keine Sperren oder Voraussetzungen zwischen den Lektionen.',
    'tr': "Evet — planınız etkinleştirildiğinde tüm 100 bölüme hemen erişebilirsiniz. İstediğiniz zaman herhangi bir derse geçebilirsiniz. Bölümler, Siyer'i kronolojik olarak takip etmenize yardımcı olmak için numaralandırılmıştır, ancak dersler arasında kilit veya ön koşul yoktur.",
    'hi': 'हाँ — आपका प्लान सक्रिय होते ही सभी 100 भाग तुरंत उपलब्ध हो जाते हैं। आप किसी भी समय किसी भी पाठ पर जा सकते हैं। भागों को क्रमांकित किया गया है ताकि आप सीरा को कालानुक्रमिक रूप से समझ सकें, लेकिन पाठों के बीच कोई लॉक या शर्त नहीं है।',
    'ur': 'جی ہاں — آپ کا پلان فعال ہوتے ہی تمام 100 حصے فوری طور پر دستیاب ہو جاتے ہیں۔ آپ کسی بھی وقت کسی بھی سبق پر جا سکتے ہیں۔ حصوں کو نمبر دیے گئے ہیں تاکہ آپ سیرت کو ترتیب وار سمجھ سکیں، لیکن اسباق کے درمیان کوئی لاک یا شرط نہیں ہے۔',
    'bn': 'হ্যাঁ — আপনার প্ল্যান সক্রিয় হওয়ার সাথে সাথেই সব 100টি পর্ব সঙ্গে সঙ্গে উপলব্ধ হয়ে যায়। আপনি যেকোনো সময় যেকোনো পাঠে যেতে পারেন। পর্বগুলো ক্রমানুসারে সাজানো হয়েছে যাতে আপনি সিরাহ কালানুক্রমিকভাবে অনুসরণ করতে পারেন, কিন্তু পাঠের মধ্যে কোনো লক বা শর্ত নেই।',
    'fa': 'بله — به‌محض فعال شدن طرح شما، همه 100 بخش فوراً در دسترس قرار می‌گیرند. می‌توانید در هر زمان به هر درسی بروید. بخش‌ها شماره‌گذاری شده‌اند تا بتوانید سیره را به ترتیب زمانی دنبال کنید، اما هیچ قفل یا پیش‌نیازی بین درس‌ها وجود ندارد.',
  },
  'faqQCertHow': {
    'en': 'How do I earn a certificate?',
    'ar': 'كيف أحصل على شهادة؟',
    'fr': 'Comment obtenir un certificat ?',
    'id': 'Bagaimana cara mendapatkan sertifikat?',
    'ms': 'Bagaimana cara untuk mendapatkan sijil?',
    'zh': '如何获得证书？',
    'ru': 'Как получить сертификат?',
    'sw': 'Ninawezaje kupata cheti?',
    'es': '¿Cómo obtengo un certificado?',
    'de': 'Wie erhalte ich ein Zertifikat?',
    'tr': 'Sertifikayı nasıl kazanırım?',
    'hi': 'मुझे प्रमाणपत्र कैसे मिलेगा?',
    'ur': 'مجھے سرٹیفکیٹ کیسے ملے گا؟',
    'bn': 'আমি কীভাবে সার্টিফিকেট পাব?',
    'fa': 'چگونه گواهینامه دریافت کنم؟',
  },
  'faqACertHow': {
    'en': 'Complete all required lessons in your plan. Complete users must also pass all quizzes with at least 70%. Your certificate will then be available in the Certificate section.',
    'ar': 'أكمل جميع الدروس المطلوبة في خطتك. يجب أيضاً اجتياز جميع الاختبارات بنسبة ٧٠٪ على الأقل. بعدها ستكون شهادتك متاحة في قسم الشهادات.',
    'fr': 'Complétez toutes les leçons requises de votre plan. Les utilisateurs avec accès complet doivent aussi réussir tous les quiz avec au moins 70 %. Votre certificat sera ensuite disponible dans la section Certificat.',
    'id': 'Selesaikan semua pelajaran wajib dalam paket Anda. Pengguna Complete juga harus lulus semua kuis dengan nilai minimal 70%. Sertifikat Anda akan tersedia di bagian Sertifikat.',
    'ms': 'Selesaikan semua pelajaran wajib dalam pelan anda. Pengguna Complete juga perlu lulus semua kuiz dengan sekurang-kurangnya 70%. Sijil anda kemudian akan tersedia di bahagian Sijil.',
    'zh': '完成您所在方案中的所有必修课程。Complete 用户还须在所有测验中取得至少 70% 的成绩，之后即可在「证书」板块领取证书。',
    'ru': 'Пройдите все обязательные уроки в вашем тарифе. Пользователям тарифа Complete также нужно сдать все тесты минимум на 70%. После этого сертификат появится в разделе «Сертификат».',
    'sw': 'Kamilisha masomo yote yanayohitajika katika mpango wako. Watumiaji wa Complete lazima pia wafaulu maswali yote kwa angalau 70%. Cheti chako kitapatikana kwenye sehemu ya Cheti.',
    'es': 'Completa todas las lecciones obligatorias de tu plan. Los usuarios del plan Complete también deben aprobar todos los cuestionarios con al menos un 70%. Tu certificado estará disponible en la sección Certificado.',
    'de': 'Schließen Sie alle erforderlichen Lektionen Ihres Plans ab. Nutzer des Complete-Plans müssen außerdem alle Quizze mit mindestens 70 % bestehen. Ihr Zertifikat ist anschließend im Bereich „Zertifikat“ verfügbar.',
    'tr': 'Planınızdaki tüm gerekli dersleri tamamlayın. Complete plan kullanıcılarının ayrıca tüm sınavları en az %70 ile geçmesi gerekir. Bunun ardından sertifikanız Sertifika bölümünde kullanıma hazır olacaktır.',
    'hi': 'अपने प्लान के सभी आवश्यक पाठ पूरे करें। Complete प्लान वाले उपयोगकर्ताओं को सभी क्विज़ में कम से कम 70% अंक लाना भी ज़रूरी है। इसके बाद आपका प्रमाणपत्र "प्रमाणपत्र" सेक्शन में उपलब्ध होगा।',
    'ur': 'اپنے پلان کے تمام ضروری اسباق مکمل کریں۔ Complete پلان والے صارفین کو تمام کوئز میں کم از کم 70% حاصل کرنا بھی ضروری ہے۔ اس کے بعد آپ کا سرٹیفکیٹ "سرٹیفکیٹ" سیکشن میں دستیاب ہوگا۔',
    'bn': 'আপনার প্ল্যানের সকল আবশ্যক পাঠ সম্পন্ন করুন। Complete প্ল্যানের ব্যবহারকারীদের সকল কুইজে কমপক্ষে ৭০% নম্বর পেতে হবে। এরপর আপনার সার্টিফিকেট "সার্টিফিকেট" সেকশনে উপলব্ধ হবে।',
    'fa': 'تمام درس‌های لازم در طرح خود را تکمیل کنید. کاربران طرح Complete باید همچنین در تمام کوئیزها حداقل ۷۰٪ کسب کنند. سپس گواهینامه شما در بخش «گواهینامه» در دسترس خواهد بود.',
  },
  'faqQCertOfficial': {
    'en': 'Is the certificate official?',
    'ar': 'هل الشهادة رسمية؟',
    'fr': 'Le certificat est-il officiel ?',
    'id': 'Apakah sertifikatnya resmi?',
    'ms': 'Adakah sijil ini rasmi?',
    'zh': '该证书是正式证书吗？',
    'ru': 'Сертификат является официальным?',
    'sw': 'Je, cheti ni rasmi?',
    'es': '¿El certificado es oficial?',
    'de': 'Ist das Zertifikat offiziell?',
    'tr': 'Sertifika resmi midir?',
    'hi': 'क्या प्रमाणपत्र आधिकारिक है?',
    'ur': 'کیا یہ سرٹیفکیٹ باضابطہ ہے؟',
    'bn': 'সার্টিফিকেটটি কি অফিসিয়াল?',
    'fa': 'آیا این گواهینامه رسمی است؟',
  },
  'faqACertOfficial': {
    'en': "Yes, it's an official certificate of completion from The Muslim Man showing you've completed Complete Seerah.",
    'ar': 'نعم، هي شهادة إتمام رسمية من The Muslim Man تُثبت أنك أكملت دورة السيرة النبوية الكاملة.',
    'fr': "Oui, c'est un certificat officiel de réussite de The Muslim Man attestant que vous avez terminé Complete Seerah.",
    'id': 'Ya, ini adalah sertifikat penyelesaian resmi dari The Muslim Man yang menunjukkan Anda telah menyelesaikan Complete Seerah.',
    'ms': 'Ya, ini ialah sijil penamatan rasmi daripada The Muslim Man yang menunjukkan anda telah menamatkan Complete Seerah.',
    'zh': '是的，这是由 The Muslim Man 颁发的正式结业证书，证明您已完成 Complete Seerah 课程。',
    'ru': 'Да, это официальный сертификат о завершении курса от The Muslim Man, подтверждающий, что вы прошли Complete Seerah.',
    'sw': 'Ndiyo, ni cheti rasmi cha kuhitimu kutoka The Muslim Man kinachoonyesha umekamilisha Complete Seerah.',
    'es': 'Sí, es un certificado oficial de finalización emitido por The Muslim Man que demuestra que has completado Complete Seerah.',
    'de': 'Ja, es handelt sich um ein offizielles Abschlusszertifikat von The Muslim Man, das bestätigt, dass Sie Complete Seerah abgeschlossen haben.',
    'tr': "Evet, bu The Muslim Man tarafından verilen, Complete Seerah'ı tamamladığınızı gösteren resmî bir tamamlama sertifikasıdır.",
    'hi': 'हाँ, यह The Muslim Man द्वारा जारी एक आधिकारिक पूर्णता प्रमाणपत्र है, जो दर्शाता है कि आपने Complete Seerah पूरा कर लिया है।',
    'ur': 'جی ہاں، یہ The Muslim Man کی طرف سے جاری ایک باضابطہ تکمیلی سرٹیفکیٹ ہے، جو ظاہر کرتا ہے کہ آپ نے Complete Seerah مکمل کر لیا ہے۔',
    'bn': 'হ্যাঁ, এটি The Muslim Man থেকে প্রদত্ত একটি অফিসিয়াল সমাপ্তি সার্টিফিকেট, যা প্রমাণ করে আপনি Complete Seerah সম্পন্ন করেছেন।',
    'fa': 'بله، این یک گواهینامه رسمی اتمام دوره از طرف The Muslim Man است که نشان می‌دهد شما Complete Seerah را به پایان رسانده‌اید.',
  },

  // ── Contact Us (native screen — see contact_us_screen.dart) ────────────
  // All 15 languages copied verbatim from the website's lib/site-copy.ts,
  // which already hand-translates these into every course language.
  'contactUsSubtitle': {
    'en': "Questions, refund requests, or anything else — we're here to help.",
    'ar': 'أسئلة، طلبات استرداد، أو أي أمر — نحن هنا للمساعدة.',
    'fr': 'Questions, remboursements ou autre — nous sommes là pour vous aider.',
    'id': 'Pertanyaan, permintaan refund, atau hal lain — kami siap membantu.',
    'ms': 'Soalan, permintaan bayaran balik, atau apa-apa — kami sedia membantu.',
    'zh': '问题、退款申请或其他事宜 — 我们随时协助。',
    'ru': 'Вопросы, возвраты или другое — мы на связи.',
    'sw': 'Maswali, maombi ya rudisho, au chochote — tuko hapa kusaidia.',
    'es': 'Preguntas, reembolsos o lo que sea — estamos para ayudarte.',
    'de': 'Fragen, Erstattungen oder sonstiges — wir helfen gern.',
    'tr': 'Sorular, iade talepleri veya başka bir şey — yardımcı oluruz.',
    'hi': 'प्रश्न, रिफंड अनुरोध या कुछ और — हम मदद के लिए हैं।',
    'ur': 'سوالات، واپسی کی درخواستیں، یا کچھ اور — ہم مدد کے لیے ہیں۔',
    'bn': 'প্রশ্ন, রিফান্ড অনুরোধ বা অন্য কিছু — আমরা সাহায্যের জন্য আছি।',
    'fa': 'سؤال، درخواست بازپرداخت یا هر چیز دیگر — اینجاییم.',
  },
  'contactEmailCard': {
    'en': 'Email us directly',
    'ar': 'راسلنا مباشرة',
    'fr': 'Écrivez-nous',
    'id': 'Email langsung',
    'ms': 'E-mel terus',
    'zh': '直接发邮件',
    'ru': 'Напишите нам',
    'sw': 'Tututumie barua pepe',
    'es': 'Escríbenos',
    'de': 'Schreib uns',
    'tr': 'Doğrudan e-posta',
    'hi': 'सीधे ईमेल करें',
    'ur': 'براہِ راست ای میل',
    'bn': 'সরাসরি ইমেইল',
    'fa': 'ایمیل مستقیم',
  },
  'contactResponseCard': {
    'en': 'Response time',
    'ar': 'مدة الرد',
    'fr': 'Délai de réponse',
    'id': 'Waktu respons',
    'ms': 'Masa respons',
    'zh': '回复时间',
    'ru': 'Срок ответа',
    'sw': 'Muda wa majibu',
    'es': 'Tiempo de respuesta',
    'de': 'Antwortzeit',
    'tr': 'Yanıt süresi',
    'hi': 'जवाब का समय',
    'ur': 'جواب کا وقت',
    'bn': 'উত্তরের সময়',
    'fa': 'زمان پاسخ',
  },
  'contactResponseTime': {
    'en': 'Usually within 24–48 hours on business days.',
    'ar': 'عادةً خلال ٢٤–٤٨ ساعة في أيام العمل.',
    'fr': 'En général sous 24–48 h les jours ouvrés.',
    'id': 'Biasanya 24–48 jam pada hari kerja.',
    'ms': 'Biasanya dalam 24–48 jam pada hari bekerja.',
    'zh': '通常在工作日的 24–48 小时内。',
    'ru': 'Обычно в течение 24–48 часов в рабочие дни.',
    'sw': 'Kwa kawaida ndani ya masaa 24–48 siku za kazi.',
    'es': 'Normalmente en 24–48 horas en días laborables.',
    'de': 'In der Regel innerhalb von 24–48 Stunden an Werktagen.',
    'tr': 'Genelde iş günlerinde 24–48 saat içinde.',
    'hi': 'आमतौर पर कार्य दिवसों में २४–४८ घंटे में।',
    'ur': 'عام طور پر کار کے دنوں میں ۲۴–۴۸ گھنٹے میں۔',
    'bn': 'সাধারণত কর্মদিবসে ২৪–৪৮ ঘণ্টার মধ্যে।',
    'fa': 'معمولاً در روزهای کاری ظرف ۲۴–۴۸ ساعت.',
  },
  'sendUsAnEmail': {
    'en': 'Send us an email',
    'ar': 'أرسل لنا بريدًا إلكترونيًا',
    'fr': 'Envoyez-nous un e-mail',
    'id': 'Kirim email kepada kami',
    'ms': 'Hantar e-mel kepada kami',
    'zh': '给我们发邮件',
    'ru': 'Отправить нам письмо',
    'sw': 'Tutumie barua pepe',
    'es': 'Envíanos un correo',
    'de': 'Senden Sie uns eine E-Mail',
    'tr': 'Bize e-posta gönderin',
    'hi': 'हमें ईमेल भेजें',
    'ur': 'ہمیں ای میل بھیجیں',
    'bn': 'আমাদের ইমেইল করুন',
    'fa': 'برای ما ایمیل بفرستید',
  },

  // ── Legal screens (native — privacy_policy_screen.dart, terms_of_use_screen.dart) ──
  // Per product decision: the legal text itself stays in English only
  // (standard practice for legal documents — avoids translation-accuracy
  // risk); only the screen chrome translates.
  'legalLastUpdated': {
    'en': 'Last updated: {date}',
    'ar': 'آخر تحديث: {date}',
    'fr': 'Dernière mise à jour : {date}',
  },
  'signOut': {'en': 'Sign Out', 'ar': 'تسجيل الخروج', 'fr': 'Se déconnecter'},
  'signOutQuestion': {
    'en': 'Sign Out?',
    'ar': 'تسجيل الخروج؟',
    'fr': 'Sign Out?',
  },
  'signOutGuestWarning': {
    'en':
        "You're using a guest account with no email or password. Signing out will permanently lose access on this device unless you create an account first. Continue?",
    'ar':
        'أنت تستخدم حساب ضيف بلا بريد إلكتروني أو كلمة مرور. تسجيل الخروج سيؤدي إلى فقدان الوصول على هذا الجهاز بشكل نهائي إلا إذا أنشأت حسابًا أولًا. هل تريد المواصلة؟',
  },
  'needToSignInAgain': {
    'en': 'You will need to sign in again.',
    'ar': 'ستحتاج إلى تسجيل الدخول مرة أخرى.',
    'fr': 'You will need to sign in again.',
  },
  'deleteAccount': {
    'en': 'Delete Account',
    'ar': 'حذف الحساب',
    'fr': 'Delete Account',
  },
  'deleteAccountQuestion': {
    'en': 'Delete Account?',
    'ar': 'حذف الحساب؟',
    'fr': 'Delete Account?',
  },
  'deleteAccountWarning': {
    'en':
        'This permanently deletes your account, progress, and any active subscription. This cannot be undone.',
    'ar':
        'سيؤدي هذا إلى حذف حسابك وتقدّمك وأي اشتراك فعّال بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.',
    'fr':
        'This permanently deletes your account, progress, and any active subscription. This cannot be undone.',
  },
  'appStoreCancelNote': {
    'en':
        '\n\nIf you subscribed through the App Store, this does NOT cancel Apple billing — please also cancel it in Settings > [your name] > Subscriptions on this device.',
    'ar':
        '\n\nإذا كنت مشتركًا عبر متجر آبل، فإن هذا لا يُلغي فوترة آبل — يرجى إلغاء الاشتراك أيضًا من الإعدادات > [اسمك] > الاشتراكات على هذا الجهاز.',
    'fr':
        '\n\nIf you subscribed through the App Store, this does NOT cancel Apple billing — please also cancel it in Settings > [your name] > Subscriptions on this device.',
  },
  'confirmYourPassword': {
    'en': 'Confirm your password',
    'ar': 'أكّد كلمة المرور',
    'fr': 'Confirm your password',
  },
  'versionLabel': {
    'en': 'Version {v}',
    'ar': 'الإصدار {v}',
    'fr': 'Version {v}',
  },
  'manageSubscription': {
    'en': 'Manage Subscription',
    'ar': 'إدارة الاشتراك',
    'fr': 'Manage Subscription',
  },
  'appleSubscriptionBody': {
    'en':
        'Subscriptions purchased through the App Store are managed through your Apple ID.\n\nOn your device: Settings → [Your Name] → Subscriptions.',
    'ar':
        'يتم إدارة الاشتراكات المشتراة عبر متجر آبل من خلال حساب Apple ID الخاص بك.\n\nعلى جهازك: الإعدادات ← [اسمك] ← الاشتراكات.',
    'fr':
        'Subscriptions purchased through the App Store are managed through your Apple ID.\n\nOn your device: Settings → [Your Name] → Subscriptions.',
  },
  'couldNotOpenEmailApp': {
    'en': 'Could not open an email app. Please email us at {email}.',
    'ar': 'تعذّر فتح تطبيق البريد الإلكتروني. راسلنا على {email}.',
    'fr': "Impossible d'ouvrir une application d'e-mail. Écrivez-nous à {email}.",
  },
  'couldNotOpenPlayStore': {
    'en':
        'Could not open the Play Store. Open the Play Store app and check Menu → Payments & subscriptions → Subscriptions instead.',
    'ar':
        'تعذّر فتح متجر Play. افتح تطبيق متجر Play وتحقق من القائمة ← الدفعات والاشتراكات ← الاشتراكات.',
    'fr':
        'Could not open the Play Store. Open the Play Store app and check Menu → Payments & subscriptions → Subscriptions instead.',
  },
  'createAccountOptional': {
    'en': 'Create an account (optional)',
    'ar': 'أنشئ حسابًا (اختياري)',
    'fr': 'Create an account (optional)',
  },
  'createAccountOptionalBody': {
    'en':
        'Access your course from other devices. Your purchase already works on this device without this.',
    'ar':
        'يمكنك الوصول إلى دورتك من أجهزة أخرى. يعمل شراؤك على هذا الجهاز بالفعل دون ذلك.',
    'fr':
        'Access your course from other devices. Your purchase already works on this device without this.',
  },
  'verifyYourEmail': {
    'en': 'Verify your email',
    'ar': 'تحقّق من بريدك الإلكتروني',
    'fr': 'Verify your email',
  },
  'verificationEmailSent': {
    'en': 'Verification email sent — check your inbox.',
    'ar': 'تم إرسال بريد التحقق — راجع صندوق الوارد.',
    'fr': 'Verification email sent — check your inbox.',
  },
  'verifyEmailNeededBody': {
    'en':
        'Needed to unlock course content, reset your password, and sign in on other devices.',
    'ar':
        'مطلوب لفتح محتوى الدورة، وإعادة تعيين كلمة المرور، وتسجيل الدخول على أجهزة أخرى.',
    'fr':
        'Needed to unlock course content, reset your password, and sign in on other devices.',
  },
  'resendEmail': {
    'en': 'Resend Email',
    'ar': 'إعادة إرسال البريد',
    'fr': 'Resend Email',
  },
  'whosLearning': {'en': "Who's Learning?", 'ar': 'من يتعلّم؟'},
  'couldNotLoadProfiles': {
    'en': 'Could not load profiles',
    'ar': 'تعذّر تحميل الملفات',
    'fr': 'Could not load profiles',
  },
  'tapProfileToRenameRemove': {
    'en': 'Tap a profile to rename or remove it.',
    'ar': 'اضغط على ملف لإعادة تسميته أو إزالته.',
    'fr': 'Tap a profile to rename or remove it.',
  },
  'addProfile': {'en': 'Add Profile', 'ar': 'إضافة ملف', 'fr': 'Add Profile'},
  'newLearnerProfile': {
    'en': 'New Learner Profile',
    'ar': 'ملف متعلّم جديد',
    'fr': 'New Learner Profile',
  },
  'learnerName': {
    'en': 'Learner name',
    'ar': 'اسم المتعلّم',
    'fr': 'Learner name',
  },
  'add': {'en': 'Add', 'ar': 'إضافة', 'fr': 'Add'},
  'editProfile': {
    'en': 'Edit Profile',
    'ar': 'تعديل الملف',
    'fr': 'Edit Profile',
  },
  'name': {'en': 'Name', 'ar': 'الاسم', 'fr': 'Name'},
  'deleteProfile': {
    'en': 'Delete Profile',
    'ar': 'حذف الملف',
    'fr': 'Delete Profile',
  },
  'deleteProfileQuestion': {
    'en': 'Delete Profile?',
    'ar': 'حذف الملف؟',
    'fr': 'Delete Profile?',
  },
  'deleteProfileWarning': {
    'en': 'This will permanently delete "{name}" and all their progress.',
    'ar': 'سيؤدي هذا إلى حذف "{name}" وكل تقدّمه بشكل نهائي.',
    'fr': 'This will permanently delete "{name}" and all their progress.',
  },
  'avatarLabelSuffix': {
    'en': '{label} avatar',
    'ar': 'صورة رمزية {label}',
    'fr': '{label} avatar',
  },
  'avatarBook': {'en': 'Book', 'ar': 'كتاب', 'fr': 'Book'},
  'avatarMoon': {'en': 'Moon', 'ar': 'هلال', 'fr': 'Moon'},
  'avatarStar': {'en': 'Star', 'ar': 'نجمة', 'fr': 'Star'},
  'avatarFlower': {'en': 'Flower', 'ar': 'زهرة', 'fr': 'Flower'},
  'avatarMosque': {'en': 'Mosque', 'ar': 'مسجد', 'fr': 'Mosque'},
  'avatarLion': {'en': 'Lion', 'ar': 'أسد', 'fr': 'Lion'},
  'avatarLeaf': {'en': 'Leaf', 'ar': 'ورقة', 'fr': 'Leaf'},
  'avatarTarget': {'en': 'Target', 'ar': 'هدف', 'fr': 'Target'},
  'avatarTrophy': {'en': 'Trophy', 'ar': 'كأس', 'fr': 'Trophy'},
  'avatarSparkle': {'en': 'Sparkle', 'ar': 'بريق', 'fr': 'Sparkle'},

  // ── Legal / WebView / refund ─────────────────────────────────────────────
  'couldntLoadPage': {
    'en': "Couldn't load this page. Check your connection and try again.",
    'ar': 'تعذّر تحميل هذه الصفحة. تحقق من اتصالك وحاول مرة أخرى.',
  },
  'privacyPolicyTitle': {
    'en': 'Privacy Policy',
    'ar': 'سياسة الخصوصية',
    'fr': 'Privacy Policy',
  },
  'termsOfUseTitle': {
    'en': 'Terms of Use (EULA)',
    'ar': 'شروط الاستخدام',
    'fr': 'Terms of Use (EULA)',
  },
  'subLegalCompact': {
    'en':
        'Monthly plans are auto-renewing subscriptions that renew unless cancelled 24h before the period ends. Manage or cancel in your App Store or Google Play account settings. ',
    'ar':
        'الخطط الشهرية اشتراكات تتجدد تلقائيًا ما لم يتم إلغاؤها قبل ٢٤ ساعة من انتهاء الفترة. يمكنك إدارة أو إلغاء الاشتراك من إعدادات حسابك في متجر آبل أو متجر جوجل بلاي. ',
    'fr':
        'Les abonnements mensuels se renouvellent automatiquement sauf annulation 24h avant la fin de la période. Gérez ou annulez dans les paramètres de votre compte App Store ou Google Play. ',
  },
  'subLegalFull': {
    'en':
        'Monthly is an auto-renewing 1-month subscription that renews unless cancelled at least 24 hours before the end of the current period. Manage or cancel a subscription in your App Store or Google Play account settings. Payment will be charged to your store account upon purchase confirmation. ',
    'ar':
        'الخطة الشهرية اشتراك شهري يتجدد تلقائيًا ما لم يتم إلغاؤه قبل ٢٤ ساعة على الأقل من انتهاء الفترة الحالية. يمكنك إدارة أو إلغاء الاشتراك من إعدادات حسابك في متجر آبل أو متجر جوجل بلاي. سيتم خصم الدفعة من حساب متجرك عند تأكيد الشراء. ',
    'fr':
        'L’abonnement mensuel est une formule renouvelable automatiquement d’une durée d’un mois, qui se renouvelle sauf annulation au moins 24 heures avant la fin de la période en cours. Gérez ou annulez un abonnement dans les paramètres de votre compte App Store ou Google Play. Le paiement sera débité de votre compte de magasin à la confirmation de l’achat. ',
  },
  'pageNotFound': {
    'en': 'Page not found',
    'ar': 'الصفحة غير موجودة',
    'fr': 'Page introuvable',
  },
  'goHome': {'en': 'Go Home', 'ar': 'الصفحة الرئيسية', 'fr': 'Accueil'},
  'sessionExpiredNotice': {
    'en': 'Your session expired. Please sign in again.',
    'ar': 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.',
    'fr': 'Your session expired. Please sign in again.',
  },
  'signInFailedSaveSession': {
    'en': 'Sign-in failed to save session. Please try again.',
    'ar': 'فشل تسجيل الدخول في حفظ الجلسة. حاول مرة أخرى.',
    'fr': 'Sign-in failed to save session. Please try again.',
  },
  'signInInterrupted': {
    'en': 'Sign-in was interrupted. Please try again.',
    'ar': 'تمت مقاطعة تسجيل الدخول. حاول مرة أخرى.',
    'fr': 'Sign-in was interrupted. Please try again.',
  },
  'loginFailedCredentials': {
    'en': 'Login failed. Check your credentials.',
    'ar': 'فشل تسجيل الدخول. تحقق من بيانات الاعتماد.',
    'fr': 'Login failed. Check your credentials.',
  },
  'accountCreatedSessionFail': {
    'en': 'Account created but session failed to save. Please sign in.',
    'ar': 'تم إنشاء الحساب ولكن فشل حفظ الجلسة. يرجى تسجيل الدخول.',
    'fr': 'Account created but session failed to save. Please sign in.',
  },
  'accountUpgradeInterrupted': {
    'en': 'Account upgrade was interrupted. Please try again.',
    'ar': 'تمت مقاطعة ترقية الحساب. حاول مرة أخرى.',
    'fr': 'Account upgrade was interrupted. Please try again.',
  },
  'couldNotCreateAccount': {
    'en': 'Could not create account.',
    'ar': 'تعذّر إنشاء الحساب.',
    'fr': 'Could not create account.',
  },
  'couldNotDeleteAccountGeneric': {
    'en': 'Could not delete account.',
    'ar': 'تعذّر حذف الحساب.',
    'fr': 'Could not delete account.',
  },
  'couldNotSendVerificationEmail': {
    'en': 'Could not send verification email.',
    'ar': 'تعذّر إرسال بريد التحقق.',
    'fr': 'Could not send verification email.',
  },
  'somethingWentWrong': {
    'en': 'Something went wrong.',
    'ar': 'حدث خطأ ما.',
    'fr': 'Something went wrong.',
  },
  'somethingWentWrongRetry': {
    'en': 'Something went wrong. Please try again.',
    'ar': 'حدث خطأ ما. حاول مرة أخرى.',
    'fr': 'Something went wrong. Please try again.',
  },
  'iapStoreUnavailableDevice': {
    'en':
        'Store billing is unavailable on this device right now. Please try again, or contact support@themuslimman.com if this continues.',
    'ar':
        'خدمة الفوترة غير متوفرة على هذا الجهاز حاليًا. حاول مرة أخرى، أو تواصل مع support@themuslimman.com إذا استمرت المشكلة.',
    'fr':
        'Store billing is unavailable on this device right now. Please try again, or contact support@themuslimman.com if this continues.',
  },
  'iapCouldNotLoadPlans': {
    'en':
        'We could not load plans from the store. Please check your connection and tap Retry, or contact support@themuslimman.com if this continues.',
    'ar':
        'تعذّر تحميل الخطط من المتجر. تحقق من اتصالك واضغط على إعادة المحاولة، أو تواصل مع support@themuslimman.com إذا استمرت المشكلة.',
    'fr':
        'We could not load plans from the store. Please check your connection and tap Retry, or contact support@themuslimman.com if this continues.',
  },
  'iapPlanTempUnavailable': {
    'en':
        'This plan is temporarily unavailable. Please tap Retry, or contact support@themuslimman.com if this continues.',
    'ar':
        'هذه الخطة غير متوفرة مؤقتًا. اضغط على إعادة المحاولة، أو تواصل مع support@themuslimman.com إذا استمرت المشكلة.',
    'fr':
        'This plan is temporarily unavailable. Please tap Retry, or contact support@themuslimman.com if this continues.',
  },
  'iapPlanCouldNotLoad': {
    'en': 'This plan could not be loaded from the store. Tap Retry.',
    'ar': 'تعذّر تحميل هذه الخطة من المتجر. اضغط على إعادة المحاولة.',
    'fr': 'This plan could not be loaded from the store. Tap Retry.',
  },
  'iapLoadingPlans': {
    'en': 'Loading plans from the store…',
    'ar': 'جارٍ تحميل الخطط من المتجر…',
    'fr': 'Loading plans from the store…',
  },
  'iapStoreUnavailable': {
    'en': 'Store billing unavailable',
    'ar': 'خدمة الفوترة غير متوفرة',
    'fr': 'Store billing unavailable',
  },
  'iapPlansLoadedCount': {
    'en': '{loaded} of {total} plans loaded from the store',
    'ar': 'تم تحميل {loaded} من {total} خطط من المتجر',
    'fr': '{loaded} of {total} plans loaded from the store',
  },
  'iapNotAvailableDevice': {
    'en': 'In-app purchases are not available on this device.',
    'ar': 'عمليات الشراء داخل التطبيق غير متوفرة على هذا الجهاز.',
    'fr': 'In-app purchases are not available on this device.',
  },
  'iapFailedLoadProducts': {
    'en': 'Failed to load products from the store.',
    'ar': 'فشل تحميل المنتجات من المتجر.',
    'fr': 'Failed to load products from the store.',
  },
  'iapCouldNotClaimPurchase': {
    'en': 'Could not claim purchase. Please try again.',
    'ar': 'تعذّر المطالبة بالشراء. حاول مرة أخرى.',
    'fr': 'Could not claim purchase. Please try again.',
  },
  'iapCouldNotStartPurchase': {
    'en': 'Could not start the purchase. Please try again.',
    'ar': 'تعذّر بدء الشراء. حاول مرة أخرى.',
    'fr': 'Could not start the purchase. Please try again.',
  },
  'iapCouldNotRestore': {
    'en': 'Could not restore purchases. Please try again.',
    'ar': 'تعذّر استرجاع المشتريات. حاول مرة أخرى.',
    'fr': 'Could not restore purchases. Please try again.',
  },
  'iapPurchaseFailedRetry': {
    'en': 'Purchase failed. Please try again.',
    'ar': 'فشلت عملية الشراء. حاول مرة أخرى.',
    'fr': 'Purchase failed. Please try again.',
  },
  'iapVerifyFailedRestoreIos': {
    'en':
        'Purchase verification failed. Tap Restore Purchases to try again, or contact support@themuslimman.com.',
    'ar':
        'فشل التحقق من الشراء. اضغط على استرجاع المشتريات للمحاولة مرة أخرى، أو تواصل مع support@themuslimman.com.',
    'fr':
        'Purchase verification failed. Tap Restore Purchases to try again, or contact support@themuslimman.com.',
  },
  'iapVerifyFailedRetry': {
    'en':
        'Purchase verification failed. Please try again or contact support@themuslimman.com',
    'ar':
        'فشل التحقق من الشراء. حاول مرة أخرى أو تواصل مع support@themuslimman.com',
    'fr':
        'Purchase verification failed. Please try again or contact support@themuslimman.com',
  },
  'iapCouldNotVerifyRestoreIos': {
    'en':
        'Could not verify your purchase. Tap Restore Purchases to try again, or contact support@themuslimman.com',
    'ar':
        'تعذّر التحقق من شرائك. اضغط على استرجاع المشتريات للمحاولة مرة أخرى، أو تواصل مع support@themuslimman.com',
    'fr':
        'Could not verify your purchase. Tap Restore Purchases to try again, or contact support@themuslimman.com',
  },
  'iapCouldNotVerifyContact': {
    'en':
        'Could not verify your purchase. Please contact support@themuslimman.com',
    'ar': 'تعذّر التحقق من شرائك. يرجى التواصل مع support@themuslimman.com',
    'fr':
        'Could not verify your purchase. Please contact support@themuslimman.com',
  },
  'iapSessionExpiredRestore': {
    'en':
        'Your session expired. Please close and reopen the app, then try Restore Purchases.',
    'ar':
        'انتهت صلاحية جلستك. يرجى إغلاق التطبيق وإعادة فتحه، ثم حاول استرجاع المشتريات.',
    'fr':
        'Your session expired. Please close and reopen the app, then try Restore Purchases.',
  },
  'iapAlreadyLinkedAccount': {
    'en':
        'This purchase is already linked to an account. If you previously created an account (email/password), please Sign In to restore it — otherwise contact support@themuslimman.com if you need help.',
    'ar':
        'هذا الشراء مرتبط بالفعل بحساب. إذا كنت قد أنشأت حسابًا مسبقًا (بريد إلكتروني/كلمة مرور)، يرجى تسجيل الدخول لاسترجاعه — وإلا تواصل مع support@themuslimman.com إذا احتجت مساعدة.',
    'fr':
        'This purchase is already linked to an account. If you previously created an account (email/password), please Sign In to restore it — otherwise contact support@themuslimman.com if you need help.',
  },
  'iapCouldNotVerifyStore': {
    'en':
        'We could not verify this purchase with the store. Please try Restore Purchases, or contact support@themuslimman.com.',
    'ar':
        'تعذّر التحقق من هذا الشراء مع المتجر. حاول استرجاع المشتريات، أو تواصل مع support@themuslimman.com.',
    'fr':
        'We could not verify this purchase with the store. Please try Restore Purchases, or contact support@themuslimman.com.',
  },
  'iapVerificationFailedGeneric': {
    'en': 'Verification failed',
    'ar': 'فشل التحقق',
    'fr': 'Verification failed',
  },
  'iapAccessNotConfirmed': {
    'en':
        'Purchase was recorded but access could not be confirmed. Please contact support@themuslimman.com',
    'ar':
        'تم تسجيل الشراء ولكن تعذّر تأكيد الوصول. يرجى التواصل مع support@themuslimman.com',
    'fr':
        'Purchase was recorded but access could not be confirmed. Please contact support@themuslimman.com',
  },
  'refundableAppStore': {
    'en': 'Refundable via App Store',
    'ar': 'قابل للاسترداد عبر آب ستور',
    'fr': 'Refundable via App Store',
  },
  'refundableGooglePlay': {
    'en': 'Refundable via Google Play',
    'ar': 'قابل للاسترداد عبر جوجل بلاي',
    'fr': 'Refundable via Google Play',
  },
  'refund7DayGuarantee': {
    'en': '7-day refund guarantee',
    'ar': 'ضمان استرداد لمدة ٧ أيام',
    'fr': '7-day refund guarantee',
  },
  'refundAnswerIos': {
    'en':
        "Yes. Purchases are refunded through Apple — request one at reportaproblem.apple.com or via Settings > [your name] > Subscriptions on your device, generally within 90 days of purchase. We're also happy to help if you have any issues — just reach out.",
    'ar':
        'نعم. تتم عمليات استرداد الأموال عبر آبل — اطلب استردادًا عبر reportaproblem.apple.com أو من خلال الإعدادات > [اسمك] > الاشتراكات على جهازك، وذلك عادةً خلال ٩٠ يومًا من الشراء. نحن أيضًا سعداء بمساعدتك في أي مشكلة — فقط تواصل معنا.',
  },
  'refundAnswerAndroid': {
    'en':
        "Yes. Purchases are refunded through Google Play — request one from the Google Play app under Menu > Payments & subscriptions within 48 hours, or contact Google Play support after that. We're also happy to help if you have any issues — just reach out.",
    'ar':
        'نعم. تتم عمليات استرداد الأموال عبر جوجل بلاي — اطلب استردادًا من تطبيق جوجل بلاي عبر القائمة > الدفعات والاشتراكات خلال ٤٨ ساعة، أو تواصل مع دعم جوجل بلاي بعد ذلك. نحن أيضًا سعداء بمساعدتك في أي مشكلة — فقط تواصل معنا.',
  },
  'refundAnswerDefault': {
    'en':
        'Yes. If the course is not what you expected, contact us within 7 days for a full refund.',
    'ar':
        'نعم. إذا لم تكن الدورة كما توقعت، تواصل معنا خلال ٧ أيام للحصول على استرداد كامل.',
    'fr':
        'Yes. If the course is not what you expected, contact us within 7 days for a full refund.',
  },
  'stillSwitchingProfiles': {
    'en': 'Please wait — still switching profiles.',
    'ar': 'يرجى الانتظار — لا يزال تبديل الملفات جاريًا.',
    'fr': 'Please wait — still switching profiles.',
  },
  'couldNotSwitchProfile': {
    'en': 'Could not switch profile. Please try again.',
    'ar': 'تعذّر تبديل الملف الشخصي. حاول مرة أخرى.',
    'fr': 'Could not switch profile. Please try again.',
  },
  'stillAddingProfile': {
    'en': 'Please wait — still adding a profile.',
    'ar': 'يرجى الانتظار — لا تزال إضافة الملف جارية.',
    'fr': 'Please wait — still adding a profile.',
  },
  'couldNotCreateProfile': {
    'en': 'Could not create profile.',
    'ar': 'تعذّر إنشاء الملف الشخصي.',
    'fr': 'Could not create profile.',
  },
  'couldNotCreateProfileRetry': {
    'en': 'Could not create profile. Please try again.',
    'ar': 'تعذّر إنشاء الملف الشخصي. حاول مرة أخرى.',
    'fr': 'Could not create profile. Please try again.',
  },
  'stillDeletingProfile': {
    'en': 'Please wait — still deleting a profile.',
    'ar': 'يرجى الانتظار — لا يزال حذف الملف جاريًا.',
    'fr': 'Please wait — still deleting a profile.',
  },
  'couldNotDeleteProfile': {
    'en': 'Could not delete profile.',
    'ar': 'تعذّر حذف الملف الشخصي.',
    'fr': 'Could not delete profile.',
  },
  'couldNotDeleteProfileRetry': {
    'en': 'Could not delete profile. Please try again.',
    'ar': 'تعذّر حذف الملف الشخصي. حاول مرة أخرى.',
    'fr': 'Could not delete profile. Please try again.',
  },
  'stillRenamingProfile': {
    'en': 'Please wait — still renaming a profile.',
    'ar': 'يرجى الانتظار — لا تزال إعادة تسمية الملف جارية.',
    'fr': 'Please wait — still renaming a profile.',
  },
  'couldNotRenameProfile': {
    'en': 'Could not rename profile.',
    'ar': 'تعذّر إعادة تسمية الملف الشخصي.',
    'fr': 'Could not rename profile.',
  },
  'couldNotRenameProfileRetry': {
    'en': 'Could not rename profile. Please try again.',
    'ar': 'تعذّر إعادة تسمية الملف الشخصي. حاول مرة أخرى.',
    'fr': 'Could not rename profile. Please try again.',
  },
  'theMuslimMan': {
    'en': 'The Muslim Man',
    'ar': 'ذا مسلم مان',
    'fr': 'The Muslim Man',
  },
};

/// Looks up [key] for [lang], falling back to English (or the raw key if even
/// that's missing) so a typo never crashes the UI. English, Arabic, and the
/// hand-written French strings live in [_kStrings]. Every other course
/// language, and French strings that were still English, come from the
/// bundled pack loaded by [CoursePacks].
String t(String lang, String key) {
  final entry = _kStrings[key];
  final en = entry?['en'];
  if (lang != 'en' && lang != 'ar') {
    final hand = entry?[lang];
    final handIsTranslated = hand != null && hand.isNotEmpty && hand != en;
    if (!handIsTranslated) {
      final fromUi = CoursePacks.uiString(lang, key);
      if (fromUi != null) return localizeNumerals(lang, fromUi);
      if (en != null) {
        final fromPhrase = CoursePacks.phrase(lang, en);
        if (fromPhrase != en) return fromPhrase;
      }
    }
  }
  if (entry == null) return key;
  return localizeNumerals(lang, entry[lang] ?? en ?? key);
}

/// Inserts a store-formatted price. Apple and Google already localize the
/// amount and currency for the user's country, so the digits are left as-is.
String tWithStorePrice(String lang, String key, String price) {
  return t(
    lang,
    key,
  ).replaceAll('{only}', t(lang, 'only')).replaceAll('{price}', '\u200E$price');
}

/// Same as [t] but substitutes `{name}`-style placeholders from [vars].
/// Numbers are written in the course language's numerals.
String tv(String lang, String key, Map<String, Object?> vars) {
  final entry = _kStrings[key];
  var result = entry == null
      ? key
      : (lang == 'en' || lang == 'ar'
            ? (entry[lang] ?? entry['en'] ?? key)
            : _template(lang, key, entry));
  for (final item in vars.entries) {
    final value = item.value;
    final rendered = value is num
        ? formatCourseNumber(lang, value.toInt())
        : localizeNumerals(lang, '${value ?? ''}');
    result = result.replaceAll('{${item.key}}', rendered);
  }
  return localizeNumerals(lang, result);
}

String _template(String lang, String key, Map<String, String> entry) {
  final en = entry['en'];
  final hand = entry[lang];
  final handIsTranslated = hand != null && hand.isNotEmpty && hand != en;
  if (!handIsTranslated) {
    final fromUi = CoursePacks.uiString(lang, key);
    if (fromUi != null) return fromUi;
  }
  return hand ?? en ?? key;
}
