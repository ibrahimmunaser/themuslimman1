import { redirect } from "next/navigation";

// Redirect /learn to /seerah
export default function LearnRedirectPage() {
  redirect("/seerah");
}
