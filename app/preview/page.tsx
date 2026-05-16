import { redirect } from "next/navigation";

// /preview → homepage
export default function PreviewRedirect() {
  redirect("/");
}
