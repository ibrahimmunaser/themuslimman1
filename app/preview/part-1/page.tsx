import { redirect } from "next/navigation";

// /preview/part-1 → homepage
export default function PreviewPart1Redirect() {
  redirect("/");
}
