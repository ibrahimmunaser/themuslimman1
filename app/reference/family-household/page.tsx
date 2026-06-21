import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Family & Household of the Prophet ﷺ — Seerah Reference",
  description:
    "A clear reference guide to the wives, children, and household of the Prophet Muhammad ﷺ, including important historical notes where scholars differed.",
};

// Redirect to dashboard format for smooth navigation
export default function FamilyHouseholdPage() {
  redirect("/seerah?tab=reference&section=family-household");
}
