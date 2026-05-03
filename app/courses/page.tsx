import { redirect } from "next/navigation";

export const metadata = { title: "My Courses" };

// Redirect to new /my-courses page
export default async function MyCoursesPage() {
  redirect("/my-courses");
}
