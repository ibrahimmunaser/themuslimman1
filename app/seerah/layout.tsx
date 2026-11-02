/**
 * app/seerah/layout.tsx
 *
 * Persistent shell for all /seerah/* routes — sidebar stays mounted during
 * Next/Prev navigation so only the inner content area transitions.
 *
 * Before this layout existed, StudentLayout was rendered inside each page
 * component. That caused the sidebar to tear down and re-mount on every
 * part navigation, producing a visible "skeleton flash" on the left panel.
 * Moving it here eliminates that flicker entirely.
 *
 * Guests: the dashboard (/seerah) and /seerah/resources are viewable without an
 * account, so this layout tolerates a missing session. Pages that require an
 * account (lesson pages, timeline) still call getCachedStudent() themselves and
 * redirect to /login — the middleware also blocks them before they render.
 */
import { getCachedStudentOrGuest } from "@/lib/auth-cache";
import { StudentLayout } from "@/components/student/student-layout";
import { SharePopup } from "@/components/student/share-popup";
import { UnlockPromptProvider } from "@/components/course/unlock-prompt";
import { cookies } from "next/headers";
import { parseLang, COURSE_LANG_COOKIE } from "@/lib/course-lang";
import { loc } from "@/lib/loc";

export default async function SeerahLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCachedStudentOrGuest();
  const cookieStore = await cookies();
  const lang = parseLang(cookieStore.get(COURSE_LANG_COOKIE)?.value);

  // UnlockPromptProvider powers the "unlock the full course" popup that locked
  // lesson cards open instead of bouncing people to /pricing. It only appears
  // when something calls it, so people with full access never see it.
  if (!user) {
    return (
      <UnlockPromptProvider lang={lang} isGuest>
        <StudentLayout
          userPlan="complete"
          userName={loc(lang, "Guest", "زائر", "Invité")}
          activeProfileName={null}
          planType="individual"
          isGuest
        >
          {children}
        </StudentLayout>
      </UnlockPromptProvider>
    );
  }

  return (
    <UnlockPromptProvider lang={lang} isGuest={false}>
      <StudentLayout
        userPlan="complete"
        userName={user.fullName}
        activeProfileName={user.activeProfileName}
        planType={user.planType}
      >
        {children}
        <SharePopup lang={lang} />
      </StudentLayout>
    </UnlockPromptProvider>
  );
}
