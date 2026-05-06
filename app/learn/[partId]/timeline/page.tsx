import { redirect } from "next/navigation";

export default async function LearnTimelineRedirect({
  params,
}: {
  params: Promise<{ partId: string }>;
}) {
  const { partId } = await params;
  redirect(`/seerah/${partId}/timeline`);
}
