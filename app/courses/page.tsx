import { redirect } from "next/navigation";

export const metadata = { title: "My Courses" };

// Redirect to new /my-courses page
export default async function MyCoursesPage() {
  redirect("/my-courses");
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

  // Get user's first name for header
  const userFirstName = user.fullName.split(" ")[0];

  // Define available courses (for now just Seerah)
  const courses = [
    {
      id: "seerah",
      title: "Complete Seerah System",
      description: "Master the life of Prophet Muhammad ﷺ through structured lessons, videos, and study materials",
      link: "/learn",
      package: userPlan === "complete" ? "Complete Access" : "Essentials",
      packageColor: userPlan === "complete" ? "amber" : "blue",
      lessonCount: userPlan === "complete" ? 100 : 56,
      estimatedHours: userPlan === "complete" ? 40 : 20,
      icon: BookOpen,
      status: "active" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Student Portal Header */}
      <StudentHeader userFirstName={userFirstName} userPlan={userPlan} />

      {/* Page Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            My Courses
          </h1>
          <p className="text-zinc-400">
            Access your purchased courses and continue your learning journey
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {courses.map((course) => {
            const Icon = course.icon;
            const isComplete = course.package === "Complete Access";
            
            return (
              <Link
                key={course.id}
                href={course.link}
                className="group block bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-amber-500/30 hover:bg-zinc-900 transition-all"
              >
                {/* Course Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    isComplete 
                      ? "bg-amber-500/10 border border-amber-500/20" 
                      : "bg-blue-500/10 border border-blue-500/20"
                  }`}>
                    <Icon className={`w-7 h-7 ${isComplete ? "text-amber-500" : "text-blue-500"}`} />
                  </div>
                  
                  <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${
                    isComplete
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  }`}>
                    {course.package}
                  </div>
                </div>

                {/* Course Title & Description */}
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
                  {course.description}
                </p>

                {/* Course Stats */}
                <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4 pb-4 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.lessonCount} lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>~{course.estimatedHours}hrs</span>
                  </div>
                </div>

                {/* Package Features */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                    Included in your package:
                  </p>
                  <div className="space-y-1.5 text-sm text-zinc-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span>Video lessons & quizzes</span>
                    </div>
                    {isComplete && (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span>Slides, infographics & mind maps</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span>Briefings, facts & flashcards</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span>Full 100-part program</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Continue Learning Button */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <span className="text-sm font-medium text-amber-500">
                    Continue Learning
                  </span>
                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-amber-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Upgrade Banner (for Essentials users) */}
        {userPlan === "essentials" && (
          <div className="mt-8 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Upgrade to Complete Access
                </h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Unlock the full mastery system with mind maps, flashcards, briefings, slides, infographics, and all 100 parts of the Seerah program.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors text-sm"
                >
                  Upgrade for $30
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Empty State for Future Courses */}
        <div className="mt-8 text-center py-12 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
          <p className="text-zinc-500 text-sm">
            More courses coming soon. Stay tuned for new learning opportunities!
          </p>
        </div>
      </div>
    </div>
  );
}
