import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { StudentLayout } from "@/components/student/student-layout";
import { prisma } from "@/lib/db";
import { HelpCircle, BookOpen, CreditCard, Lock, Mail, MessageCircle } from "lucide-react";

export const metadata = { title: "Help & FAQ | Seerah Masterclass" };
export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const user = await getCurrentUser();
  
  // If not logged in, redirect to login
  if (!user) {
    redirect("/login?redirect=/help");
  }

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id, status: "succeeded" },
  });

  const hasCompletePlan = purchases.some(p => p.planId === "complete");
  const userPlan = purchases.length > 0 ? (hasCompletePlan ? "complete" : "essentials") : "essentials";

  const faqs = [
    {
      category: "Getting Started",
      icon: BookOpen,
      questions: [
        {
          q: "How do I access my course?",
          a: "After purchasing, you can access your course from the Dashboard or My Courses page. Simply click on the course card to start learning.",
        },
        {
          q: "What's the difference between Essentials and Complete?",
          a: "Essentials gives you all 100 video lessons, Listen on the Go audio, and briefings for each part. Complete adds depth with slides, infographics, mind maps, flashcards, quizzes, reports, study guides, and statement of facts.",
        },
        {
          q: "How are lessons structured?",
          a: "Essentials lessons include a video, Listen on the Go audio, and a briefing. Complete users also get 3 slide formats, 3 infographic formats, mind maps, flashcards, quizzes, reports, study guides, and statement of facts.",
        },
      ],
    },
    {
      category: "Account & Billing",
      icon: CreditCard,
      questions: [
        {
          q: "Can I upgrade from Essentials to Complete?",
          a: "Yes! You can upgrade anytime for just $30 (the price difference). Your progress will be preserved.",
        },
        {
          q: "Is this a subscription or one-time payment?",
          a: "It's a one-time payment with lifetime access. No recurring charges.",
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
          q: "Why are some lessons locked?",
          a: "Lessons unlock sequentially as you complete previous ones. This helps you build knowledge in the correct order and prevents overwhelm.",
        },
        {
          q: "Can I access lessons on mobile?",
          a: "Yes! The course is fully responsive and works on all devices including phones and tablets.",
        },
        {
          q: "Do I need to complete lessons in order?",
          a: "Yes. Lessons unlock sequentially as you progress. This helps you build knowledge in the correct chronological order of the Seerah.",
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
          a: "Yes, it's an official certificate of completion from The Muslim Man showing you've completed the Seerah Masterclass.",
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
            <h1 className="text-3xl font-bold text-text mb-2">Help & FAQ</h1>
            <p className="text-text-secondary">
              Find answers to common questions about your course
            </p>
          </div>

          {/* Contact Support */}
          <div className="p-6 rounded-xl bg-gradient-to-b from-gold/15 to-gold/5 border border-gold/30 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text mb-2">Need More Help?</h3>
                <p className="text-text-secondary mb-4">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <a
                  href="mailto:support@themuslimman.com"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-ink font-semibold hover:bg-gold/90 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contact Support
                </a>
              </div>
            </div>
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
            <h2 className="text-lg font-semibold text-text mb-4">Quick Links</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <a
                href="/seerah"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-raised hover:bg-surface-high text-text-secondary hover:text-text transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </a>
              <a
                href="/student/progress"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-raised hover:bg-surface-high text-text-secondary hover:text-text transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>View Progress</span>
              </a>
              <a
                href="/pricing"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-raised hover:bg-surface-high text-text-secondary hover:text-text transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>Upgrade Plan</span>
              </a>
              <a
                href="/student/settings"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-raised hover:bg-surface-high text-text-secondary hover:text-text transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>Account Settings</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
