import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Unsubscribed — The Muslim Man",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function UnsubscribedPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const isInvalid = status === "invalid";

  return (
    <main className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6 py-20">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-surface border border-border">
          {isInvalid ? (
            <span className="text-2xl">⚠️</span>
          ) : (
            <span className="text-2xl">✓</span>
          )}
        </div>

        {isInvalid ? (
          <>
            <h1 className="text-2xl font-bold text-text">Invalid unsubscribe link</h1>
            <p className="text-text-secondary text-sm leading-relaxed">
              This link has already been used or is no longer valid.
              If you&apos;re still receiving emails you didn&apos;t sign up for, please{" "}
              <Link href="/contact" className="text-gold hover:underline">contact us</Link>.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-text">You&apos;ve been unsubscribed</h1>
            <p className="text-text-secondary text-sm leading-relaxed">
              You won&apos;t receive any more emails from us. If this was a mistake,
              you can always sign up again from the course page.
            </p>
          </>
        )}

        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl bg-surface border border-border text-text-secondary hover:text-text text-sm transition-colors"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
