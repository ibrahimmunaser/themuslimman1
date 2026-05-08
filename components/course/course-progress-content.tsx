import { TrendingUp, Target, Clock, Award, FileText, Mail } from "lucide-react";
import { SendProgressReportButton } from "./send-progress-report-button";

interface CourseProgressContentProps {
  userPlan: "essentials" | "complete";
  hasParentEmail?: boolean;
  parentEmail?: string;
  studentName?: string;
  sendWeeklyReports?: boolean;
}

export function CourseProgressContent({ 
  userPlan, 
  hasParentEmail = false,
  parentEmail,
  studentName,
  sendWeeklyReports = false,
}: CourseProgressContentProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Send Progress Report Button or Setup Message */}
      {hasParentEmail ? (
        <SendProgressReportButton
          userPlan={userPlan}
          hasParentEmail={hasParentEmail}
          parentEmail={parentEmail}
          studentName={studentName}
          sendWeeklyReports={sendWeeklyReports}
        />
      ) : (
        <div className="p-6 rounded-xl border border-amber-500/20 bg-amber-500/5 mb-8">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-amber-400 mb-1">Parent Progress Reports</h3>
              <p className="text-sm text-zinc-300 mb-3">
                Want to keep a parent or guardian updated on your progress? Set up automated weekly reports or send them on-demand.
              </p>
              <a 
                href="/student/settings"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors text-sm"
              >
                Set Up Parent Reports
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Target, label: "Lessons Completed", value: "0 / 100", color: "gold" },
          { icon: TrendingUp, label: "Progress", value: "0%", color: "green" },
          { icon: Clock, label: "Study Time", value: "0h", color: "blue" },
          { icon: Award, label: "Quiz Score", value: "0%", color: "purple" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-zinc-400 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Progress Chart Placeholder */}
      <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-900/50 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Learning Progress</h2>
        <div className="h-64 flex items-center justify-center text-zinc-400">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Progress chart coming soon</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-900/50">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-zinc-400">
          <p>No recent activity yet. Start learning to see your progress here!</p>
        </div>
      </div>
    </div>
  );
}
