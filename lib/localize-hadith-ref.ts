import type { CourseLang } from "./course-lang";

/** Shorten verbose English references, then optionally localize for AR/FR UI. */
export function formatHadithRef(
  ref: string | undefined,
  langOrRtl?: CourseLang | boolean,
): string {
  if (!ref) return "";

  let short = ref
    .replace("Sahih al-Bukhari and Sahih Muslim", "Bukhari & Muslim")
    .replace("Sahih al-Bukhari; Sahih Muslim", "Bukhari & Muslim")
    .replace(/Sahih al-Bukhari/g, "Bukhari")
    .replace(/Sahih Muslim/g, "Muslim")
    .replace(/Jamiʿ al-Tirmidhi|Jami‘ at-Tirmidhi|Sunan at-Tirmidhi/g, "Tirmidhi")
    .replace(/Sunan Abi Dawud/g, "Abu Dawud")
    .replace(/\s*\(report of [^)]+\)/g, "");

  const lang: CourseLang | "en" =
    langOrRtl === true || langOrRtl === "ar"
      ? "ar"
      : langOrRtl === "fr"
        ? "fr"
        : "en";

  if (lang === "en") return short.trim();

  if (lang === "fr") {
    return short
      .replace(/Qur'an/g, "Coran")
      .replace(/Bukhari & Muslim/g, "Boukhari & Mouslim")
      .replace(/Bukhari/g, "Boukhari")
      .replace(/Muslim/g, "Mouslim")
      .replace(/Abu Dawud/g, "Abou Dawoud")
      .replace(/Tirmidhi/g, "Tirmidhi")
      .replace(/Ibn Majah/g, "Ibn Majah")
      .replace(/Ahmad/g, "Ahmad")
      .replace(/Tabarani/g, "Tabarani")
      .trim();
  }

  return short
    .replace(/Qur'an/g, "القرآن")
    .replace(/Bukhari & Muslim/g, "البخاري ومسلم")
    .replace(/Bukhari/g, "البخاري")
    .replace(/Muslim/g, "مسلم")
    .replace(/Abu Dawud/g, "أبو داود")
    .replace(/Tirmidhi/g, "الترمذي")
    .replace(/Ibn Majah/g, "ابن ماجه")
    .replace(/Ahmad/g, "أحمد")
    .replace(/Tabarani/g, "الطبراني")
    .replace(/ · /g, " · ")
    .trim();
}
