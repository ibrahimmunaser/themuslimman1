import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StudentLayout } from "@/components/student/student-layout";
import { BookOpen, ChevronRight, Clock, CheckCircle2 } from "lucide-react";

export const metadata = { title: "My Courses" };
export const dynamic = "force-dynamic";

export default async function MyCoursesPage() {
  // Check if user is logged in
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login?redirect=/my-courses");
  }

  // Get user's purchases
  const purchases = await prisma.purchase.findMany({
    where: {
      userId: user.id,
      status: "succeeded",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // If no purchases, redirect to pricing
  if (purchases.length === 0) {
    redirect("/pricing");
  }

  // Determine which plans the user has
  const hasCompletePlan = purchases.some(p => p.planId === "complete");
  const hasEssentialsPlan = purchases.some(p => p.planId === "essentials");
  const userPlan = hasCompletePlan ? "complete" : hasEssentialsPlan ? "essentials" : null;

  // Define available courses (structured for future expansion)
  const courses = [
    {
      id: "seerah",
      title: userPlan === "complete" ? "Complete Seerah" : "Essentials Seerah",
      description: userPlan === "complete" 
        ? "Master the life of the Prophet ﷺ through the complete 100-part study system with slides, mind maps, flashcards, quizzes, and comprehensive review tools."
        : "Learn the life of the Prophet ﷺ through 100 video lessons with Listen on the Go audio and briefings for each part.",
      link: "/learn",
      planType: userPlan,
      lessonCount: 100,
      estimatedHours: userPlan === "complete" ? 40 : 30,
      isComplete: userPlan === "complete",
    },
  ];

  return (
    <StudentLayout userPlan={userPlan || "essentials"} userName={user.fullName}>
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
              <Link
                key={course.id}
                href={course.link}
                className="group block bg-surface border border-border rounded-2xl p-8 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/5 transition-all"
              >
                {/* Course Icon & Badge */}
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    course.isComplete 
                      ? "bg-gold/10 border-2 border-gold/30" 
                      : "bg-blue-500/10 border-2 border-blue-500/30"
                  }`}>
                    <BookOpen className={`w-8 h-8 ${course.isComplete ? "text-gold" : "text-blue-400"}`} />
                  </div>
                  
                  <div className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${
                    course.isComplete
                      ? "bg-gold/10 text-gold border border-gold/20"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}>
                    {course.isComplete ? "Complete" : "Essentials"}
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

                {/* Features (conditional based on plan) */}
                <div className="mb-6 space-y-2">
                  {course.isComplete ? (
                    <>
                      <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>100 video lessons with audio</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>3 slide & 3 infographic formats</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>Mind maps & flashcards</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>Briefings, quizzes & study guides</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>100 video lessons</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>Listen on the Go audio</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>Briefings for each part</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Continue Learning CTA */}
                <div className="flex items-center justify-between pt-5 border-t border-border">
                  <span className="text-gold font-semibold">
                    Continue Course
                  </span>
                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
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
