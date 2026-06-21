import { redirect } from "next/navigation";

/**
 * Legacy Seerah Checkup entry point.
 * The quiz has moved to the main Orthodox Muslim funnel page.
 */
export default function CheckupPage() {
  redirect("/theorthodoxmuslim");
}
