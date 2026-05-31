import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Complete Seerah",
  description: "Terms governing access to the Complete Seerah digital course.",
};

export default function TermsPage() {
  const lastUpdated = "May 2026";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ink py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="mb-10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text">Terms of Service</h1>
              <p className="text-sm text-text-muted mt-0.5">Last updated: {lastUpdated}</p>
            </div>
          </div>

          <div className="prose prose-invert prose-sm max-w-none space-y-8 text-text-secondary leading-relaxed">

            <section>
              <h2 className="text-base font-semibold text-text mb-2">1. Acceptance</h2>
              <p>
                By creating an account or purchasing access to Complete Seerah (&quot;the Course&quot;), you agree to these
                Terms of Service. If you do not agree, do not use the service.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">2. Digital Course Access</h2>
              <p>
                Upon successful payment, you receive personal, non-transferable, lifetime access to the Course content
                available at the time of your purchase. All content is delivered digitally through this platform.
                No physical materials are shipped.
              </p>
              <p className="mt-3">
                &quot;Lifetime access&quot; means access for as long as this platform operates. We reserve the right to
                discontinue the platform with reasonable notice if we are unable to maintain it.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">3. Account Responsibility</h2>
              <p>
                You are responsible for maintaining the confidentiality of your login credentials. You may not
                share your account with others. Each purchase grants access to one individual only. You are
                responsible for all activity that occurs under your account.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>Share, redistribute, or resell Course content in any form</li>
                <li>Download, copy, screen-record, or mass-save Course materials beyond personal study notes</li>
                <li>Use automated tools to scrape or extract content from this platform</li>
                <li>Share your login credentials with anyone else</li>
                <li>Use the Course for commercial purposes, teaching, or public distribution without written consent</li>
                <li>Circumvent or attempt to circumvent content access restrictions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">5. Educational Purpose</h2>
              <p>
                This Course is provided for personal Islamic education and enrichment. The content is based on
                established Seerah scholarship and is intended to help you understand the life of the Prophet ﷺ.
                It is not a substitute for formal religious instruction or scholarly guidance.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">6. Payment Terms</h2>
              <p>
                All prices are in USD. Payments are processed securely through Stripe. Your payment details are
                handled by Stripe and are not stored on our servers. By completing a purchase, you authorize the
                charge to your payment method.
              </p>
              <p className="mt-3">
                Access is granted only after payment is confirmed. In rare cases, access may be delayed briefly
                while payment processing completes.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">7. Refund Policy</h2>
              <p>
                We offer a 7-Day Clarity Guarantee. If the course is not what you expected, contact us within
                7 days of purchase for a full refund. See our{" "}
                <Link href="/refund" className="text-gold hover:underline">Refund Policy</Link> for full details
                and conditions.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">8. Intellectual Property</h2>
              <p>
                All Course content — including videos, audio, slides, infographics, mind maps, quizzes, and
                written materials — is owned by TheMuslimMan and protected by copyright. You may not reproduce,
                distribute, or create derivative works from this content.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">9. Limitation of Liability</h2>
              <p>
                The Course is provided &quot;as is.&quot; We make no warranties about uninterrupted access or fitness for
                any particular purpose. Our total liability to you shall not exceed the amount you paid for
                access to the Course.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">10. Changes to Terms</h2>
              <p>
                We may update these terms from time to time. Continued use of the platform after changes
                constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">11. Contact</h2>
              <p>
                Questions about these terms?{" "}
                <Link href="/contact" className="text-gold hover:underline">Contact us here</Link>{" "}
                or email{" "}
                <a href="mailto:themuslimman77@gmail.com" className="text-gold hover:underline">
                  themuslimman77@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}


