import { redirect } from "next/navigation";

export const metadata = { title: "My Courses" };

// Redirect to /seerah
export default async function MyCoursesPage() {
  redirect("/seerah");
}
