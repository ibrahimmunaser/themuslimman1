import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ImportantTermsContent } from "@/components/reference/important-terms-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Important Terms — Complete Seerah",
  description:
    "A glossary of Arabic and historical terms used throughout the Seerah. Beginner-friendly definitions with transliteration and context.",
};

export default function ImportantTermsPage() {
  return (
    <>
      <Navbar />
      <ImportantTermsContent />
      <Footer />
    </>
  );
}
