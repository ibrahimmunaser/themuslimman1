import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import { StudentLayout } from "@/components/student/student-layout";
import { HelpCircle, BookOpen, CreditCard, Lock } from "lucide-react";
import { ContactSupportForm } from "@/components/help/contact-support-form";
import { cookies } from "next/headers";
import { formatPrice } from "@/lib/stripe-config";
import { headers } from "next/headers";
import { quoteFromHeaderBag } from "@/lib/request-country-price";
import { parseLang, COURSE_LANG_COOKIE, type CourseLang, isRtlLang } from "@/lib/course-lang";
import { loc } from "@/lib/loc";

export const metadata = { title: "Help & FAQ | Complete Seerah" };
export const dynamic = "force-dynamic";

/**
 * English-structured FAQ. Every category title, question, and answer is
 * wrapped in loc(lang, en, ar, fr) so Arabic and French get their existing,
 * hand-written text, and the other 12 course languages fall back to
 * data/i18n/shell/*.json phrase packs (see lib/loc.ts -> lib/phrases.ts).
 * The PRICE answer is rendered separately around the monthly price.
 */
function faqsFor(lang: CourseLang) {
  return [
    {
      category: loc(lang, "Getting Started", "البدء", "Pour commencer"),
      icon: BookOpen,
      questions: [
        {
          q: loc(lang, "How do I access my course?", "كيف أصل إلى دورتي؟", "Comment accéder à mon cours ?"),
          a: loc(
            lang,
            "After purchasing, you can access your course from the Dashboard or My Courses page. Simply click on the course card to start learning.",
            "بعد الشراء، يمكنك الوصول إلى دورتك من لوحة التحكم. فقط انقر على بطاقة الدورة لبدء التعلم.",
            "Après l'achat, vous pouvez accéder à votre cours depuis le Tableau de bord. Cliquez simplement sur la carte du cours pour commencer.",
          ),
        },
        {
          q: loc(
            lang,
            "What does Complete Seerah Early Access include?",
            "ما الذي يتضمنه الوصول الكامل للسيرة النبوية؟",
            "Que comprend l'accès complet à Complete Seerah ?",
          ),
          a: loc(
            lang,
            "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking. Full access from day one.",
            "تحصل على رحلة السيرة النبوية الكاملة في ١٠٠ جزء: دروس فيديو، ملخصات، اختبارات، بطاقات تعليمية، خرائط ذهنية، موارد مرئية، أدلة دراسية، تقارير، وتتبع التقدم. وصول كامل منذ اليوم الأول.",
            "Vous obtenez le parcours complet de la Sîra en 100 parties : leçons vidéo, briefings, quiz, flashcards, cartes mentales, ressources visuelles, guides d'étude, rapports et suivi de progression. Accès complet dès le premier jour.",
          ),
        },
        {
          q: loc(lang, "How are lessons structured?", "كيف تُبنى الدروس؟", "Comment les leçons sont-elles structurées ?"),
          a: loc(
            lang,
            "Each part includes a video lesson, briefing, study guide, flashcards, quiz, mind map, slides, infographics, and reports — everything you need to learn, review, and retain each part.",
            "كل جزء يشمل: درس فيديو، ملخص، دليل دراسي، بطاقات تعليمية، اختبار، خريطة ذهنية، شرائح، رسوم معلوماتية، وتقارير — كل ما تحتاجه للتعلم والمراجعة والاحتفاظ.",
            "Chaque partie comprend une leçon vidéo, un briefing, un guide d'étude, des flashcards, un quiz, une carte mentale, des diapositives, des infographies et des rapports — tout ce qu'il faut pour apprendre, réviser et mémoriser.",
          ),
        },
      ],
    },
    {
      category: loc(lang, "Account & Billing", "الحساب والفواتير", "Compte et facturation"),
      icon: CreditCard,
      questions: [
        {
          q: loc(
            lang,
            "What payment options are available?",
            "ما خيارات الدفع المتاحة؟",
            "Quelles options de paiement sont disponibles ?",
          ),
          a: "PRICE",
        },
        {
          q: loc(lang, "What's your refund policy?", "ما سياسة الاسترداد؟", "Quelle est votre politique de remboursement ?"),
          a: loc(
            lang,
            "We offer a 7-Day Clarity Guarantee. If the course isn't what you expected, email us within 7 days for a full refund.",
            "نقدم ضمان الوضوح لمدة ٧ أيام. إذا لم تكن الدورة كما توقعت، راسلنا خلال ٧ أيام لاسترداد كامل المبلغ.",
            "Nous offrons une garantie de clarté de 7 jours. Si le cours n'est pas ce que vous attendiez, écrivez-nous dans les 7 jours pour un remboursement intégral.",
          ),
        },
      ],
    },
    {
      category: loc(lang, "Course Access", "الوصول إلى الدورة", "Accès au cours"),
      icon: Lock,
      questions: [
        {
          q: loc(
            lang,
            "Can I access parts in any order?",
            "هل يمكنني الوصول إلى الأجزاء بأي ترتيب؟",
            "Puis-je accéder aux parties dans n'importe quel ordre ?",
          ),
          a: loc(
            lang,
            "Yes — all 100 parts are immediately accessible once your plan is active. You can jump to any lesson at any time. The parts are numbered to help you follow the Seerah chronologically, but there are no locks or requirements between lessons.",
            "نعم — جميع الـ ١٠٠ جزء متاحة فور تفعيل خطتك. يمكنك الانتقال إلى أي درس في أي وقت. الأجزاء مرقّمة لمساعدتك على متابعة السيرة بشكل تسلسلي.",
            "Oui — les 100 parties sont immédiatement accessibles une fois votre plan actif. Vous pouvez aller à n'importe quelle leçon à tout moment. Les parties sont numérotées pour suivre la Sîra chronologiquement, mais il n'y a pas de verrous entre les leçons.",
          ),
        },
        {
          q: loc(lang, "Can I access lessons on mobile?", "هل يمكنني الوصول إلى الدروس من الهاتف؟", "Puis-je suivre les leçons sur mobile ?"),
          a: loc(
            lang,
            "Yes. The course is fully responsive and works on all devices including phones and tablets.",
            "نعم. الدورة متجاوبة بالكامل وتعمل على جميع الأجهزة بما فيها الهواتف والأجهزة اللوحية.",
            "Oui. Le cours est entièrement responsive et fonctionne sur tous les appareils, y compris téléphones et tablettes.",
          ),
        },
      ],
    },
    {
      category: loc(lang, "Certificate", "الشهادة", "Certificat"),
      icon: BookOpen,
      questions: [
        {
          q: loc(lang, "How do I earn a certificate?", "كيف أحصل على شهادة؟", "Comment obtenir un certificat ?"),
          a: loc(
            lang,
            "Complete all required lessons in your plan. Complete users must also pass all quizzes with at least 70%. Your certificate will then be available in the Certificate section.",
            "أكمل جميع الدروس المطلوبة في خطتك. يجب أيضاً اجتياز جميع الاختبارات بنسبة ٧٠٪ على الأقل. بعدها ستكون شهادتك متاحة في قسم الشهادات.",
            "Complétez toutes les leçons requises de votre plan. Les utilisateurs avec accès complet doivent aussi réussir tous les quiz avec au moins 70 %. Votre certificat sera ensuite disponible dans la section Certificat.",
          ),
        },
        {
          q: loc(lang, "Is the certificate official?", "هل الشهادة رسمية؟", "Le certificat est-il officiel ?"),
          a: loc(
            lang,
            "Yes, it's an official certificate of completion from The Muslim Man showing you've completed Complete Seerah.",
            "نعم، هي شهادة إتمام رسمية من The Muslim Man تُثبت أنك أكملت دورة السيرة النبوية الكاملة.",
            "Oui, c'est un certificat officiel de réussite de The Muslim Man attestant que vous avez terminé Complete Seerah.",
          ),
        },
      ],
    },
  ];
}

export default async function HelpPage() {
  const user = await getCurrentUser();
  const hdrs = await headers();
  const countryPrice = quoteFromHeaderBag((name) => hdrs.get(name));

  if (!user) redirect("/contact");
  const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
  if (!hasAccess) redirect("/contact");

  const userPlan = "complete" as const;
  const cookieStore = await cookies();
  const lang = parseLang(cookieStore.get(COURSE_LANG_COOKIE)?.value);
  const faqs = faqsFor(lang);

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName}>
      <div className="min-h-screen bg-[#0a0a0a]" dir={isRtlLang(lang) ? "rtl" : undefined}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">
              {loc(lang, "Help & FAQ", "المساعدة والأسئلة الشائعة", "Aide et FAQ")}
            </h1>
            <p className="text-text-secondary">
              {loc(
                lang,
                "Find answers to common questions about your course",
                "ابحث عن إجابات للأسئلة الشائعة حول دورتك",
                "Trouvez des réponses aux questions fréquentes sur votre cours",
              )}
            </p>
          </div>

          <div className="mb-8">
            <ContactSupportForm lang={lang} />
          </div>

          <div className="space-y-6">
            {faqs.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.category} className="p-6 rounded-xl border border-border bg-surface">
                  <div className="flex items-center gap-3 mb-6">
                    <Icon className="w-5 h-5 text-gold" />
                    <h2 className="text-lg font-semibold text-text">{category.category}</h2>
                  </div>
                  <div className="space-y-6">
                    {category.questions.map((item, idx) => (
                      <div key={idx} className={idx > 0 ? "pt-6 border-t border-border" : ""}>
                        <h3 className="text-text font-semibold mb-2">{item.q}</h3>
                        <p className="text-text-secondary leading-relaxed">
                          {item.a === "PRICE" ? (
                            <>
                              {loc(
                                lang,
                                "Full access is",
                                "الاشتراك الشهري هو",
                                "L'accès complet coûte",
                              )}{" "}
                              <span dir="ltr">{formatPrice(countryPrice.monthlyAmountCents)}</span>{" "}
                              {loc(
                                lang,
                                "per month — cancel anytime from your account settings, no long-term commitment.",
                                "شهريًا — يمكنك الإلغاء في أي وقت من إعدادات حسابك.",
                                "par mois — annulez à tout moment depuis les paramètres de votre compte.",
                              )}
                            </>
                          ) : (
                            item.a
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-6 rounded-xl border border-border bg-surface">
            <h2 className="text-lg font-semibold text-text mb-4">
              {loc(lang, "Quick Links", "روابط سريعة", "Liens rapides")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link
                href="/seerah"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-raised hover:bg-surface-high text-text-secondary hover:text-text transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>{loc(lang, "Back to Dashboard", "العودة إلى لوحة التحكم", "Retour au tableau de bord")}</span>
              </Link>
              <Link
                href="/student/progress"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-raised hover:bg-surface-high text-text-secondary hover:text-text transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>{loc(lang, "View Progress", "عرض التقدم", "Voir la progression")}</span>
              </Link>
              <Link
                href="/pricing"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-raised hover:bg-surface-high text-text-secondary hover:text-text transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>{loc(lang, "Upgrade Plan", "ترقية الخطة", "Mettre à niveau le plan")}</span>
              </Link>
              <Link
                href="/student/settings"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-raised hover:bg-surface-high text-text-secondary hover:text-text transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>{loc(lang, "Account Settings", "إعدادات الحساب", "Paramètres du compte")}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
