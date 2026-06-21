import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Important Terms — Complete Seerah",
  description:
    "A glossary of Arabic and historical terms used throughout the Seerah. Beginner-friendly definitions with transliteration and context.",
};

export default function ImportantTermsPage() {
  redirect("/seerah?tab=reference&section=important-terms");
}
