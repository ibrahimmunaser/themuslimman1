import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { Lock } from "lucide-react";
import { COURSE_LANG_COOKIE, parseLang } from "@/lib/course-lang";
import { siteT } from "@/lib/site-copy";

/** Minimal checkout header — no nav links, no escape paths, just logo + trust signal. */
export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = parseLang((await cookies()).get(COURSE_LANG_COOKIE)?.value);
  return (
    <>
      <header className="border-b border-zinc-800 bg-zinc-950 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logoicon.png"
              alt="TheMuslimMan"
              width={967}
              height={219}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Lock className="w-3.5 h-3.5" />
            {siteT(lang, "ckSecure")}
          </div>
        </div>
      </header>
      <div>{children}</div>
    </>
  );
}
