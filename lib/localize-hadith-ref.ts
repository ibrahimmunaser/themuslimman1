/** Shorten verbose English references, then optionally localize for Arabic UI. */
export function formatHadithRef(ref: string | undefined, isRtl?: boolean): string {
  if (!ref) return "";

  let short = ref
    .replace("Sahih al-Bukhari and Sahih Muslim", "Bukhari & Muslim")
    .replace("Sahih al-Bukhari; Sahih Muslim", "Bukhari & Muslim")
    .replace(/Sahih al-Bukhari/g, "Bukhari")
    .replace(/Sahih Muslim/g, "Muslim")
    .replace(/Jamiʿ al-Tirmidhi|Jami‘ at-Tirmidhi|Sunan at-Tirmidhi/g, "Tirmidhi")
    .replace(/Sunan Abi Dawud/g, "Abu Dawud")
    .replace(/\s*\(report of [^)]+\)/g, "");

  if (!isRtl) return short.trim();

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
