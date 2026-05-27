import { Suspense } from "react";
import { StudentSidebar } from "./student-sidebar";

interface StudentLayoutProps {
  children: React.ReactNode;
  userPlan: "essentials" | "complete";
  userName: string;
}

export function StudentLayout({ children, userPlan, userName }: StudentLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background items-start">
      <Suspense fallback={<div className="w-64 bg-surface border-r border-border shrink-0" />}>
        <StudentSidebar userPlan={userPlan} userName={userName} />
      </Suspense>
      
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
