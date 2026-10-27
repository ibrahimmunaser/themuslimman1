import { cookies } from "next/headers";
import { LangToggle } from "@/components/part/lang-toggle";
import { COURSE_LANG_COOKIE, isRtlLang, parseLang } from "@/lib/course-lang";

/** Sticky language menu at the top of every page. */
export async function SiteLangBar() {
  const cookieStore = await cookies();
  const lang = parseLang(cookieStore.get(COURSE_LANG_COOKIE)?.value);

  return (
    <div
      className="sticky top-0 z-[100] flex h-12 items-center justify-end border-b border-white/10 bg-ink/95 px-3 backdrop-blur sm:px-4"
      dir={isRtlLang(lang) ? "rtl" : "ltr"}
    >
      <LangToggle current={lang} nav />
    </div>
  );
}
