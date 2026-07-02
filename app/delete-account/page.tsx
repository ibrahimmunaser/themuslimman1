import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delete Account — Complete Seerah",
  description: "Request deletion of your Complete Seerah account and associated personal data.",
};

export default function DeleteAccountPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ink py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-text mb-3">
              Delete Your The Muslim Man Account
            </h1>
            <p className="text-text-secondary text-base">
              Request permanent deletion of your Complete Seerah account and associated data for The
              Muslim Man app at any time.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-6 text-text-secondary text-sm leading-relaxed">
            <section>
              <h2 className="text-base font-semibold text-text mb-2">What gets deleted</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Your account profile (name and email)</li>
                <li>Course progress and completion records</li>
                <li>Subscription and purchase entitlement data linked to your account</li>
              </ul>
              <p className="mt-3">
                We may retain limited billing records where required by law (for example, tax or fraud
                prevention obligations).
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">How to request deletion</h2>
              <p>
                Email{" "}
                <a href="mailto:themuslimman77@gmail.com" className="text-gold hover:underline">
                  themuslimman77@gmail.com
                </a>{" "}
                from the address associated with your account, or use our{" "}
                <Link href="/contact" className="text-gold hover:underline">
                  contact form
                </Link>{" "}
                and select a support request. Include the subject line &quot;Account deletion request&quot;
                and the email address you used to sign up.
              </p>
              <p className="mt-3">
                We will verify your identity and delete your account within 30 days. You will receive
                a confirmation email once deletion is complete.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text mb-2">Before you delete</h2>
              <p>
                Deletion is permanent. You will lose access to purchased course content tied to this
                account. If you only need to cancel a subscription, contact us and we can help without
                deleting your account.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
