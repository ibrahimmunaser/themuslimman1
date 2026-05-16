import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — Complete Seerah",
  description: "Our 7-Day Clarity Guarantee and refund terms for Complete Seerah.",
};

export default function RefundPage() {
  const lastUpdated = "May 2026";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ink py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="mb-10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text">Refund Policy</h1>
              <p className="text-sm text-text-muted mt-0.5">Last updated: {lastUpdated}</p>
            </div>
          </div>

          {/* Guarantee callout */}
          <div className="mb-10 p-6 rounded-2xl border border-gold/30 bg-gold/5 text-center">
            <ShieldCheck className="w-10 h-10 text-gold mx-auto mb-3" />
            <h2 className="text-lg font-bold text-text mb-2">7-Day Clarity Guarantee</h2>
            <p className="text-text-secondary text-sm leading-relaxed max-w-lg mx-auto">
              If the course is not what you expected, email us within 7 days of your purchase date and we
              will issue a full refund — no questions asked.
            </p>
          </div>

          <div className="prose prose-invert prose-sm max-w-none space-y-8 text-text-secondary leading-relaxed">

            <section>
              <h2 className="text-base font-semibold text-text mb-2">How to Request a Refund</h2>
              <p>
                Email us at{" "}
                <a href="mailto:admin@themuslimman.com" className="text-gold hover:underline">
                  admin@themuslimman.com
                </a>{" "}
                or use our{" "}
                <Link href="/contact" className="text-gold hover:underline">contact form</Link>{" "}
                within 7 days of your purchase. Include the email address you used to purchase.
                We will process your refund within 3–5 business days. Refunds are returned to your
                original payment method via Stripe.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">Conditions</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong className="text-text">7-day window:</strong> Refund requests must be submitted
                  within 7 calendar days of the original purchase date.
                </li>
                <li>
                  <strong className="text-text">First purchase:</strong> The guarantee applies to your
                  first purchase of a given plan. Repeat purchases of the same plan are not eligible.
                </li>
                <li>
                  <strong className="text-text">Complete Seerah Early Access:</strong> Covered by the 7-day guarantee from the date of purchase. Discount codes may be offered for local or limited promotions — the guarantee applies regardless of the amount paid.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">Exceptions</h2>
              <p>Refunds may be declined in cases of:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>Evidence of mass downloading, screen-recording, or unauthorized redistribution of content</li>
                <li>Account sharing in violation of our Terms of Service</li>
                <li>Requests submitted after the 7-day window</li>
                <li>Repeat refund requests across multiple purchases</li>
              </ul>
              <p className="mt-3">
                If your refund request is declined, you will receive a clear explanation.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">After a Refund</h2>
              <p>
                Once a refund is processed, your account access to paid content will be removed. Free
                preview access (Part 1) remains available. Your account is not deleted.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">Questions</h2>
              <p>
                Still have questions about our refund policy?{" "}
                <Link href="/contact" className="text-gold hover:underline">Contact us</Link>{" "}
                and we will be happy to help.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
