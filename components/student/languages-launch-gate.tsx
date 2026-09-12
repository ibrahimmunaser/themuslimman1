import { prisma } from "@/lib/db";
import { parseLang, COURSE_LANG_COOKIE } from "@/lib/course-lang";
import { cookies } from "next/headers";
import { LanguagesLaunchModal } from "@/components/student/languages-launch-modal";

/**
 * Server gate for the one-time 3-languages celebration.
 * Mount inside StudentLayout so sign-in and post-signup student pages all cover it.
 */
export async function LanguagesLaunchGate({ userId }: { userId: string }) {
  const cookieStore = await cookies();
  const lang = parseLang(cookieStore.get(COURSE_LANG_COOKIE)?.value);

  // Raw query so this works even before `prisma generate` refreshes the typed client
  // (Windows often locks the query engine while `next dev` is running).
  const rows = await prisma.$queryRaw<Array<{ seen: boolean }>>`
    SELECT "hasSeenLanguagesAnnouncement" AS seen
    FROM "User"
    WHERE id = ${userId}
    LIMIT 1
  `;
  const show = rows[0]?.seen === false;

  return <LanguagesLaunchModal show={show} lang={lang} />;
}
