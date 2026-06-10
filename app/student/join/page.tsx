import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import JoinForm from "./join-form";

export default async function JoinClassPage() {
  const user = await requireStudent();

  const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
  if (!hasAccess) redirect("/pricing");
  if (!user.emailVerified) redirect("/seerah");

  return <JoinForm />;
}
