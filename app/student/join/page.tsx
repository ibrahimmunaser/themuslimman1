import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import JoinForm from "./join-form";

export default async function JoinClassPage() {
  const user = await requireStudent();

  const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
  if (!hasAccess) redirect("/pricing");
  // Entitled unverified keep access (part-access / Apple 5.1.1(v) parity).

  return <JoinForm />;
}
