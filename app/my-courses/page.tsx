import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccessInfo } from "@/lib/access";
import { StudentLayout } from "@/components/student/student-layout";
import { BookOpen, ChevronRight, Clock, CheckCircle2, Gift } from "lucide-react";

export const metadata = { title: "My Courses" };
export const dynamic = "force-dynamic";

export default async function MyCoursesPage() {
  // Check if user is logged in
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login?redirect=/my-courses");
  }

  const accessInfo = await getUserAccessInfo(user.id);

  if (!accessInfo.hasAccess) {
    redirect("/pricing");
  }

  const userPlan = "complete" as const;

  const courses = [
    {
      id: "seerah",
      title: "Complete Seerah",
      description: "Master the life of the Prophet ﷺ through the complete 100-part study system with videos, slides, mind maps, flashcards, quizzes, and comprehensive review tools.",
      link: "/seerah",
      lessonCount: 100,
      estimatedHours: 40,
    },
  ];

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName}>
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              My Courses
            </h1>
            <p className="text-text-secondary text-lg">
              Continue learning from the courses you own.
            </p>
          </div>

          {/* Courses Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {courses.map((course) => (
              <div
                key={course.id}
                className="group bg-surface border border-border rounded-2xl p-8 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/5 transition-all flex flex-col"
              >
                {/* Course Icon & Badge */}
                <div className="flex items-start justify-between mb-5">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gold/10 border-2 border-gold/30">
                    <BookOpen className="w-8 h-8 text-gold" />
                  </div>
                  <div className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-gold/10 text-gold border border-gold/20">
                    {accessInfo.hasLifetime ? "Lifetime Access" : "Monthly Access"}
                  </div>
                </div>

                {/* Course Title & Description */}
                <h3 className="text-2xl font-bold mb-3 group-hover:text-gold transition-colors">
                  {course.title}
                </h3>
                <p className="text-text-secondary mb-6 leading-relaxed">
                  {course.description}
                </p>

                {/* Course Stats */}
                <div className="flex items-center gap-5 text-sm text-text-muted mb-6 pb-6 border-b border-border">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.lessonCount} parts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>~{course.estimatedHours}hrs</span>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6 space-y-2 flex-1">
                  {[
                    "100 video lessons with audio",
                    "3 slide & 3 infographic formats",
                    "Mind maps & flashcards",
                    "Briefings, quizzes & study guides",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-5 border-t border-border">
                  <Link
                    href={course.link}
                    className="flex items-center gap-2 text-gold font-semibold hover:text-gold-light transition-colors"
                  >
                    Continue Course
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/gift-checkout"
                    className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-gold border border-border hover:border-gold/40 rounded-lg px-3 py-1.5 transition-all"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    Gift this course
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Future courses placeholder */}
          {courses.length < 3 && (
            <div className="mt-8 text-center py-16 bg-surface/30 border border-border/50 rounded-2xl">
              <p className="text-text-muted">
                More courses coming soon. Stay tuned!
              </p>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
