import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { TestimonialForm } from "@/components/help/testimonial-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Share Your Feedback — Complete Seerah",
  description: "Tell us about your experience with the Complete Seerah course.",
};

export default function TestimonialPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ink pt-28 pb-16">
        <TestimonialForm />
      </main>
      <Footer />
    </>
  );
}
