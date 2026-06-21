import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { MiraclesSignsContent } from "@/components/reference/miracles-signs-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Miracles and Signs — Complete Seerah",
  description:
    "Verified narrations of miracles and signs granted to the Prophet ﷺ. Authentic sources from the Qur'an, Sahih al-Bukhari, and Sahih Muslim.",
};

export default function MiraclesSignsPage() {
  return (
    <>
      <Navbar />
      <MiraclesSignsContent />
      <Footer />
    </>
  );
}
