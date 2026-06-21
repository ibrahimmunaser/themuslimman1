import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reference Library — Complete Seerah",
  description:
    "Extra Seerah reference guides, timelines, people, places, and historical notes to help you understand the life of the Prophet ﷺ more clearly.",
};

export default function ReferenceLibraryPage() {
  redirect("/seerah?tab=reference");
}
