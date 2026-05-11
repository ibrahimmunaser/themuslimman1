import { StudentSidebar } from "./student-sidebar";

interface StudentLayoutProps {
  children: React.ReactNode;
  userPlan: "essentials" | "complete";
  userName: string;
}

export function StudentLayout({ children, userPlan, userName }: StudentLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <StudentSidebar userPlan={userPlan} userName={userName} />
      
      <main className="flex-1 lg:ml-0">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
