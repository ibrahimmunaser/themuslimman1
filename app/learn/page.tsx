import { redirect } from "next/navigation";

// Redirect /learn to /my-courses
export default function LearnRedirectPage() {
  redirect("/my-courses");
}
