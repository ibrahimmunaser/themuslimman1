import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { TribesLineageContent } from "@/components/reference/tribes-lineage-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tribes and Lineage — Seerah Reference",
  description:
    "The major Arab tribes, their relationships, and the Prophet's ﷺ lineage traced back through Quraysh, Kinanah, and Banu Hashim.",
};

export default function TribesLineagePage() {
  return (
    <>
      <Navbar />
      <TribesLineageContent />
      <Footer />
    </>
  );
}
