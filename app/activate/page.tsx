import { requireAuth } from "@/lib/auth";
import { ActivateForm } from "./activate-form";

export const metadata = { title: "Activate Your TV", robots: { index: false, follow: false } };
export const dynamic  = "force-dynamic";

/**
 * /activate — the "second screen" half of the TV app's device-linking sign-in.
 *
 * The TV shows a short code; the user opens this page on their phone or
 * laptop (where they're already signed in, or get sent to log in first via
 * requireAuth()'s return-URL redirect) and types it in. See the route
 * handlers under app/api/tv/link and the TvLinkCode model in schema.prisma
 * for the full flow this completes.
 */
export default async function ActivatePage() {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center p-4">
      <ActivateForm userName={user.fullName} />
    </div>
  );
}
