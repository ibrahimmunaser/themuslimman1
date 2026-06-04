import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// /my-courses is retired — only one course exists, so we go straight to it.
export default function MyCoursesPage() {
  redirect("/seerah");
}
