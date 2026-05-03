import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { roleHome } from "@/lib/roles";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export const dynamic = "force-dynamic";

export default async function PostLoginPage() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      redirect("/login");
    }

    redirect(roleHome(user.role));
  } catch (error) {
    // Re-throw redirect errors — they must not be swallowed
    if (isRedirectError(error)) throw error;
    // If database connection fails, redirect to login
    console.error("Post-login error:", error);
    redirect("/login");
  }
}
