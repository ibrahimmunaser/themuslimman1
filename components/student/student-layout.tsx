import { StudentSidebar } from "./student-sidebar";

interface StudentLayoutProps {
  children: React.ReactNode;
  userPlan: "essentials" | "complete";
  userName: string;
  activeProfileName?: string | null;
  planType?: string;
}

export function StudentLayout({
  children,
  userPlan,
  userName,
  activeProfileName,
  planType = "individual",
}: StudentLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background items-start w-full">
      <StudentSidebar
        userPlan={userPlan}
        userName={userName}
        activeProfileName={activeProfileName ?? null}
        planType={planType}
      />
      
      {/* overflow-x:clip prevents horizontal overflow without creating a scroll
          container — unlike overflow-x:hidden, it does not break position:sticky
          on child elements like the resource tab strip. */}
      <main className="flex-1 min-w-0 overflow-x-clip">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
