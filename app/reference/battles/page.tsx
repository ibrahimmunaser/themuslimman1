import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { BattlesExpeditionsContent } from "@/components/reference/battles-expeditions-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Battles and Expeditions — Complete Seerah",
  description:
    "A clear reference to the major battles, campaigns, patrols, and expeditions of the Prophet ﷺ. Understand the context, lessons, and historical significance of each event.",
};

export default function BattlesExpeditionsPage() {
  return (
    <>
      <Navbar />
      <BattlesExpeditionsContent />
      <Footer />
    </>
  );
}
