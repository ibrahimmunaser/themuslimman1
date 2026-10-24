import type { CourseLang } from "./course-lang";

/** Native digits for languages that keep place value and swap the glyphs. */
const NATIVE_DIGITS: Partial<Record<CourseLang, string>> = {
  ar: "٠١٢٣٤٥٦٧٨٩",
  fa: "۰۱۲۳۴۵۶۷۸۹",
  ur: "۰۱۲۳۴۵۶۷۸۹",
  bn: "০১২৩৪৫৬৭৮৯",
  hi: "०१२३४५६७८९",
};

const ZH = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;

function chineseUnder100(n: number): string {
  if (n < 10) return ZH[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const tenPart = tens === 1 ? "十" : `${ZH[tens]}十`;
  return ones === 0 ? tenPart : `${tenPart}${ZH[ones]}`;
}

/** Integers 0–9999 as spoken Chinese numerals. 3 → 三, 12 → 十二, 100 → 一百. */
export function toChineseNumber(n: number): string {
  const neg = n < 0;
  const value = Math.trunc(Math.abs(n));
  if (value === 0) return "零";
  if (value > 9999) return String(neg ? -value : value);

  let rest = value;
  let out = "";
  if (rest >= 1000) {
    out += `${ZH[Math.floor(rest / 1000)]}千`;
    rest %= 1000;
    if (rest > 0 && rest < 100) out += "零";
  }
  if (rest >= 100) {
    out += `${ZH[Math.floor(rest / 100)]}百`;
    rest %= 100;
    if (rest > 0 && rest < 10) out += "零";
  }
  if (rest > 0) out += chineseUnder100(rest);
  return neg ? `负${out}` : out;
}

function mapDigits(digits: string, raw: string): string {
  return raw.replace(/[0-9]/g, (d) => digits[Number(d)] ?? d);
}

/** Render a course number in the selected language's numerals. */
export function formatCourseNumber(lang: CourseLang, value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (lang === "zh" && Number.isInteger(value) && Math.abs(value) <= 9999) {
    return toChineseNumber(value);
  }
  const digits = NATIVE_DIGITS[lang];
  const raw = String(value);
  return digits ? mapDigits(digits, raw) : raw;
}

/** Rewrite Western digits inside a finished UI string for the selected language. */
export function localizeNumerals(lang: CourseLang, text: string): string {
  if (!text || lang === "en") return text;
  if (lang === "zh") {
    return text.replace(/\d+/g, (chunk) => {
      const n = Number(chunk);
      if (!Number.isInteger(n) || n > 9999) return chunk;
      return toChineseNumber(n);
    });
  }
  const digits = NATIVE_DIGITS[lang];
  return digits ? mapDigits(digits, text) : text;
}
