import { requireAdmin } from "@/lib/auth";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata = { title: "Platform Settings" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  return (
    <ComingSoon
      title="Platform Settings — coming next"
      description="Global defaults, feature flags, branding, email templates, integrations."
    />
  );
}
