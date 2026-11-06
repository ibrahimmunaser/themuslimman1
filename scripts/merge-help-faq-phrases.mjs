// One-off migration: add Help/FAQ (and ContactSupportForm) English phrase keys
// to the 12 shell phrase packs (id, ms, zh, ru, sw, es, de, tr, hi, ur, bn, fa).
// Existing keys are never overwritten. Run with: node scripts/merge-help-faq-phrases.mjs
import fs from "fs";
import path from "path";

const dir = "data/i18n/shell";

const TRANSLATIONS = {
  id: {
    "Account & Billing": "Akun & Penagihan",
    "Course Access": "Akses Kursus",
    Certificate: "Sertifikat",
    "How do I access my course?": "Bagaimana cara mengakses kursus saya?",
    "After purchasing, you can access your course from the Dashboard or My Courses page. Simply click on the course card to start learning.":
      "Setelah pembelian, Anda dapat mengakses kursus dari halaman Dashboard atau Kursus Saya. Cukup klik kartu kursus untuk mulai belajar.",
    "What does Complete Seerah Early Access include?":
      "Apa saja yang termasuk dalam Akses Awal Complete Seerah?",
    "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking. Full access from day one.":
      "Anda mendapatkan perjalanan Seerah lengkap 100 bagian: pelajaran video, ringkasan, kuis, flashcard, peta pikiran, sumber visual, panduan belajar, laporan, dan pelacakan kemajuan terarah. Akses penuh sejak hari pertama.",
    "How are lessons structured?": "Bagaimana struktur pelajarannya?",
    "Each part includes a video lesson, briefing, study guide, flashcards, quiz, mind map, slides, infographics, and reports — everything you need to learn, review, and retain each part.":
      "Setiap bagian meliputi pelajaran video, ringkasan, panduan belajar, flashcard, kuis, peta pikiran, slide, infografis, dan laporan — semua yang Anda butuhkan untuk belajar, mengulas, dan mengingat setiap bagian.",
    "What payment options are available?": "Opsi pembayaran apa yang tersedia?",
    "What's your refund policy?": "Apa kebijakan pengembalian dana Anda?",
    "We offer a 7-Day Clarity Guarantee. If the course isn't what you expected, email us within 7 days for a full refund.":
      "Kami menawarkan Garansi Kejelasan 7 Hari. Jika kursus ini tidak seperti yang Anda harapkan, kirim email kepada kami dalam 7 hari untuk pengembalian dana penuh.",
    "Can I access parts in any order?": "Bisakah saya mengakses bagian dalam urutan apa pun?",
    "Yes — all 100 parts are immediately accessible once your plan is active. You can jump to any lesson at any time. The parts are numbered to help you follow the Seerah chronologically, but there are no locks or requirements between lessons.":
      "Ya — semua 100 bagian langsung dapat diakses setelah paket Anda aktif. Anda dapat melompat ke pelajaran mana pun kapan saja. Bagian-bagian diberi nomor untuk membantu Anda mengikuti Seerah secara kronologis, tetapi tidak ada kunci atau persyaratan antar pelajaran.",
    "Can I access lessons on mobile?": "Bisakah saya mengakses pelajaran di ponsel?",
    "Yes. The course is fully responsive and works on all devices including phones and tablets.":
      "Ya. Kursus ini sepenuhnya responsif dan berfungsi di semua perangkat termasuk ponsel dan tablet.",
    "How do I earn a certificate?": "Bagaimana cara mendapatkan sertifikat?",
    "Complete all required lessons in your plan. Complete users must also pass all quizzes with at least 70%. Your certificate will then be available in the Certificate section.":
      "Selesaikan semua pelajaran yang diperlukan dalam paket Anda. Pengguna Complete juga harus lulus semua kuis dengan nilai minimal 70%. Sertifikat Anda kemudian akan tersedia di bagian Sertifikat.",
    "Is the certificate official?": "Apakah sertifikatnya resmi?",
    "Yes, it's an official certificate of completion from The Muslim Man showing you've completed Complete Seerah.":
      "Ya, ini adalah sertifikat penyelesaian resmi dari The Muslim Man yang menunjukkan Anda telah menyelesaikan Complete Seerah.",
    "Lifetime access is": "Akses seumur hidup adalah",
    "one-time — permanent access with no recurring charges. Pay once and keep the full course forever.":
      "satu kali pembayaran — akses permanen tanpa biaya berulang. Bayar sekali dan simpan kursus lengkap selamanya.",
    "Please fill in all fields": "Harap isi semua kolom",
    "Failed to send message": "Gagal mengirim pesan",
    "Failed to send message. Please try again.": "Gagal mengirim pesan. Silakan coba lagi.",
    "Message Sent!": "Pesan Terkirim!",
    "We've received your message and will get back to you as soon as possible.":
      "Kami telah menerima pesan Anda dan akan menghubungi Anda sesegera mungkin.",
    "Need More Help?": "Butuh Bantuan Lebih?",
    "Can't find what you're looking for? Our support team is here to help.":
      "Tidak menemukan yang Anda cari? Tim dukungan kami siap membantu.",
    Subject: "Subjek",
    "What do you need help with?": "Apa yang Anda butuhkan bantuannya?",
    Message: "Pesan",
    "Describe your issue or question...": "Jelaskan masalah atau pertanyaan Anda...",
    "Sending...": "Mengirim...",
    "Send Message": "Kirim Pesan",
  },

  ms: {
    "Account & Billing": "Akaun & Pengebilan",
    "Course Access": "Akses Kursus",
    Certificate: "Sijil",
    "How do I access my course?": "Bagaimana saya mengakses kursus saya?",
    "After purchasing, you can access your course from the Dashboard or My Courses page. Simply click on the course card to start learning.":
      "Selepas pembelian, anda boleh mengakses kursus anda daripada halaman Papan Pemuka atau Kursus Saya. Hanya klik kad kursus untuk mula belajar.",
    "What does Complete Seerah Early Access include?":
      "Apa yang disertakan dalam Akses Awal Complete Seerah?",
    "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking. Full access from day one.":
      "Anda mendapat perjalanan Seerah penuh 100 bahagian: pelajaran video, taklimat, kuiz, kad imbasan, peta minda, sumber visual, panduan belajar, laporan, dan penjejakan kemajuan berpandu. Akses penuh dari hari pertama.",
    "How are lessons structured?": "Bagaimana pelajaran disusun?",
    "Each part includes a video lesson, briefing, study guide, flashcards, quiz, mind map, slides, infographics, and reports — everything you need to learn, review, and retain each part.":
      "Setiap bahagian merangkumi pelajaran video, taklimat, panduan belajar, kad imbasan, kuiz, peta minda, slaid, infografik, dan laporan — segala yang anda perlukan untuk belajar, mengulang kaji, dan mengingati setiap bahagian.",
    "What payment options are available?": "Apakah pilihan pembayaran yang tersedia?",
    "What's your refund policy?": "Apakah dasar bayaran balik anda?",
    "We offer a 7-Day Clarity Guarantee. If the course isn't what you expected, email us within 7 days for a full refund.":
      "Kami menawarkan Jaminan Kejelasan 7 Hari. Jika kursus ini tidak seperti yang anda jangkakan, e-mel kami dalam tempoh 7 hari untuk bayaran balik penuh.",
    "Can I access parts in any order?": "Bolehkah saya mengakses bahagian dalam sebarang susunan?",
    "Yes — all 100 parts are immediately accessible once your plan is active. You can jump to any lesson at any time. The parts are numbered to help you follow the Seerah chronologically, but there are no locks or requirements between lessons.":
      "Ya — semua 100 bahagian boleh diakses serta-merta sebaik sahaja pelan anda aktif. Anda boleh melompat ke mana-mana pelajaran pada bila-bila masa. Bahagian-bahagian dinomborkan untuk membantu anda mengikuti Seerah secara kronologi, tetapi tiada kunci atau keperluan antara pelajaran.",
    "Can I access lessons on mobile?": "Bolehkah saya mengakses pelajaran di telefon mudah alih?",
    "Yes. The course is fully responsive and works on all devices including phones and tablets.":
      "Ya. Kursus ini responsif sepenuhnya dan berfungsi pada semua peranti termasuk telefon dan tablet.",
    "How do I earn a certificate?": "Bagaimana saya mendapat sijil?",
    "Complete all required lessons in your plan. Complete users must also pass all quizzes with at least 70%. Your certificate will then be available in the Certificate section.":
      "Lengkapkan semua pelajaran yang diperlukan dalam pelan anda. Pengguna Complete juga mesti lulus semua kuiz dengan sekurang-kurangnya 70%. Sijil anda kemudian akan tersedia dalam bahagian Sijil.",
    "Is the certificate official?": "Adakah sijil itu rasmi?",
    "Yes, it's an official certificate of completion from The Muslim Man showing you've completed Complete Seerah.":
      "Ya, ia adalah sijil penyiapan rasmi daripada The Muslim Man yang menunjukkan anda telah menamatkan Complete Seerah.",
    "Lifetime access is": "Akses seumur hidup adalah",
    "one-time — permanent access with no recurring charges. Pay once and keep the full course forever.":
      "sekali bayaran — akses kekal tanpa caj berulang. Bayar sekali dan simpan kursus penuh selama-lamanya.",
    "Please fill in all fields": "Sila isi semua ruangan",
    "Failed to send message": "Gagal menghantar mesej",
    "Failed to send message. Please try again.": "Gagal menghantar mesej. Sila cuba lagi.",
    "Message Sent!": "Mesej Dihantar!",
    "We've received your message and will get back to you as soon as possible.":
      "Kami telah menerima mesej anda dan akan menghubungi anda secepat mungkin.",
    "Need More Help?": "Perlukan Bantuan Lanjut?",
    "Can't find what you're looking for? Our support team is here to help.":
      "Tidak menemui apa yang anda cari? Pasukan sokongan kami sedia membantu.",
    Subject: "Subjek",
    "What do you need help with?": "Apa yang anda perlukan bantuan?",
    Message: "Mesej",
    "Describe your issue or question...": "Terangkan isu atau soalan anda...",
    "Sending...": "Menghantar...",
    "Send Message": "Hantar Mesej",
  },

  zh: {
    "Account & Billing": "账户与账单",
    "Course Access": "课程访问",
    Certificate: "证书",
    "How do I access my course?": "我如何访问我的课程？",
    "After purchasing, you can access your course from the Dashboard or My Courses page. Simply click on the course card to start learning.":
      "购买后，您可以从仪表盘或“我的课程”页面访问您的课程。只需点击课程卡片即可开始学习。",
    "What does Complete Seerah Early Access include?": "“完整先知传记”抢先体验包含什么？",
    "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking. Full access from day one.":
      "您将获得完整的100集先知传记之旅：视频课程、简报、测验、速记卡、思维导图、视觉资源、学习指南、报告以及引导式进度跟踪。第一天即可完全访问。",
    "How are lessons structured?": "课程是如何构建的？",
    "Each part includes a video lesson, briefing, study guide, flashcards, quiz, mind map, slides, infographics, and reports — everything you need to learn, review, and retain each part.":
      "每一部分都包括视频课程、简报、学习指南、速记卡、测验、思维导图、幻灯片、信息图表和报告——学习、复习和巩固每一部分所需的一切。",
    "What payment options are available?": "有哪些付款方式？",
    "What's your refund policy?": "你们的退款政策是什么？",
    "We offer a 7-Day Clarity Guarantee. If the course isn't what you expected, email us within 7 days for a full refund.":
      "我们提供7天清晰保证。如果课程不符合您的预期，请在7天内发送电子邮件给我们以获得全额退款。",
    "Can I access parts in any order?": "我可以按任何顺序访问各部分吗？",
    "Yes — all 100 parts are immediately accessible once your plan is active. You can jump to any lesson at any time. The parts are numbered to help you follow the Seerah chronologically, but there are no locks or requirements between lessons.":
      "可以——一旦您的计划激活，全部100个部分即可立即访问。您可以随时跳转到任何课程。各部分已编号以帮助您按时间顺序学习先知传记，但课程之间没有锁定或要求。",
    "Can I access lessons on mobile?": "我可以在手机上访问课程吗？",
    "Yes. The course is fully responsive and works on all devices including phones and tablets.":
      "可以。该课程完全自适应，适用于包括手机和平板电脑的所有设备。",
    "How do I earn a certificate?": "我如何获得证书？",
    "Complete all required lessons in your plan. Complete users must also pass all quizzes with at least 70%. Your certificate will then be available in the Certificate section.":
      "完成您计划中所有必修课程。完整版用户还必须以至少70%的成绩通过所有测验。之后，您的证书将在证书部分提供。",
    "Is the certificate official?": "该证书是正式的吗？",
    "Yes, it's an official certificate of completion from The Muslim Man showing you've completed Complete Seerah.":
      "是的，这是来自The Muslim Man的官方完成证书，表明您已完成“完整先知传记”课程。",
    "Lifetime access is": "终身访问价格为",
    "one-time — permanent access with no recurring charges. Pay once and keep the full course forever.":
      "一次性付费——永久访问，无需重复收费。只需支付一次，即可永久保留整个课程。",
    "Please fill in all fields": "请填写所有字段",
    "Failed to send message": "发送消息失败",
    "Failed to send message. Please try again.": "发送消息失败。请重试。",
    "Message Sent!": "消息已发送！",
    "We've received your message and will get back to you as soon as possible.":
      "我们已收到您的消息，将尽快与您联系。",
    "Need More Help?": "需要更多帮助？",
    "Can't find what you're looking for? Our support team is here to help.":
      "找不到您需要的内容？我们的支持团队随时为您提供帮助。",
    Subject: "主题",
    "What do you need help with?": "您需要什么方面的帮助？",
    Message: "消息",
    "Describe your issue or question...": "描述您的问题...",
    "Sending...": "发送中...",
    "Send Message": "发送消息",
  },

  ru: {
    "Account & Billing": "Аккаунт и оплата",
    "Course Access": "Доступ к курсу",
    Certificate: "Сертификат",
    "How do I access my course?": "Как мне получить доступ к курсу?",
    "After purchasing, you can access your course from the Dashboard or My Courses page. Simply click on the course card to start learning.":
      "После покупки вы можете получить доступ к курсу на странице Панели управления или «Мои курсы». Просто нажмите на карточку курса, чтобы начать обучение.",
    "What does Complete Seerah Early Access include?": "Что включает ранний доступ к Complete Seerah?",
    "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking. Full access from day one.":
      "Вы получаете полное путешествие по Сире из 100 частей: видеоуроки, брифинги, тесты, карточки, карты памяти, визуальные материалы, учебные пособия, отчёты и отслеживание прогресса. Полный доступ с первого дня.",
    "How are lessons structured?": "Как устроены уроки?",
    "Each part includes a video lesson, briefing, study guide, flashcards, quiz, mind map, slides, infographics, and reports — everything you need to learn, review, and retain each part.":
      "Каждая часть включает видеоурок, брифинг, учебное пособие, карточки, тест, карту памяти, слайды, инфографику и отчёты — всё, что нужно для изучения, повторения и закрепления каждой части.",
    "What payment options are available?": "Какие варианты оплаты доступны?",
    "What's your refund policy?": "Какая у вас политика возврата средств?",
    "We offer a 7-Day Clarity Guarantee. If the course isn't what you expected, email us within 7 days for a full refund.":
      "Мы предоставляем 7-дневную гарантию ясности. Если курс не оправдал ваших ожиданий, напишите нам в течение 7 дней для полного возврата средств.",
    "Can I access parts in any order?": "Могу ли я получить доступ к частям в любом порядке?",
    "Yes — all 100 parts are immediately accessible once your plan is active. You can jump to any lesson at any time. The parts are numbered to help you follow the Seerah chronologically, but there are no locks or requirements between lessons.":
      "Да — все 100 частей становятся доступны сразу после активации вашего плана. Вы можете перейти к любому уроку в любое время. Части пронумерованы, чтобы помочь вам следовать Сире в хронологическом порядке, но между уроками нет блокировок или требований.",
    "Can I access lessons on mobile?": "Могу ли я проходить уроки на мобильном устройстве?",
    "Yes. The course is fully responsive and works on all devices including phones and tablets.":
      "Да. Курс полностью адаптивен и работает на всех устройствах, включая телефоны и планшеты.",
    "How do I earn a certificate?": "Как мне получить сертификат?",
    "Complete all required lessons in your plan. Complete users must also pass all quizzes with at least 70%. Your certificate will then be available in the Certificate section.":
      "Завершите все обязательные уроки в вашем плане. Пользователям с планом Complete также необходимо пройти все тесты с результатом не менее 70%. После этого ваш сертификат будет доступен в разделе «Сертификат».",
    "Is the certificate official?": "Этот сертификат официальный?",
    "Yes, it's an official certificate of completion from The Muslim Man showing you've completed Complete Seerah.":
      "Да, это официальный сертификат о завершении от The Muslim Man, подтверждающий, что вы завершили курс Complete Seerah.",
    "Lifetime access is": "Пожизненный доступ стоит",
    "one-time — permanent access with no recurring charges. Pay once and keep the full course forever.":
      "разовый платёж — постоянный доступ без повторяющихся платежей. Заплатите один раз и сохраните полный курс навсегда.",
    "Please fill in all fields": "Пожалуйста, заполните все поля",
    "Failed to send message": "Не удалось отправить сообщение",
    "Failed to send message. Please try again.": "Не удалось отправить сообщение. Пожалуйста, попробуйте снова.",
    "Message Sent!": "Сообщение отправлено!",
    "We've received your message and will get back to you as soon as possible.":
      "Мы получили ваше сообщение и свяжемся с вами как можно скорее.",
    "Need More Help?": "Нужна дополнительная помощь?",
    "Can't find what you're looking for? Our support team is here to help.":
      "Не нашли то, что искали? Наша служба поддержки готова помочь.",
    Subject: "Тема",
    "What do you need help with?": "С чем вам нужна помощь?",
    Message: "Сообщение",
    "Describe your issue or question...": "Опишите вашу проблему или вопрос...",
    "Sending...": "Отправка...",
    "Send Message": "Отправить сообщение",
  },

  sw: {
    "Account & Billing": "Akaunti na Malipo",
    "Course Access": "Ufikiaji wa Kozi",
    Certificate: "Cheti",
    "How do I access my course?": "Ninawezaje kufikia kozi yangu?",
    "After purchasing, you can access your course from the Dashboard or My Courses page. Simply click on the course card to start learning.":
      "Baada ya kununua, unaweza kufikia kozi yako kutoka kwenye ukurasa wa Dashibodi au Kozi Zangu. Bonyeza tu kadi ya kozi kuanza kujifunza.",
    "What does Complete Seerah Early Access include?": "Ufikiaji wa Mapema wa Complete Seerah unajumuisha nini?",
    "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking. Full access from day one.":
      "Unapata safari kamili ya Seerah ya sehemu 100: masomo ya video, maelezo mafupi, maswali, kadi za kukariri, michoro ya akili, rasilimali za picha, miongozo ya masomo, ripoti, na ufuatiliaji wa maendeleo ulioongozwa. Ufikiaji kamili kuanzia siku ya kwanza.",
    "How are lessons structured?": "Masomo yamepangwaje?",
    "Each part includes a video lesson, briefing, study guide, flashcards, quiz, mind map, slides, infographics, and reports — everything you need to learn, review, and retain each part.":
      "Kila sehemu inajumuisha somo la video, maelezo mafupi, mwongozo wa masomo, kadi za kukariri, maswali, mchoro wa akili, slaidi, infographics, na ripoti — kila kitu unachohitaji kujifunza, kupitia upya, na kukumbuka kila sehemu.",
    "What payment options are available?": "Chaguo zipi za malipo zinapatikana?",
    "What's your refund policy?": "Sera yako ya kurejesha fedha ni ipi?",
    "We offer a 7-Day Clarity Guarantee. If the course isn't what you expected, email us within 7 days for a full refund.":
      "Tunatoa Dhamana ya Uwazi ya Siku 7. Ikiwa kozi hii si kama ulivyotarajia, tutumie barua pepe ndani ya siku 7 kupata marejesho kamili ya fedha.",
    "Can I access parts in any order?": "Je, ninaweza kufikia sehemu kwa mpangilio wowote?",
    "Yes — all 100 parts are immediately accessible once your plan is active. You can jump to any lesson at any time. The parts are numbered to help you follow the Seerah chronologically, but there are no locks or requirements between lessons.":
      "Ndiyo — sehemu zote 100 zinapatikana mara moja mpango wako ukiwa hai. Unaweza kurukia somo lolote wakati wowote. Sehemu zimepewa namba kukusaidia kufuata Seerah kwa mpangilio wa matukio, lakini hakuna vizuizi au mahitaji kati ya masomo.",
    "Can I access lessons on mobile?": "Je, ninaweza kufikia masomo kwenye simu?",
    "Yes. The course is fully responsive and works on all devices including phones and tablets.":
      "Ndiyo. Kozi hii inajibu kikamilifu na inafanya kazi kwenye vifaa vyote ikiwa ni pamoja na simu na kompyuta kibao.",
    "How do I earn a certificate?": "Ninawezaje kupata cheti?",
    "Complete all required lessons in your plan. Complete users must also pass all quizzes with at least 70%. Your certificate will then be available in the Certificate section.":
      "Kamilisha masomo yote yanayohitajika katika mpango wako. Watumiaji wa Complete pia wanapaswa kufaulu maswali yote kwa angalau 70%. Cheti chako kitapatikana kisha katika sehemu ya Cheti.",
    "Is the certificate official?": "Je, cheti hiki ni rasmi?",
    "Yes, it's an official certificate of completion from The Muslim Man showing you've completed Complete Seerah.":
      "Ndiyo, ni cheti rasmi cha kukamilisha kutoka The Muslim Man kinachothibitisha kuwa umekamilisha Complete Seerah.",
    "Lifetime access is": "Ufikiaji wa maisha yote ni",
    "one-time — permanent access with no recurring charges. Pay once and keep the full course forever.":
      "malipo ya mara moja — ufikiaji wa kudumu bila malipo yanayojirudia. Lipa mara moja na uhifadhi kozi kamili milele.",
    "Please fill in all fields": "Tafadhali jaza sehemu zote",
    "Failed to send message": "Imeshindwa kutuma ujumbe",
    "Failed to send message. Please try again.": "Imeshindwa kutuma ujumbe. Tafadhali jaribu tena.",
    "Message Sent!": "Ujumbe Umetumwa!",
    "We've received your message and will get back to you as soon as possible.":
      "Tumepokea ujumbe wako na tutawasiliana nawe haraka iwezekanavyo.",
    "Need More Help?": "Unahitaji Msaada Zaidi?",
    "Can't find what you're looking for? Our support team is here to help.":
      "Hauwezi kupata unachokitafuta? Timu yetu ya usaidizi iko hapa kukusaidia.",
    Subject: "Kichwa cha Habari",
    "What do you need help with?": "Unahitaji usaidizi gani?",
    Message: "Ujumbe",
    "Describe your issue or question...": "Elezea tatizo lako au swali lako...",
    "Sending...": "Inatuma...",
    "Send Message": "Tuma Ujumbe",
  },

  es: {
    "Account & Billing": "Cuenta y Facturación",
    "Course Access": "Acceso al Curso",
    Certificate: "Certificado",
    "How do I access my course?": "¿Cómo accedo a mi curso?",
    "After purchasing, you can access your course from the Dashboard or My Courses page. Simply click on the course card to start learning.":
      "Después de la compra, puedes acceder a tu curso desde el Panel o la página Mis Cursos. Simplemente haz clic en la tarjeta del curso para empezar a aprender.",
    "What does Complete Seerah Early Access include?": "¿Qué incluye el Acceso Anticipado de Complete Seerah?",
    "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking. Full access from day one.":
      "Obtienes el recorrido completo de la Seerah en 100 partes: lecciones en video, resúmenes, cuestionarios, tarjetas de memoria, mapas mentales, recursos visuales, guías de estudio, informes y seguimiento guiado del progreso. Acceso completo desde el primer día.",
    "How are lessons structured?": "¿Cómo están estructuradas las lecciones?",
    "Each part includes a video lesson, briefing, study guide, flashcards, quiz, mind map, slides, infographics, and reports — everything you need to learn, review, and retain each part.":
      "Cada parte incluye una lección en video, un resumen, una guía de estudio, tarjetas de memoria, un cuestionario, un mapa mental, diapositivas, infografías e informes, todo lo que necesitas para aprender, repasar y retener cada parte.",
    "What payment options are available?": "¿Qué opciones de pago están disponibles?",
    "What's your refund policy?": "¿Cuál es su política de reembolso?",
    "We offer a 7-Day Clarity Guarantee. If the course isn't what you expected, email us within 7 days for a full refund.":
      "Ofrecemos una Garantía de Claridad de 7 días. Si el curso no es lo que esperabas, envíanos un correo dentro de 7 días para obtener un reembolso completo.",
    "Can I access parts in any order?": "¿Puedo acceder a las partes en cualquier orden?",
    "Yes — all 100 parts are immediately accessible once your plan is active. You can jump to any lesson at any time. The parts are numbered to help you follow the Seerah chronologically, but there are no locks or requirements between lessons.":
      "Sí — las 100 partes son accesibles de inmediato una vez que tu plan está activo. Puedes saltar a cualquier lección en cualquier momento. Las partes están numeradas para ayudarte a seguir la Seerah cronológicamente, pero no hay bloqueos ni requisitos entre lecciones.",
    "Can I access lessons on mobile?": "¿Puedo acceder a las lecciones desde el móvil?",
    "Yes. The course is fully responsive and works on all devices including phones and tablets.":
      "Sí. El curso es totalmente responsivo y funciona en todos los dispositivos, incluidos teléfonos y tabletas.",
    "How do I earn a certificate?": "¿Cómo obtengo un certificado?",
    "Complete all required lessons in your plan. Complete users must also pass all quizzes with at least 70%. Your certificate will then be available in the Certificate section.":
      "Completa todas las lecciones requeridas en tu plan. Los usuarios Complete también deben aprobar todos los cuestionarios con al menos un 70%. Tu certificado estará disponible en la sección Certificado.",
    "Is the certificate official?": "¿El certificado es oficial?",
    "Yes, it's an official certificate of completion from The Muslim Man showing you've completed Complete Seerah.":
      "Sí, es un certificado oficial de finalización de The Muslim Man que demuestra que has completado Complete Seerah.",
    "Lifetime access is": "El acceso de por vida es",
    "one-time — permanent access with no recurring charges. Pay once and keep the full course forever.":
      "pago único: acceso permanente sin cargos recurrentes. Paga una vez y conserva el curso completo para siempre.",
    "Please fill in all fields": "Por favor completa todos los campos",
    "Failed to send message": "No se pudo enviar el mensaje",
    "Failed to send message. Please try again.": "No se pudo enviar el mensaje. Por favor, inténtalo de nuevo.",
    "Message Sent!": "¡Mensaje enviado!",
    "We've received your message and will get back to you as soon as possible.":
      "Hemos recibido tu mensaje y te responderemos lo antes posible.",
    "Need More Help?": "¿Necesitas más ayuda?",
    "Can't find what you're looking for? Our support team is here to help.":
      "¿No encuentras lo que buscas? Nuestro equipo de soporte está aquí para ayudarte.",
    Subject: "Asunto",
    "What do you need help with?": "¿Con qué necesitas ayuda?",
    Message: "Mensaje",
    "Describe your issue or question...": "Describe tu problema o pregunta...",
    "Sending...": "Enviando...",
    "Send Message": "Enviar Mensaje",
  },

  de: {
    "Account & Billing": "Konto & Abrechnung",
    "Course Access": "Kurszugang",
    Certificate: "Zertifikat",
    "How do I access my course?": "Wie greife ich auf meinen Kurs zu?",
    "After purchasing, you can access your course from the Dashboard or My Courses page. Simply click on the course card to start learning.":
      "Nach dem Kauf können Sie über das Dashboard oder die Seite „Meine Kurse“ auf Ihren Kurs zugreifen. Klicken Sie einfach auf die Kurskarte, um mit dem Lernen zu beginnen.",
    "What does Complete Seerah Early Access include?": "Was beinhaltet der Complete Seerah Early Access?",
    "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking. Full access from day one.":
      "Sie erhalten die vollständige Seerah-Reise in 100 Teilen: Videolektionen, Briefings, Quizze, Lernkarten, Mindmaps, visuelle Ressourcen, Studienleitfäden, Berichte und geführte Fortschrittsverfolgung. Voller Zugang von Tag eins an.",
    "How are lessons structured?": "Wie sind die Lektionen aufgebaut?",
    "Each part includes a video lesson, briefing, study guide, flashcards, quiz, mind map, slides, infographics, and reports — everything you need to learn, review, and retain each part.":
      "Jeder Teil umfasst eine Videolektion, ein Briefing, einen Studienleitfaden, Lernkarten, ein Quiz, eine Mindmap, Folien, Infografiken und Berichte — alles, was Sie brauchen, um jeden Teil zu lernen, zu wiederholen und zu behalten.",
    "What payment options are available?": "Welche Zahlungsoptionen sind verfügbar?",
    "What's your refund policy?": "Wie lautet Ihre Rückerstattungsrichtlinie?",
    "We offer a 7-Day Clarity Guarantee. If the course isn't what you expected, email us within 7 days for a full refund.":
      "Wir bieten eine 7-tägige Klarheitsgarantie. Falls der Kurs nicht Ihren Erwartungen entspricht, schreiben Sie uns innerhalb von 7 Tagen eine E-Mail für eine vollständige Rückerstattung.",
    "Can I access parts in any order?": "Kann ich die Teile in beliebiger Reihenfolge aufrufen?",
    "Yes — all 100 parts are immediately accessible once your plan is active. You can jump to any lesson at any time. The parts are numbered to help you follow the Seerah chronologically, but there are no locks or requirements between lessons.":
      "Ja — alle 100 Teile sind sofort zugänglich, sobald Ihr Plan aktiv ist. Sie können jederzeit zu jeder Lektion springen. Die Teile sind nummeriert, um Ihnen zu helfen, der Seerah chronologisch zu folgen, aber es gibt keine Sperren oder Voraussetzungen zwischen den Lektionen.",
    "Can I access lessons on mobile?": "Kann ich Lektionen auf dem Handy aufrufen?",
    "Yes. The course is fully responsive and works on all devices including phones and tablets.":
      "Ja. Der Kurs ist vollständig responsiv und funktioniert auf allen Geräten, einschließlich Telefonen und Tablets.",
    "How do I earn a certificate?": "Wie erhalte ich ein Zertifikat?",
    "Complete all required lessons in your plan. Complete users must also pass all quizzes with at least 70%. Your certificate will then be available in the Certificate section.":
      "Schließen Sie alle erforderlichen Lektionen Ihres Plans ab. Complete-Nutzer müssen außerdem alle Quizze mit mindestens 70 % bestehen. Ihr Zertifikat ist dann im Bereich Zertifikat verfügbar.",
    "Is the certificate official?": "Ist das Zertifikat offiziell?",
    "Yes, it's an official certificate of completion from The Muslim Man showing you've completed Complete Seerah.":
      "Ja, es ist ein offizielles Abschlusszertifikat von The Muslim Man, das zeigt, dass Sie Complete Seerah abgeschlossen haben.",
    "Lifetime access is": "Der lebenslange Zugang kostet",
    "one-time — permanent access with no recurring charges. Pay once and keep the full course forever.":
      "einmalig — dauerhafter Zugang ohne wiederkehrende Kosten. Einmal zahlen und den gesamten Kurs für immer behalten.",
    "Please fill in all fields": "Bitte füllen Sie alle Felder aus",
    "Failed to send message": "Nachricht konnte nicht gesendet werden",
    "Failed to send message. Please try again.":
      "Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
    "Message Sent!": "Nachricht gesendet!",
    "We've received your message and will get back to you as soon as possible.":
      "Wir haben Ihre Nachricht erhalten und werden uns so schnell wie möglich bei Ihnen melden.",
    "Need More Help?": "Brauchen Sie weitere Hilfe?",
    "Can't find what you're looking for? Our support team is here to help.":
      "Finden Sie nicht, was Sie suchen? Unser Support-Team ist für Sie da.",
    Subject: "Betreff",
    "What do you need help with?": "Wobei brauchen Sie Hilfe?",
    Message: "Nachricht",
    "Describe your issue or question...": "Beschreiben Sie Ihr Problem oder Ihre Frage...",
    "Sending...": "Wird gesendet...",
    "Send Message": "Nachricht senden",
  },

  tr: {
    "Account & Billing": "Hesap ve Faturalandırma",
    "Course Access": "Kurs Erişimi",
    Certificate: "Sertifika",
    "How do I access my course?": "Kursuma nasıl erişebilirim?",
    "After purchasing, you can access your course from the Dashboard or My Courses page. Simply click on the course card to start learning.":
      "Satın aldıktan sonra kursunuza Kontrol Paneli veya Kurslarım sayfasından erişebilirsiniz. Öğrenmeye başlamak için kurs kartına tıklamanız yeterlidir.",
    "What does Complete Seerah Early Access include?": "Complete Seerah Erken Erişimi neleri içerir?",
    "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking. Full access from day one.":
      "100 bölümlük tam Seerah yolculuğunu alırsınız: video dersler, özet bilgiler, quizler, bilgi kartları, zihin haritaları, görsel kaynaklar, çalışma kılavuzları, raporlar ve yönlendirilmiş ilerleme takibi. İlk günden itibaren tam erişim.",
    "How are lessons structured?": "Dersler nasıl yapılandırılmıştır?",
    "Each part includes a video lesson, briefing, study guide, flashcards, quiz, mind map, slides, infographics, and reports — everything you need to learn, review, and retain each part.":
      "Her bölüm bir video ders, özet bilgi, çalışma kılavuzu, bilgi kartları, quiz, zihin haritası, slaytlar, infografikler ve raporlar içerir — her bölümü öğrenmek, tekrar etmek ve akılda tutmak için gereken her şey.",
    "What payment options are available?": "Hangi ödeme seçenekleri mevcut?",
    "What's your refund policy?": "İade politikanız nedir?",
    "We offer a 7-Day Clarity Guarantee. If the course isn't what you expected, email us within 7 days for a full refund.":
      "7 Günlük Netlik Garantisi sunuyoruz. Kurs beklediğiniz gibi değilse, tam iade için 7 gün içinde bize e-posta gönderin.",
    "Can I access parts in any order?": "Bölümlere herhangi bir sırayla erişebilir miyim?",
    "Yes — all 100 parts are immediately accessible once your plan is active. You can jump to any lesson at any time. The parts are numbered to help you follow the Seerah chronologically, but there are no locks or requirements between lessons.":
      "Evet — planınız etkinleştirildiğinde tüm 100 bölüme hemen erişebilirsiniz. İstediğiniz zaman herhangi bir derse geçebilirsiniz. Bölümler, Seerah'ı kronolojik olarak takip etmenize yardımcı olmak için numaralandırılmıştır, ancak dersler arasında kilit veya gereklilik yoktur.",
    "Can I access lessons on mobile?": "Derslere mobil cihazdan erişebilir miyim?",
    "Yes. The course is fully responsive and works on all devices including phones and tablets.":
      "Evet. Kurs tamamen duyarlıdır ve telefonlar ve tabletler dahil tüm cihazlarda çalışır.",
    "How do I earn a certificate?": "Sertifikayı nasıl kazanırım?",
    "Complete all required lessons in your plan. Complete users must also pass all quizzes with at least 70%. Your certificate will then be available in the Certificate section.":
      "Planınızdaki tüm gerekli dersleri tamamlayın. Complete kullanıcıları ayrıca tüm quizlerden en az %70 almalıdır. Ardından sertifikanız Sertifika bölümünde kullanılabilir olacaktır.",
    "Is the certificate official?": "Sertifika resmi mi?",
    "Yes, it's an official certificate of completion from The Muslim Man showing you've completed Complete Seerah.":
      "Evet, Complete Seerah'ı tamamladığınızı gösteren The Muslim Man'den resmi bir tamamlama sertifikasıdır.",
    "Lifetime access is": "Ömür boyu erişim",
    "one-time — permanent access with no recurring charges. Pay once and keep the full course forever.":
      "tek seferlik ödemedir — tekrarlayan ücret olmadan kalıcı erişim. Bir kez ödeyin ve tüm kursu sonsuza kadar elinizde tutun.",
    "Please fill in all fields": "Lütfen tüm alanları doldurun",
    "Failed to send message": "Mesaj gönderilemedi",
    "Failed to send message. Please try again.": "Mesaj gönderilemedi. Lütfen tekrar deneyin.",
    "Message Sent!": "Mesaj Gönderildi!",
    "We've received your message and will get back to you as soon as possible.":
      "Mesajınızı aldık ve en kısa sürede size geri döneceğiz.",
    "Need More Help?": "Daha Fazla Yardıma mı İhtiyacınız Var?",
    "Can't find what you're looking for? Our support team is here to help.":
      "Aradığınızı bulamadınız mı? Destek ekibimiz size yardımcı olmak için burada.",
    Subject: "Konu",
    "What do you need help with?": "Hangi konuda yardıma ihtiyacınız var?",
    Message: "Mesaj",
    "Describe your issue or question...": "Sorununuzu veya sorunuzu açıklayın...",
    "Sending...": "Gönderiliyor...",
    "Send Message": "Mesaj Gönder",
  },

  hi: {
    "Account & Billing": "खाता और बिलिंग",
    "Course Access": "कोर्स एक्सेस",
    Certificate: "प्रमाणपत्र",
    "How do I access my course?": "मैं अपने कोर्स तक कैसे पहुँचूँ?",
    "After purchasing, you can access your course from the Dashboard or My Courses page. Simply click on the course card to start learning.":
      "खरीदने के बाद, आप डैशबोर्ड या माय कोर्सेज़ पेज से अपने कोर्स तक पहुँच सकते हैं। सीखना शुरू करने के लिए बस कोर्स कार्ड पर क्लिक करें।",
    "What does Complete Seerah Early Access include?": "Complete Seerah अर्ली एक्सेस में क्या शामिल है?",
    "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking. Full access from day one.":
      "आपको पूरी 100-भाग सीरह यात्रा मिलती है: वीडियो पाठ, संक्षिप्त जानकारी, क्विज़, फ्लैशकार्ड, माइंड मैप, दृश्य संसाधन, स्टडी गाइड, रिपोर्ट, और निर्देशित प्रगति ट्रैकिंग। पहले दिन से पूर्ण एक्सेस।",
    "How are lessons structured?": "पाठ कैसे संरचित हैं?",
    "Each part includes a video lesson, briefing, study guide, flashcards, quiz, mind map, slides, infographics, and reports — everything you need to learn, review, and retain each part.":
      "प्रत्येक भाग में एक वीडियो पाठ, संक्षिप्त जानकारी, स्टडी गाइड, फ्लैशकार्ड, क्विज़, माइंड मैप, स्लाइड्स, इन्फोग्राफिक्स, और रिपोर्ट शामिल हैं — हर भाग को सीखने, दोहराने और याद रखने के लिए आवश्यक सब कुछ।",
    "What payment options are available?": "कौन से पेमेंट विकल्प उपलब्ध हैं?",
    "What's your refund policy?": "आपकी रिफंड पॉलिसी क्या है?",
    "We offer a 7-Day Clarity Guarantee. If the course isn't what you expected, email us within 7 days for a full refund.":
      "हम 7-दिन की स्पष्टता गारंटी देते हैं। यदि कोर्स आपकी अपेक्षा के अनुरूप नहीं है, तो पूर्ण रिफंड के लिए 7 दिनों के भीतर हमें ईमेल करें।",
    "Can I access parts in any order?": "क्या मैं किसी भी क्रम में भागों तक पहुँच सकता हूँ?",
    "Yes — all 100 parts are immediately accessible once your plan is active. You can jump to any lesson at any time. The parts are numbered to help you follow the Seerah chronologically, but there are no locks or requirements between lessons.":
      "हाँ — आपकी योजना सक्रिय होने के बाद सभी 100 भाग तुरंत उपलब्ध हो जाते हैं। आप किसी भी समय किसी भी पाठ पर जा सकते हैं। भागों को क्रमानुसार सीरह का पालन करने में मदद के लिए क्रमांकित किया गया है, लेकिन पाठों के बीच कोई लॉक या आवश्यकता नहीं है।",
    "Can I access lessons on mobile?": "क्या मैं मोबाइल पर पाठ देख सकता हूँ?",
    "Yes. The course is fully responsive and works on all devices including phones and tablets.":
      "हाँ। कोर्स पूरी तरह से रिस्पॉन्सिव है और फोन और टैबलेट सहित सभी डिवाइस पर काम करता है।",
    "How do I earn a certificate?": "मैं प्रमाणपत्र कैसे अर्जित करूँ?",
    "Complete all required lessons in your plan. Complete users must also pass all quizzes with at least 70%. Your certificate will then be available in the Certificate section.":
      "अपनी योजना के सभी आवश्यक पाठ पूरे करें। Complete उपयोगकर्ताओं को सभी क्विज़ में कम से कम 70% अंकों के साथ पास होना भी आवश्यक है। इसके बाद आपका प्रमाणपत्र प्रमाणपत्र सेक्शन में उपलब्ध होगा।",
    "Is the certificate official?": "क्या प्रमाणपत्र आधिकारिक है?",
    "Yes, it's an official certificate of completion from The Muslim Man showing you've completed Complete Seerah.":
      "हाँ, यह The Muslim Man का एक आधिकारिक पूर्णता प्रमाणपत्र है जो दर्शाता है कि आपने Complete Seerah पूरा कर लिया है।",
    "Lifetime access is": "लाइफटाइम एक्सेस है",
    "one-time — permanent access with no recurring charges. Pay once and keep the full course forever.":
      "एक बार का भुगतान — बिना किसी बार-बार लगने वाले शुल्क के स्थायी एक्सेस। एक बार भुगतान करें और पूरा कोर्स हमेशा के लिए रखें।",
    "Please fill in all fields": "कृपया सभी फ़ील्ड भरें",
    "Failed to send message": "संदेश भेजने में विफल",
    "Failed to send message. Please try again.": "संदेश भेजने में विफल। कृपया पुनः प्रयास करें।",
    "Message Sent!": "संदेश भेजा गया!",
    "We've received your message and will get back to you as soon as possible.":
      "हमें आपका संदेश मिल गया है और हम जल्द से जल्द आपसे संपर्क करेंगे।",
    "Need More Help?": "अधिक सहायता चाहिए?",
    "Can't find what you're looking for? Our support team is here to help.":
      "जो आप खोज रहे हैं वह नहीं मिल रहा? हमारी सहायता टीम आपकी मदद के लिए यहाँ है।",
    Subject: "विषय",
    "What do you need help with?": "आपको किस बारे में मदद चाहिए?",
    Message: "संदेश",
    "Describe your issue or question...": "अपनी समस्या या सवाल का वर्णन करें...",
    "Sending...": "भेजा जा रहा है...",
    "Send Message": "संदेश भेजें",
  },

  ur: {
    "Account & Billing": "اکاؤنٹ اور بلنگ",
    "Course Access": "کورس تک رسائی",
    Certificate: "سرٹیفکیٹ",
    "How do I access my course?": "میں اپنے کورس تک کیسے رسائی حاصل کروں؟",
    "After purchasing, you can access your course from the Dashboard or My Courses page. Simply click on the course card to start learning.":
      "خریداری کے بعد، آپ ڈیش بورڈ یا My Courses صفحے سے اپنے کورس تک رسائی حاصل کر سکتے ہیں۔ سیکھنا شروع کرنے کے لیے صرف کورس کارڈ پر کلک کریں۔",
    "What does Complete Seerah Early Access include?": "Complete Seerah ارلی ایکسیس میں کیا شامل ہے؟",
    "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking. Full access from day one.":
      "آپ کو مکمل 100 حصوں پر مشتمل سیرت کا سفر ملتا ہے: ویڈیو اسباق، بریفنگز، کوئزز، فلیش کارڈز، ذہنی نقشے، بصری وسائل، مطالعاتی رہنما، رپورٹس، اور رہنمائی شدہ پیش رفت کی ٹریکنگ۔ پہلے دن سے مکمل رسائی۔",
    "How are lessons structured?": "اسباق کس طرح ترتیب دیے گئے ہیں؟",
    "Each part includes a video lesson, briefing, study guide, flashcards, quiz, mind map, slides, infographics, and reports — everything you need to learn, review, and retain each part.":
      "ہر حصے میں ایک ویڈیو سبق، بریفنگ، مطالعاتی رہنما، فلیش کارڈز، کوئز، ذہنی نقشہ، سلائیڈز، انفوگرافکس، اور رپورٹس شامل ہیں — ہر حصے کو سیکھنے، دہرانے، اور یاد رکھنے کے لیے درکار ہر چیز۔",
    "What payment options are available?": "کون سے ادائیگی کے اختیارات دستیاب ہیں؟",
    "What's your refund policy?": "آپ کی رقم واپسی کی پالیسی کیا ہے؟",
    "We offer a 7-Day Clarity Guarantee. If the course isn't what you expected, email us within 7 days for a full refund.":
      "ہم 7 دن کی وضاحت گارنٹی پیش کرتے ہیں۔ اگر کورس آپ کی توقع کے مطابق نہیں ہے تو مکمل رقم کی واپسی کے لیے 7 دن کے اندر ہمیں ای میل کریں۔",
    "Can I access parts in any order?": "کیا میں حصوں تک کسی بھی ترتیب میں رسائی حاصل کر سکتا ہوں؟",
    "Yes — all 100 parts are immediately accessible once your plan is active. You can jump to any lesson at any time. The parts are numbered to help you follow the Seerah chronologically, but there are no locks or requirements between lessons.":
      "جی ہاں — آپ کا پلان فعال ہونے کے بعد تمام 100 حصے فوری طور پر قابل رسائی ہو جاتے ہیں۔ آپ کسی بھی وقت کسی بھی سبق پر جا سکتے ہیں۔ حصوں کو ترتیب وار سیرت کی پیروی میں مدد کے لیے نمبر دیے گئے ہیں، لیکن اسباق کے درمیان کوئی تالے یا شرائط نہیں ہیں۔",
    "Can I access lessons on mobile?": "کیا میں موبائل پر اسباق تک رسائی حاصل کر سکتا ہوں؟",
    "Yes. The course is fully responsive and works on all devices including phones and tablets.":
      "جی ہاں۔ یہ کورس مکمل طور پر ریسپانسیو ہے اور فون اور ٹیبلٹس سمیت تمام آلات پر کام کرتا ہے۔",
    "How do I earn a certificate?": "میں سرٹیفکیٹ کیسے حاصل کروں؟",
    "Complete all required lessons in your plan. Complete users must also pass all quizzes with at least 70%. Your certificate will then be available in the Certificate section.":
      "اپنے پلان کے تمام مطلوبہ اسباق مکمل کریں۔ Complete صارفین کو کم از کم 70% کے ساتھ تمام کوئزز بھی پاس کرنا ہوں گے۔ اس کے بعد آپ کا سرٹیفکیٹ سرٹیفکیٹ سیکشن میں دستیاب ہو گا۔",
    "Is the certificate official?": "کیا سرٹیفکیٹ سرکاری ہے؟",
    "Yes, it's an official certificate of completion from The Muslim Man showing you've completed Complete Seerah.":
      "جی ہاں، یہ The Muslim Man کی طرف سے مکمل ہونے کا ایک سرکاری سرٹیفکیٹ ہے جو ظاہر کرتا ہے کہ آپ نے Complete Seerah مکمل کر لیا ہے۔",
    "Lifetime access is": "لائف ٹائم رسائی ہے",
    "one-time — permanent access with no recurring charges. Pay once and keep the full course forever.":
      "یک وقتی — بغیر کسی بار بار چارجز کے مستقل رسائی۔ ایک بار ادائیگی کریں اور مکمل کورس ہمیشہ کے لیے رکھیں۔",
    "Please fill in all fields": "براہ کرم تمام فیلڈز پُر کریں",
    "Failed to send message": "پیغام بھیجنے میں ناکامی",
    "Failed to send message. Please try again.": "پیغام بھیجنے میں ناکامی۔ براہ کرم دوبارہ کوشش کریں۔",
    "Message Sent!": "پیغام بھیج دیا گیا!",
    "We've received your message and will get back to you as soon as possible.":
      "ہمیں آپ کا پیغام موصول ہو گیا ہے اور ہم جلد از جلد آپ سے رابطہ کریں گے۔",
    "Need More Help?": "مزید مدد کی ضرورت ہے؟",
    "Can't find what you're looking for? Our support team is here to help.":
      "جو آپ تلاش کر رہے ہیں وہ نہیں مل رہا؟ ہماری سپورٹ ٹیم مدد کے لیے حاضر ہے۔",
    Subject: "موضوع",
    "What do you need help with?": "آپ کو کس چیز میں مدد درکار ہے؟",
    Message: "پیغام",
    "Describe your issue or question...": "اپنا مسئلہ یا سوال بیان کریں...",
    "Sending...": "بھیجا جا رہا ہے...",
    "Send Message": "پیغام بھیجیں",
  },

  bn: {
    "Account & Billing": "অ্যাকাউন্ট ও বিলিং",
    "Course Access": "কোর্স অ্যাক্সেস",
    Certificate: "সার্টিফিকেট",
    "How do I access my course?": "আমি কীভাবে আমার কোর্সে প্রবেশ করব?",
    "After purchasing, you can access your course from the Dashboard or My Courses page. Simply click on the course card to start learning.":
      "কেনার পর, আপনি ড্যাশবোর্ড বা মাই কোর্সেস পেজ থেকে আপনার কোর্সে প্রবেশ করতে পারবেন। শেখা শুরু করতে কেবল কোর্স কার্ডে ক্লিক করুন।",
    "What does Complete Seerah Early Access include?": "Complete Seerah আরলি অ্যাক্সেসে কী কী অন্তর্ভুক্ত আছে?",
    "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking. Full access from day one.":
      "আপনি সম্পূর্ণ ১০০-পর্বের সীরাহ যাত্রা পাবেন: ভিডিও পাঠ, সারসংক্ষেপ, কুইজ, ফ্ল্যাশকার্ড, মাইন্ড ম্যাপ, ভিজ্যুয়াল রিসোর্স, স্টাডি গাইড, রিপোর্ট, এবং গাইডেড অগ্রগতি ট্র্যাকিং। প্রথম দিন থেকেই সম্পূর্ণ অ্যাক্সেস।",
    "How are lessons structured?": "পাঠগুলো কীভাবে সাজানো হয়েছে?",
    "Each part includes a video lesson, briefing, study guide, flashcards, quiz, mind map, slides, infographics, and reports — everything you need to learn, review, and retain each part.":
      "প্রতিটি পর্বে রয়েছে একটি ভিডিও পাঠ, সারসংক্ষেপ, স্টাডি গাইড, ফ্ল্যাশকার্ড, কুইজ, মাইন্ড ম্যাপ, স্লাইড, ইনফোগ্রাফিক্স এবং রিপোর্ট — প্রতিটি পর্ব শেখা, পর্যালোচনা এবং মনে রাখার জন্য প্রয়োজনীয় সবকিছু।",
    "What payment options are available?": "কোন পেমেন্ট অপশনগুলো পাওয়া যায়?",
    "What's your refund policy?": "আপনার রিফান্ড নীতি কী?",
    "We offer a 7-Day Clarity Guarantee. If the course isn't what you expected, email us within 7 days for a full refund.":
      "আমরা ৭ দিনের ক্ল্যারিটি গ্যারান্টি দিচ্ছি। কোর্সটি যদি আপনার প্রত্যাশা অনুযায়ী না হয়, তাহলে সম্পূর্ণ রিফান্ডের জন্য ৭ দিনের মধ্যে আমাদের ইমেল করুন।",
    "Can I access parts in any order?": "আমি কি যেকোনো ক্রমে পর্বগুলোতে প্রবেশ করতে পারি?",
    "Yes — all 100 parts are immediately accessible once your plan is active. You can jump to any lesson at any time. The parts are numbered to help you follow the Seerah chronologically, but there are no locks or requirements between lessons.":
      "হ্যাঁ — আপনার প্ল্যান সক্রিয় হওয়ার সাথে সাথেই সব ১০০টি পর্ব তাৎক্ষণিকভাবে অ্যাক্সেসযোগ্য হয়ে যায়। আপনি যেকোনো সময় যেকোনো পাঠে যেতে পারেন। সীরাহকে কালানুক্রমিকভাবে অনুসরণ করতে সাহায্য করার জন্য পর্বগুলোতে নম্বর দেওয়া আছে, কিন্তু পাঠগুলোর মধ্যে কোনো লক বা শর্ত নেই।",
    "Can I access lessons on mobile?": "আমি কি মোবাইলে পাঠগুলো দেখতে পারি?",
    "Yes. The course is fully responsive and works on all devices including phones and tablets.":
      "হ্যাঁ। কোর্সটি সম্পূর্ণ রেসপনসিভ এবং ফোন ও ট্যাবলেট সহ সব ডিভাইসে কাজ করে।",
    "How do I earn a certificate?": "আমি কীভাবে সার্টিফিকেট অর্জন করব?",
    "Complete all required lessons in your plan. Complete users must also pass all quizzes with at least 70%. Your certificate will then be available in the Certificate section.":
      "আপনার প্ল্যানের সব প্রয়োজনীয় পাঠ সম্পন্ন করুন। Complete ব্যবহারকারীদের অন্তত ৭০% নিয়ে সব কুইজেও পাস করতে হবে। এরপর আপনার সার্টিফিকেট সার্টিফিকেট বিভাগে পাওয়া যাবে।",
    "Is the certificate official?": "সার্টিফিকেটটি কি সরকারি?",
    "Yes, it's an official certificate of completion from The Muslim Man showing you've completed Complete Seerah.":
      "হ্যাঁ, এটি The Muslim Man থেকে প্রাপ্ত একটি অফিসিয়াল সমাপ্তি সার্টিফিকেট যা দেখায় যে আপনি Complete Seerah সম্পন্ন করেছেন।",
    "Lifetime access is": "লাইফটাইম অ্যাক্সেস হলো",
    "one-time — permanent access with no recurring charges. Pay once and keep the full course forever.":
      "একবারের পেমেন্ট — পুনরাবৃত্ত চার্জ ছাড়াই স্থায়ী অ্যাক্সেস। একবার পরিশোধ করুন এবং সম্পূর্ণ কোর্স সারাজীবনের জন্য রাখুন।",
    "Please fill in all fields": "অনুগ্রহ করে সব ফিল্ড পূরণ করুন",
    "Failed to send message": "বার্তা পাঠাতে ব্যর্থ হয়েছে",
    "Failed to send message. Please try again.": "বার্তা পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
    "Message Sent!": "বার্তা পাঠানো হয়েছে!",
    "We've received your message and will get back to you as soon as possible.":
      "আমরা আপনার বার্তা পেয়েছি এবং যত দ্রুত সম্ভব আপনার সাথে যোগাযোগ করব।",
    "Need More Help?": "আরও সাহায্য প্রয়োজন?",
    "Can't find what you're looking for? Our support team is here to help.":
      "যা খুঁজছেন তা পাচ্ছেন না? আমাদের সাপোর্ট টিম সাহায্যের জন্য এখানে আছে।",
    Subject: "বিষয়",
    "What do you need help with?": "আপনার কী বিষয়ে সাহায্য প্রয়োজন?",
    Message: "বার্তা",
    "Describe your issue or question...": "আপনার সমস্যা বা প্রশ্ন বর্ণনা করুন...",
    "Sending...": "পাঠানো হচ্ছে...",
    "Send Message": "বার্তা পাঠান",
  },

  fa: {
    "Account & Billing": "حساب کاربری و صورتحساب",
    "Course Access": "دسترسی به دوره",
    Certificate: "گواهینامه",
    "How do I access my course?": "چگونه به دوره‌ام دسترسی پیدا کنم؟",
    "After purchasing, you can access your course from the Dashboard or My Courses page. Simply click on the course card to start learning.":
      "پس از خرید، می‌توانید از صفحه داشبورد یا دوره‌های من به دوره خود دسترسی داشته باشید. فقط روی کارت دوره کلیک کنید تا یادگیری را شروع کنید.",
    "What does Complete Seerah Early Access include?": "دسترسی زودهنگام Complete Seerah شامل چه موارد است؟",
    "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking. Full access from day one.":
      "شما مسیر کامل سیره در ۱۰۰ بخش را دریافت می‌کنید: درس‌های ویدیویی، خلاصه‌ها، آزمون‌ها، فلش‌کارت‌ها، نقشه‌های ذهنی، منابع تصویری، راهنماهای مطالعه، گزارش‌ها و پیگیری هدایت‌شده پیشرفت. دسترسی کامل از روز اول.",
    "How are lessons structured?": "درس‌ها چگونه ساختار یافته‌اند؟",
    "Each part includes a video lesson, briefing, study guide, flashcards, quiz, mind map, slides, infographics, and reports — everything you need to learn, review, and retain each part.":
      "هر بخش شامل یک درس ویدیویی، خلاصه، راهنمای مطالعه، فلش‌کارت، آزمون، نقشه ذهنی، اسلایدها، اینفوگرافیک‌ها و گزارش‌ها است — همه آنچه برای یادگیری، مرور و به‌خاطر سپردن هر بخش نیاز دارید.",
    "What payment options are available?": "چه گزینه‌های پرداختی موجود است؟",
    "What's your refund policy?": "سیاست بازپرداخت شما چیست؟",
    "We offer a 7-Day Clarity Guarantee. If the course isn't what you expected, email us within 7 days for a full refund.":
      "ما ضمانت شفافیت ۷ روزه ارائه می‌دهیم. اگر دوره آنچه انتظار داشتید نبود، ظرف ۷ روز برای بازپرداخت کامل به ما ایمیل بزنید.",
    "Can I access parts in any order?": "آیا می‌توانم بخش‌ها را به هر ترتیبی ببینم؟",
    "Yes — all 100 parts are immediately accessible once your plan is active. You can jump to any lesson at any time. The parts are numbered to help you follow the Seerah chronologically, but there are no locks or requirements between lessons.":
      "بله — به محض فعال شدن طرح شما، تمام ۱۰۰ بخش فوراً قابل دسترسی می‌شوند. شما می‌توانید در هر زمان به هر درسی بروید. بخش‌ها شماره‌گذاری شده‌اند تا به شما در پیگیری سیره به‌صورت زمانی کمک کنند، اما هیچ قفل یا الزامی بین درس‌ها وجود ندارد.",
    "Can I access lessons on mobile?": "آیا می‌توانم درس‌ها را روی موبایل ببینم؟",
    "Yes. The course is fully responsive and works on all devices including phones and tablets.":
      "بله. این دوره کاملاً واکنش‌گرا است و روی تمام دستگاه‌ها از جمله تلفن‌ها و تبلت‌ها کار می‌کند.",
    "How do I earn a certificate?": "چگونه گواهینامه دریافت کنم؟",
    "Complete all required lessons in your plan. Complete users must also pass all quizzes with at least 70%. Your certificate will then be available in the Certificate section.":
      "تمام درس‌های لازم در طرح خود را تکمیل کنید. کاربران Complete همچنین باید تمام آزمون‌ها را با حداقل ۷۰٪ قبول شوند. سپس گواهینامه شما در بخش گواهینامه در دسترس خواهد بود.",
    "Is the certificate official?": "آیا گواهینامه رسمی است؟",
    "Yes, it's an official certificate of completion from The Muslim Man showing you've completed Complete Seerah.":
      "بله، این یک گواهینامه رسمی اتمام دوره از The Muslim Man است که نشان می‌دهد شما Complete Seerah را به پایان رسانده‌اید.",
    "Lifetime access is": "دسترسی مادام‌العمر",
    "one-time — permanent access with no recurring charges. Pay once and keep the full course forever.":
      "یک‌باره است — دسترسی دائمی بدون هزینه‌های تکراری. یک بار پرداخت کنید و دوره کامل را برای همیشه نگه دارید.",
    "Please fill in all fields": "لطفاً همه فیلدها را پر کنید",
    "Failed to send message": "ارسال پیام ناموفق بود",
    "Failed to send message. Please try again.": "ارسال پیام ناموفق بود. لطفاً دوباره تلاش کنید.",
    "Message Sent!": "پیام ارسال شد!",
    "We've received your message and will get back to you as soon as possible.":
      "پیام شما را دریافت کردیم و در اسرع وقت با شما تماس خواهیم گرفت.",
    "Need More Help?": "به کمک بیشتری نیاز دارید؟",
    "Can't find what you're looking for? Our support team is here to help.":
      "چیزی که دنبالش هستید را پیدا نمی‌کنید؟ تیم پشتیبانی ما اینجاست تا به شما کمک کند.",
    Subject: "موضوع",
    "What do you need help with?": "به چه چیزی نیاز به کمک دارید؟",
    Message: "پیام",
    "Describe your issue or question...": "مشکل یا سؤال خود را توضیح دهید...",
    "Sending...": "در حال ارسال...",
    "Send Message": "ارسال پیام",
  },
};

let totalAdded = 0;
for (const [lang, entries] of Object.entries(TRANSLATIONS)) {
  const filePath = path.join(dir, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!data.phrases) data.phrases = {};

  let added = 0;
  for (const [en, translated] of Object.entries(entries)) {
    if (!Object.prototype.hasOwnProperty.call(data.phrases, en)) {
      data.phrases[en] = translated;
      added++;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data), "utf8");
  console.log(`${lang}: added ${added} new phrase(s) (${Object.keys(entries).length} total keys in map)`);
  totalAdded += added;
}

console.log(`\nDone. Added ${totalAdded} phrase entries across ${Object.keys(TRANSLATIONS).length} packs.`);
