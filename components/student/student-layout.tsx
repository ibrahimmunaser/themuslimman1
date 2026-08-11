import { cookies } from "next/headers";
import { StudentSidebar } from "./student-sidebar";
import { parseLang, COURSE_LANG_COOKIE } from "@/lib/course-lang";

interface StudentLayoutProps {
  children: React.ReactNode;
  userPlan: "essentials" | "complete";
  userName: string;
  activeProfileName?: string | null;
  planType?: string;
}

export async function StudentLayout({
  children,
  userPlan,
  userName,
  activeProfileName,
  planType = "individual",
}: StudentLayoutProps) {
  // Read directly here (rather than requiring every call site to pass it down)
  // so the sidebar is Arabic-aware everywhere StudentLayout is used.
  const cookieStore = await cookies();
  const lang = parseLang(cookieStore.get(COURSE_LANG_COOKIE)?.value);

  return (
    <div
      className="flex min-h-screen bg-background items-start w-full"
      dir={lang === "ar" ? "rtl" : "ltr"}
      lang={lang}
    >
      <StudentSidebar
        userPlan={userPlan}
        userName={userName}
        activeProfileName={activeProfileName ?? null}
        planType={planType}
        lang={lang}
        isRtl={lang === "ar"}
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
