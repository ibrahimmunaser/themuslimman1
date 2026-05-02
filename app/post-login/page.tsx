import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { roleHome } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function PostLoginPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  redirect(roleHome(user.role));
}
