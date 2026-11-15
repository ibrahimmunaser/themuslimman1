package com.themuslimman.seerah.guard

import android.content.Context
import java.util.Locale

/**
 * Localized copy for the native App Guard block screen. The Flutter app
 * stores the user's chosen language in Flutter's SharedPreferences
 * (`flutter.seerah_course_lang`); this reads it so the guard screen speaks
 * the same language as the app.
 *
 * Order of every array: ar fr es de tr ur id ms hi bn fa ru zh sw.
 */
object GuardStrings {
    private val ORDER = listOf(
        "ar", "fr", "es", "de", "tr", "ur", "id", "ms", "hi", "bn", "fa", "ru", "zh", "sw",
    )

    private val TITLE = arrayOf(
        "الله يناديك", "Allah vous appelle", "Allah te llama", "Allah ruft dich",
        "Allah Seni Çağırıyor", "اللہ بلا رہا ہے", "Allah Memanggilmu", "Allah Memanggilmu",
        "अल्लाह बुला रहा है", "আল্লাহ ডাকছেন", "الله می‌خواند", "Аллах зовёт",
        "真主在召唤", "Allah Anakuita",
    )
    private val PRAYER = arrayOf(
        "الصلاة", "Prière", "Oración", "Gebet", "Namaz", "نماز", "Salat", "Solat",
        "नमाज़", "নামাজ", "نماز", "Молитва", "礼拜", "Swala",
    )
    private val HEADLINE = arrayOf(
        "تم حظر تطبيقاتك.\nقم وصلِّ.",
        "Vos applis ont été bloquées.\nLevez-vous et priez.",
        "Tus apps han sido bloqueadas.\nLevántate y ora.",
        "Deine Apps wurden gesperrt.\nSteh auf und bete.",
        "Uygulamalarınız engellendi.\nKalk ve namaz kıl.",
        "آپ کی ایپس بند کر دی گئی ہیں۔\nاٹھیں اور نماز پڑھیں۔",
        "Aplikasi Anda telah diblokir.\nBangun dan salatlah.",
        "Aplikasi anda telah disekat.\nBangun dan solatlah.",
        "आपके ऐप्स ब्लॉक कर दिए गए हैं।\nउठिए और नमाज़ पढ़िए।",
        "আপনার অ্যাপগুলো ব্লক করা হয়েছে।\nউঠুন এবং নামাজ পড়ুন।",
        "برنامه‌های شما مسدود شد.\nبرخیزید و نماز بخوانید.",
        "Ваши приложения заблокированы.\nВстаньте и помолитесь.",
        "您的应用已被屏蔽。\n起身去礼拜吧。",
        "Programu zako zimezuiwa.\nSimama uswali.",
    )
    private val UNLOCK_LABEL = arrayOf(
        "تُفتح تطبيقاتك بعد", "Vos applis se débloquent dans", "Tus apps se desbloquean en",
        "Deine Apps werden entsperrt in", "Uygulamalarınızın kilidi şu süre sonra açılır",
        "آپ کی ایپس کھلیں گی", "Aplikasi Anda terbuka dalam", "Aplikasi anda dibuka dalam",
        "आपके ऐप्स अनलॉक होंगे", "আপনার অ্যাপ খুলবে", "برنامه‌های شما باز می‌شوند تا",
        "Приложения разблокируются через", "应用将在以下时间后解锁",
        "Programu zako zitafunguliwa baada ya",
    )
    private val HINT_LOCKED = arrayOf(
        "اشعر بالنداء — {n} / {t} قبل أن تتمكن من الاختيار",
        "Ressentez l'appel — {n} / {t} avant de pouvoir choisir",
        "Siente el llamado — {n} / {t} antes de poder elegir",
        "Spüre den Ruf — {n} / {t}, bevor du wählen kannst",
        "Çağrıyı hisset — seçmeden önce {n} / {t}",
        "پکار کو محسوس کریں — انتخاب سے پہلے {n} / {t}",
        "Rasakan panggilannya — {n} / {t} sebelum Anda bisa memilih",
        "Rasai panggilan itu — {n} / {t} sebelum anda boleh memilih",
        "पुकार को महसूस करें — चुनने से पहले {n} / {t}",
        "আহ্বান অনুভব করুন — বেছে নেওয়ার আগে {n} / {t}",
        "ندا را حس کنید — {n} / {t} تا پیش از انتخاب",
        "Почувствуйте зов — {n} / {t}, прежде чем выбрать",
        "感受召唤 — 选择前 {n} / {t}",
        "Sikia wito — {n} / {t} kabla ya kuchagua",
    )
    private val HINT_UNLOCKED = arrayOf(
        "اضغط إجابة للذهاب إلى الصلاة — أو رفض للاستمرار في هذا التطبيق الآن",
        "Répondez pour aller prier — ou Refusez pour garder cette appli pour l'instant",
        "Responde para ir a orar — o Rechaza para conservar esta app por ahora",
        "Nimm an, um zu beten — oder lehne ab, um diese App vorerst zu behalten",
        "Namaza gitmek için Cevapla — ya da şimdilik bu uygulamayı kullanmak için Reddet",
        "نماز کے لیے جواب دیں — یا فی الحال یہ ایپ رکھنے کے لیے مسترد کریں",
        "Jawab untuk pergi salat — atau Tolak untuk tetap memakai aplikasi ini sementara",
        "Jawab untuk pergi solat — atau Tolak untuk terus guna aplikasi ini buat sementara",
        "नमाज़ के लिए जवाब दें — या अभी यह ऐप रखने के लिए अस्वीकार करें",
        "নামাজে যেতে উত্তর দিন — অথবা আপাতত এই অ্যাপ রাখতে প্রত্যাখ্যান করুন",
        "برای رفتن به نماز پاسخ دهید — یا برای ماندن در این برنامه فعلاً رد کنید",
        "Ответьте, чтобы пойти молиться, — или отклоните, чтобы пока остаться в этом приложении",
        "接听去礼拜——或拒绝暂时继续使用此应用",
        "Jibu ili kwenda kuswali — au Kataa kuendelea na programu hii kwa sasa",
    )
    private val DECLINE = arrayOf(
        "رفض", "Refuser", "Rechazar", "Ablehnen", "Reddet", "مسترد کریں", "Tolak", "Tolak",
        "अस्वीकार", "প্রত্যাখ্যান", "رد", "Отклонить", "拒绝", "Kataa",
    )
    private val ANSWER = arrayOf(
        "إجابة", "Répondre", "Responder", "Annehmen", "Cevapla", "جواب دیں", "Jawab", "Jawab",
        "जवाब दें", "উত্তর দিন", "پاسخ", "Ответить", "接听", "Jibu",
    )

    private val NOTIF_TITLE = arrayOf(
        "حماية وقت صلاة {p}", "Protection de l'heure de prière {p}",
        "Protegiendo tu hora de oración de {p}", "{p}-Gebetszeit wird geschützt",
        "{p} namaz vakti korunuyor", "{p} کے نماز کے وقت کی حفاظت",
        "Menjaga waktu salat {p} Anda", "Menjaga waktu solat {p} anda",
        "आपके {p} नमाज़ के समय की सुरक्षा", "আপনার {p} নামাজের সময় সুরক্ষিত",
        "محافظت از وقت نماز {p}", "Защита времени молитвы {p}",
        "正在守护您的{p}礼拜时间", "Inalinda wakati wako wa swala ya {p}",
    )
    private val NOTIF_TEXT = arrayOf(
        "ستعرض التطبيقات التي اخترتها «الله يناديك» خلال الدقائق القادمة.",
        "Les applis choisies afficheront « Allah vous appelle » pendant quelques minutes.",
        "Las apps que elegiste mostrarán «Allah te llama» durante unos minutos.",
        "Die gewählten Apps zeigen in den nächsten Minuten „Allah ruft dich“.",
        "Seçtiğiniz uygulamalar önümüzdeki birkaç dakika «Allah Seni Çağırıyor» gösterecek.",
        "آپ کی منتخب ایپس اگلے چند منٹ «اللہ بلا رہا ہے» دکھائیں گی۔",
        "Aplikasi pilihan Anda akan menampilkan «Allah Memanggilmu» beberapa menit ke depan.",
        "Aplikasi pilihan anda akan memaparkan «Allah Memanggilmu» untuk beberapa minit akan datang.",
        "आपके चुने ऐप्स अगले कुछ मिनट «अल्लाह बुला रहा है» दिखाएँगे।",
        "আপনার বাছাই করা অ্যাপগুলো আগামী কয়েক মিনিট «আল্লাহ ডাকছেন» দেখাবে।",
        "برنامه‌های انتخابی شما در چند دقیقهٔ آینده «الله می‌خواند» را نشان می‌دهند.",
        "Выбранные приложения в ближайшие минуты будут показывать «Аллах зовёт».",
        "您选择的应用在接下来的几分钟内将显示“真主在召唤”。",
        "Programu ulizochagua zitaonyesha «Allah Anakuita» kwa dakika chache zijazo.",
    )

    private val CHANNEL_NAME = arrayOf(
        "حراسة التطبيقات", "Protéger les applis", "Proteger apps", "Apps sperren",
        "Uygulamaları koru", "ایپس کی نگرانی", "Jaga aplikasi", "Kawal aplikasi",
        "ऐप्स की सुरक्षा", "অ্যাপ সুরক্ষা", "محافظت از برنامه‌ها", "Защита приложений",
        "守护应用", "Linda programu",
    )
    private val CHANNEL_DESC = arrayOf(
        "يظهر أثناء حراسة التطبيقات التي اخترتها خلال وقت الصلاة.",
        "S'affiche pendant que les applis choisies sont protégées durant la prière.",
        "Se muestra mientras las apps elegidas están protegidas durante la oración.",
        "Wird angezeigt, solange die gewählten Apps im Gebetsfenster gesperrt sind.",
        "Seçtiğiniz uygulamalar namaz penceresinde korunurken görünür.",
        "نماز کے وقت میں آپ کی چنی ہوئی ایپس کی نگرانی کے دوران دکھائی دیتا ہے۔",
        "Tampil selama aplikasi pilihan Anda dijaga pada jendela waktu salat.",
        "Dipaparkan semasa aplikasi pilihan anda dikawal dalam tempoh waktu solat.",
        "नमाज़ की अवधि में आपके चुने ऐप्स की सुरक्षा के दौरान दिखता है।",
        "নামাজের সময়ে আপনার বাছাই করা অ্যাপ সুরক্ষিত থাকাকালীন দেখায়।",
        "در بازهٔ نماز، هنگام محافظت از برنامه‌های انتخابی شما نمایش داده می‌شود.",
        "Показывается, пока выбранные приложения защищены в период молитвы.",
        "在礼拜时段内守护您所选应用时显示。",
        "Huonekana wakati programu ulizochagua zinalindwa katika kipindi cha swala.",
    )

    fun channelName(lang: String) = pick(lang, CHANNEL_NAME, "App Guard")
    fun channelDescription(lang: String) =
        pick(lang, CHANNEL_DESC, "Shows while apps you chose are guarded during a prayer window.")

    fun notifTitle(lang: String, prayerRaw: String): String {
        val name = prayerName(lang, prayerRaw) ?: prayerRaw
        return pick(lang, NOTIF_TITLE, "Guarding your {p} prayer time").replace("{p}", name)
    }

    fun notifText(lang: String) =
        pick(lang, NOTIF_TEXT, "Apps you chose will show \"Allah is calling\" for the next few minutes.")

    private val PRAYER_NAMES = mapOf(
        "fajr" to arrayOf("الفجر", "Fajr", "Fajr", "Fadschr", "Sabah", "فجر", "Subuh", "Subuh", "फ़ज्र", "ফজর", "صبح", "Фаджр", "晨礼", "Alfajiri"),
        "dhuhr" to arrayOf("الظهر", "Dhor", "Dhuhr", "Dhuhr", "Öğle", "ظہر", "Zuhur", "Zohor", "ज़ुहर", "যোহর", "ظهر", "Зухр", "晌礼", "Adhuhuri"),
        "asr" to arrayOf("العصر", "Asr", "Asr", "Asr", "İkindi", "عصر", "Asar", "Asar", "अस्र", "আসর", "عصر", "Аср", "晡礼", "Alasiri"),
        "maghrib" to arrayOf("المغرب", "Maghrib", "Magrib", "Maghrib", "Akşam", "مغرب", "Magrib", "Maghrib", "मग़रिब", "মাগরিব", "مغرب", "Магриб", "昏礼", "Magharibi"),
        "isha" to arrayOf("العشاء", "Isha", "Isha", "Ischa", "Yatsı", "عشاء", "Isya", "Isyak", "इशा", "ইশা", "عشا", "Иша", "宵礼", "Isha"),
    )

    private val DIGITS = mapOf(
        "ar" to "٠١٢٣٤٥٦٧٨٩",
        "fa" to "۰۱۲۳۴۵۶۷۸۹",
        "ur" to "۰۱۲۳۴۵۶۷۸۹",
        "bn" to "০১২৩৪৫৬৭৮৯",
        "hi" to "०१२३४५६७८९",
    )

    /** The app's selected language, or "en" when unset/unknown. */
    fun language(context: Context): String {
        return try {
            val prefs = context.getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
            val saved = prefs.getString("flutter.seerah_course_lang", null)
            if (saved != null && (saved == "en" || ORDER.contains(saved))) saved else "en"
        } catch (_: Exception) {
            "en"
        }
    }

    private fun pick(lang: String, table: Array<String>, en: String): String {
        val i = ORDER.indexOf(lang)
        return if (i < 0) en else table[i]
    }

    fun title(lang: String) = pick(lang, TITLE, "Allah Is Calling")
    fun prayerFallback(lang: String) = pick(lang, PRAYER, "Prayer")
    fun headline(lang: String) = pick(lang, HEADLINE, "Your apps have been blocked.\nGet up and pray.")
    fun unlockLabel(lang: String) = pick(lang, UNLOCK_LABEL, "Your apps unlock in")
    fun decline(lang: String) = pick(lang, DECLINE, "Decline")
    fun answer(lang: String) = pick(lang, ANSWER, "Answer")
    fun hintUnlocked(lang: String) =
        pick(lang, HINT_UNLOCKED, "Answer to go pray — or Decline to keep this app for now")

    fun hintLocked(lang: String, done: Int, total: Int): String {
        val tpl = pick(lang, HINT_LOCKED, "Feel the call — {n} / {t} before you can choose")
        return tpl.replace("{n}", digits(lang, done.toString())).replace("{t}", digits(lang, total.toString()))
    }

    /** Localized prayer name for "Fajr"/"Dhuhr"/…; null when [raw] is not a known prayer. */
    fun prayerName(lang: String, raw: String): String? {
        val row = PRAYER_NAMES[raw.lowercase(Locale.US)] ?: return null
        val i = ORDER.indexOf(lang)
        return if (i < 0) null else row[i]
    }

    fun digits(lang: String, text: String): String {
        val d = DIGITS[lang] ?: return text
        val sb = StringBuilder()
        for (c in text) {
            if (c in '0'..'9') sb.append(d[c - '0']) else sb.append(c)
        }
        return sb.toString()
    }

    fun locale(lang: String): Locale = Locale.forLanguageTag(lang)
}
