import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";

export const metadata = { title: "Student Dashboard" };

export default async function StudentDashboardPage() {
  await requireStudent();
  // Redirect to new /learn route
  redirect("/learn");
}
