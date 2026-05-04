import { redirect } from "next/navigation";

// Redirect old /learn/[partId] to /seerah/[partId]
export default async function LearnPartRedirectPage({ params }: { params: Promise<{ partId: string }> }) {
  const { partId } = await params;
  redirect(`/seerah/${partId}`);
}
