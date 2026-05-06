import { BookOpen, Clock, Award, TrendingUp, Video, Headphones, FileText, Image as ImageIcon, Map, Layers2, HelpCircle } from "lucide-react";

interface CourseHomeContentProps {
  userPlan: "essentials" | "complete";
  completionPercentage: number;
  completedLessons: number;
  totalLessons: number;
}

export function CourseHomeContent({ 
  userPlan, 
  completionPercentage, 
  completedLessons, 
  totalLessons 
}: CourseHomeContentProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-3">
          Welcome to Complete Seerah
        </h1>
        <p className="text-lg text-text-secondary max-w-3xl">
          Master the life of Prophet Muhammad ﷺ with a complete, structured journey through all 100 parts of the Seerah. Learn the timeline, understand the context, and build lasting knowledge.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{completionPercentage}%</p>
              <p className="text-xs text-text-muted">Course Progress</p>
            </div>
          </div>
          <div className="w-full bg-surface-raised rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-gold to-amber-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{completedLessons}/{totalLessons}</p>
              <p className="text-xs text-text-muted">Lessons Completed</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text capitalize">{userPlan}</p>
              <p className="text-xs text-text-muted">Your Plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Features */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-text mb-4">What You Get in This Course</h2>
        <div className="grid md:grid-cols-2 gap-4">
          
          {/* Video — available to all plans */}
          <div className="p-5 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-gold/5">
            <div className="flex items-center gap-2 mb-3">
              <Video className="w-5 h-5 text-gold" />
              <h3 className="font-semibold text-text">Video Lessons</h3>
            </div>
            <p className="text-sm text-text-secondary">
              All 100 parts with clear narration and structured timeline
            </p>
          </div>

          {/* Listen on the Go — available to all plans */}
          <div className="p-5 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-gold/5">
            <div className="flex items-center gap-2 mb-3">
              <Headphones className="w-5 h-5 text-gold" />
              <h3 className="font-semibold text-text">Listen on the Go</h3>
            </div>
            <p className="text-sm text-text-secondary">
              Audio format for learning during commute or exercise
            </p>
          </div>

          {/* Briefings — available to all plans */}
          <div className="p-5 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-gold/5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-gold" />
              <h3 className="font-semibold text-text">Briefings</h3>
            </div>
            <p className="text-sm text-text-secondary">
              Quick summaries for review and reference
            </p>
          </div>

          {/* Complete-only features */}
          {userPlan === "complete" && (
            <>
              <div className="p-5 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-gold/5">
                <div className="flex items-center gap-2 mb-3">
                  <Layers2 className="w-5 h-5 text-gold" />
                  <h3 className="font-semibold text-text">Slides & Infographics</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  Visual learning aids in multiple formats
                </p>
              </div>

              <div className="p-5 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-gold/5">
                <div className="flex items-center gap-2 mb-3">
                  <Map className="w-5 h-5 text-gold" />
                  <h3 className="font-semibold text-text">Mind Maps</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  See connections and the big picture
                </p>
              </div>

              <div className="p-5 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-gold/5">
                <div className="flex items-center gap-2 mb-3">
                  <Layers2 className="w-5 h-5 text-gold" />
                  <h3 className="font-semibold text-text">Flashcards</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  Master names, dates, and key events
                </p>
              </div>

              <div className="p-5 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-gold/5">
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle className="w-5 h-5 text-gold" />
                  <h3 className="font-semibold text-text">Quizzes</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  Test your understanding and retention
                </p>
              </div>

              <div className="p-5 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-gold/5">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-gold" />
                  <h3 className="font-semibold text-text">Study Guides & Reports</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  Deep dives and comprehensive review materials
                </p>
              </div>

            </>
          )}
        </div>
      </div>

      {/* Course Structure */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-text mb-4">How This Course Works</h2>
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-border bg-surface">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0 font-bold text-gold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-text mb-1">Sequential Learning</h3>
                <p className="text-sm text-text-secondary">
                  Lessons unlock in chronological order. Follow the Prophet's life ﷺ from beginning to end, building knowledge step by step.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-surface">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0 font-bold text-gold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-text mb-1">Multiple Formats</h3>
                <p className="text-sm text-text-secondary">
                  Watch the video, listen on the go, read the briefing, or review the mind map. Learn in whatever way works best for you.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-surface">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0 font-bold text-gold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-text mb-1">Track Your Progress</h3>
                <p className="text-sm text-text-secondary">
                  Your progress is automatically saved. See how far you've come and stay motivated with clear completion tracking.
                </p>
              </div>
            </div>
          </div>

          {userPlan === "complete" && (
            <div className="p-5 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-gold/5">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0 font-bold text-gold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-text mb-1">Test & Review</h3>
                  <p className="text-sm text-text-secondary">
                    Use flashcards and quizzes to reinforce what you've learned. Master the material through active recall and spaced repetition.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Getting Started CTA */}
      <div className="p-6 rounded-xl border-2 border-gold/30 bg-gradient-to-b from-gold/10 to-surface text-center">
        <h2 className="text-xl font-bold text-text mb-2">Ready to Begin?</h2>
        <p className="text-text-secondary mb-4">
          Start with Part 1 or pick up where you left off. The full timeline is waiting for you.
        </p>
        <a
          href="/seerah/part-1"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gold text-ink font-semibold hover:bg-gold/90 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          {completedLessons === 0 ? "Start Part 1" : "Continue Learning"}
        </a>
      </div>

    </div>
  );
}
