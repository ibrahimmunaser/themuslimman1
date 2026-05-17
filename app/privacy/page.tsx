import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Complete Seerah",
  description: "How Complete Seerah collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  const lastUpdated = "May 2026";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ink py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="mb-10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text">Privacy Policy</h1>
              <p className="text-sm text-text-muted mt-0.5">Last updated: {lastUpdated}</p>
            </div>
          </div>

          <div className="prose prose-invert prose-sm max-w-none space-y-8 text-text-secondary leading-relaxed">

            <section>
              <h2 className="text-base font-semibold text-text mb-2">1. Overview</h2>
              <p>
                This Privacy Policy explains how Complete Seerah ("we," "our," or "the platform") collects,
                uses, and protects your personal data when you use our website and course platform. We take
                your privacy seriously.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">2. Data We Collect</h2>
              <p className="font-medium text-text text-sm mb-2">Account Data</p>
              <p>
                When you create an account, we collect your name and email address. This is required to
                provide access to your purchased content and to send essential account communications
                (email verification, password resets, purchase confirmation).
              </p>
              <p className="font-medium text-text text-sm mb-2 mt-4">Purchase Data</p>
              <p>
                We record what plan you purchased and when, to manage your access rights. Payment details
                (card numbers, billing address) are collected and stored entirely by Stripe — we never
                see or store your payment card information.
              </p>
              <p className="font-medium text-text text-sm mb-2 mt-4">Progress Data</p>
              <p>
                We track your course progress (which parts you have viewed, quiz scores, completion status)
                to power your dashboard, progress reports, and personalized experience.
              </p>
              <p className="font-medium text-text text-sm mb-2 mt-4">Support Data</p>
              <p>
                If you contact us through the contact form or by email, we store your message to respond
                to your request. This data is not shared with third parties.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">3. Payment Processing</h2>
              <p>
                Payments are processed by{" "}
                <a
                  href="https://stripe.com"
                  className="text-gold hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Stripe
                </a>
                . When you check out, your payment information goes directly to Stripe's secure servers.
                We receive a confirmation from Stripe once payment is complete but never handle your
                raw payment data. Stripe's privacy policy applies to the payment process.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">4. Email Communications</h2>
              <p>
                We use{" "}
                <a
                  href="https://resend.com"
                  className="text-gold hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Resend
                </a>{" "}
                to deliver transactional emails such as email verification, password resets, and purchase
                confirmations. We do not send marketing emails without your consent. You can contact us to
                update your communication preferences at any time.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">5. Analytics</h2>
              <p>
                We may use Vercel Analytics to understand aggregate page view data (e.g., which pages are
                most visited). This data is anonymized and does not identify individual users. No third-party
                advertising trackers are used on this platform.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">6. Cookies and Sessions</h2>
              <p>
                We use a single secure, HTTP-only session cookie to keep you logged in. This cookie contains
                a session token only — no personal data is stored in the cookie itself. The session expires
                automatically after 30 days of inactivity or when you log out.
              </p>
              <p className="mt-3">
                No advertising cookies or third-party tracking cookies are set by this platform.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">7. Data Storage</h2>
              <p>
                Account and progress data is stored in a PostgreSQL database hosted on Supabase (cloud-hosted,
                US-based). Course media files (videos, slides, etc.) are stored on Cloudflare R2.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">8. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>Request a copy of the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and associated data</li>
                <li>Withdraw consent for optional communications</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights,{" "}
                <Link href="/contact" className="text-gold hover:underline">contact us</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">9. Children's Privacy</h2>
              <p>
                This platform is not directed at children under 13. We do not knowingly collect personal
                data from children under 13. If you believe we have done so, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes
                via email if you have an account with us.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">11. Contact</h2>
              <p>
                Privacy questions?{" "}
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


