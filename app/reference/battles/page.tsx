import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Battles and Expeditions — Complete Seerah",
  description:
    "A clear reference to the major battles, campaigns, patrols, and expeditions of the Prophet ﷺ. Understand the context, lessons, and historical significance of each event.",
};

export default function BattlesExpeditionsPage() {
  redirect("/seerah?tab=reference&section=battles");
}
