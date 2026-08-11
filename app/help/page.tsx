import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import { StudentLayout } from "@/components/student/student-layout";
import { HelpCircle, BookOpen, CreditCard, Lock } from "lucide-react";
import { ContactSupportForm } from "@/components/help/contact-support-form";
import { cookies } from "next/headers";
import { parseLang, COURSE_LANG_COOKIE } from "@/lib/course-lang";

export const metadata = { title: "Help & FAQ | Complete Seerah" };
export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const user = await getCurrentUser();

  // Unpaid or logged-out users → public contact page
  if (!user) redirect("/contact");
  const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
  if (!hasAccess) redirect("/contact");

  const userPlan = "complete" as const;
  const cookieStore = await cookies();
  const lang = parseLang(cookieStore.get(COURSE_LANG_COOKIE)?.value);
  const ar = lang === "ar";

  const faqs = ar ? [
    {
      category: "البدء",
      icon: BookOpen,
      questions: [
        { q: "كيف أصل إلى دورتي؟", a: "بعد الشراء، يمكنك الوصول إلى دورتك من لوحة التحكم. فقط انقر على بطاقة الدورة لبدء التعلم." },
        { q: "ما الذي يتضمنه الوصول الكامل للسيرة النبوية؟", a: "تحصل على رحلة السيرة النبوية الكاملة في ١٠٠ جزء: دروس فيديو، ملخصات، اختبارات، بطاقات تعليمية، خرائط ذهنية، موارد مرئية، أدلة دراسية، تقارير، وتتبع التقدم. وصول كامل منذ اليوم الأول." },
        { q: "كيف تُبنى الدروس؟", a: "كل جزء يشمل: درس فيديو، ملخص، دليل دراسي، بطاقات تعليمية، اختبار، خريطة ذهنية، شرائح، رسوم معلوماتية، وتقارير — كل ما تحتاجه للتعلم والمراجعة والاحتفاظ." },
      ],
    },
    {
      category: "الحساب والفواتير",
      icon: CreditCard,
      questions: [
        { q: "ما خيارات الدفع المتاحة؟", a: "يمكنك الدفع مرة واحدة للوصول مدى الحياة، أو اختيار خطة شهرية. خيار مدى الحياة يمنحك وصولاً دائماً بدون رسوم متكررة." },
        { q: "ما سياسة الاسترداد؟", a: "نقدم ضمان الوضوح لمدة ٧ أيام. إذا لم تكن الدورة كما توقعت، راسلنا خلال ٧ أيام لاسترداد كامل المبلغ." },
      ],
    },
    {
      category: "الوصول إلى الدورة",
      icon: Lock,
      questions: [
        { q: "هل يمكنني الوصول إلى الأجزاء بأي ترتيب؟", a: "نعم — جميع الـ ١٠٠ جزء متاحة فور تفعيل خطتك. يمكنك الانتقال إلى أي درس في أي وقت. الأجزاء مرقّمة لمساعدتك على متابعة السيرة بشكل تسلسلي." },
        { q: "هل يمكنني الوصول إلى الدروس من الهاتف؟", a: "نعم. الدورة متجاوبة بالكامل وتعمل على جميع الأجهزة بما فيها الهواتف والأجهزة اللوحية." },
      ],
    },
    {
      category: "الشهادة",
      icon: BookOpen,
      questions: [
        { q: "كيف أحصل على شهادة؟", a: "أكمل جميع الدروس المطلوبة في خطتك. يجب أيضاً اجتياز جميع الاختبارات بنسبة ٧٠٪ على الأقل. بعدها ستكون شهادتك متاحة في قسم الشهادات." },
        { q: "هل الشهادة رسمية؟", a: "نعم، هي شهادة إتمام رسمية من The Muslim Man تُثبت أنك أكملت دورة السيرة النبوية الكاملة." },
      ],
    },
  ] : [
    {
      category: "Getting Started",
      icon: BookOpen,
      questions: [
        {
          q: "How do I access my course?",
          a: "After purchasing, you can access your course from the Dashboard or My Courses page. Simply click on the course card to start learning.",
        },
        {
          q: "What does Complete Seerah Early Access include?",
          a: "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking. Full access from day one.",
        },
        {
          q: "How are lessons structured?",
          a: "Each part includes a video lesson, briefing, study guide, flashcards, quiz, mind map, slides, infographics, and reports — everything you need to learn, review, and retain each part.",
        },
      ],
    },
    {
      category: "Account & Billing",
      icon: CreditCard,
      questions: [
        {
          q: "What payment options are available?",
          a: "You can pay once for lifetime access, or choose a monthly plan. The lifetime option gives you permanent access with no recurring charges. The monthly plan keeps you subscribed as long as it's active.",
        },
        {
          q: "What's your refund policy?",
          a: "We offer a 7-Day Clarity Guarantee. If the course isn't what you expected, email us within 7 days for a full refund.",
        },
      ],
    },
    {
      category: "Course Access",
      icon: Lock,
      questions: [
        {
          q: "Can I access parts in any order?",
          a: "Yes — all 100 parts are immediately accessible once your plan is active. You can jump to any lesson at any time. The parts are numbered to help you follow the Seerah chronologically, but there are no locks or requirements between lessons.",
        },
        {
          q: "Can I access lessons on mobile?",
          a: "Yes. The course is fully responsive and works on all devices including phones and tablets.",
        },
      ],
    },
    {
      category: "Certificate",
      icon: BookOpen,
      questions: [
        {
          q: "How do I earn a certificate?",
          a: "Complete all required lessons in your plan. Complete users must also pass all quizzes with at least 70%. Your certificate will then be available in the Certificate section.",
        },
        {
          q: "Is the certificate official?",
          a: "Yes, it's an official certificate of completion from The Muslim Man showing you've completed Complete Seerah.",
        },
      ],
    },
  ];

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName}>
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">{ar ? "المساعدة والأسئلة الشائعة" : "Help & FAQ"}</h1>
            <p className="text-text-secondary">
              {ar ? "ابحث عن إجابات للأسئلة الشائعة حول دورتك" : "Find answers to common questions about your course"}
            </p>
          </div>

          {/* Contact Support Form */}
          <div className="mb-8">
            <ContactSupportForm isRtl={ar} />
          </div>

          {/* FAQ Categories */}
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
                        <p className="text-text-secondary leading-relaxed">{item.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Links */}
          <div className="mt-8 p-6 rounded-xl border border-border bg-surface">
            <h2 className="text-lg font-semibold text-text mb-4">{ar ? "روابط سريعة" : "Quick Links"}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link
                href="/seerah"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-raised hover:bg-surface-high text-text-secondary hover:text-text transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>{ar ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}</span>
              </Link>
              <Link
                href="/student/progress"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-raised hover:bg-surface-high text-text-secondary hover:text-text transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>{ar ? "عرض التقدم" : "View Progress"}</span>
              </Link>
              <Link
                href="/pricing"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-raised hover:bg-surface-high text-text-secondary hover:text-text transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>{ar ? "ترقية الخطة" : "Upgrade Plan"}</span>
              </Link>
              <Link
                href="/student/settings"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-raised hover:bg-surface-high text-text-secondary hover:text-text transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>{ar ? "إعدادات الحساب" : "Account Settings"}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
