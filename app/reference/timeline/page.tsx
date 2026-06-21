import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timeline of the Seerah — Seerah Reference",
  description:
    "A chronological timeline of major events in the life of the Prophet Muhammad ﷺ from birth to passing.",
};

export default function TimelinePage() {
  redirect("/seerah?tab=reference&section=timeline");
}
