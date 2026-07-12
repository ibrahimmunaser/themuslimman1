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
 */
import { getCachedStudent } from "@/lib/auth-cache";
import { StudentLayout } from "@/components/student/student-layout";
import { SharePopup } from "@/components/student/share-popup";

export default async function SeerahLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCachedStudent();

  return (
    <StudentLayout
      userPlan="complete"
      userName={user.fullName}
      activeProfileName={user.activeProfileName}
      planType={user.planType}
    >
      {children}
      <SharePopup />
    </StudentLayout>
  );
}
