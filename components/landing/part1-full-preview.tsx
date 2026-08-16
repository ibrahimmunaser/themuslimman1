import { getPart1PreviewData, getPreviewLangFromCookies } from "@/lib/part1-preview-data";
import { Part1PreviewTabs } from "@/components/landing/part1-preview-tabs";
import { LangToggle } from "@/components/part/lang-toggle";
import { Badge } from "@/components/ui/badge";

export async function Part1FullPreview({
  checkoutHref = "/checkout?plan=individual-lifetime",
  hideCta = false,
  ctaLabel = "Get Lifetime Access — $49",
}: {
  checkoutHref?: string;
  hideCta?: boolean;
  ctaLabel?: string;
} = {}) {
  const lang = await getPreviewLangFromCookies();
  const { part, initialAssetUrls } = await getPart1PreviewData(lang);
  const isRtl = lang === "ar";

  if (!part) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-text-secondary">
          {isRtl
            ? "معاينة الجزء الأول غير متاحة مؤقتًا. يرجى المحاولة لاحقًا."
            : "Part 1 preview is temporarily unavailable. Please try again later."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gold/20 bg-surface overflow-hidden" dir={isRtl ? "rtl" : undefined}>
      <div className="p-4 bg-surface-raised border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
              {isRtl ? "معاينة كاملة — بدون تسجيل" : "Complete Preview — No Signup Required"}
            </p>
            <h3 className="text-xl font-bold text-text">
              {isRtl ? `الجزء ١: ${part.title}` : `Part 1: ${part.title}`}
            </h3>
            {part.subtitle && (
              <p className="text-sm text-text-secondary mt-1">{part.subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
            <LangToggle current={lang} partNumber={1} />
            <Badge variant="gold" size="sm">
              {isRtl ? "مجاني ١٠٠٪" : "100% Free"}
            </Badge>
          </div>
        </div>
        {part.description && (
          <p className="text-sm text-text-secondary mt-3 leading-relaxed">
            {part.description}
          </p>
        )}
      </div>

      <div className="bg-surface px-4 sm:px-6 py-6">
        <Part1PreviewTabs
          part={part}
          initialAssetUrls={initialAssetUrls}
          initialLang={lang}
          hideLangToggle
        />
      </div>

      {!hideCta && (
        <div className="p-8 border-t border-gold/20 bg-surface-raised text-center">
          <p className="text-xs font-bold text-gold uppercase tracking-widest mb-2">
            {isRtl ? "جاهز للجزء ٢؟" : "Ready for Part 2?"}
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-text mb-2">
            {isRtl ? "تابع الدورة كاملة." : "Continue the full course."}
          </h3>
          <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto leading-relaxed">
            {isRtl
              ? "كل جزء بنفس الأسلوب — فيديو وقراءة وشرائح واختبار وبطاقات تعليمية. ١٠٠ جزء. قصة واحدة متصلة."
              : "Every part follows the same format — video, reading, slides, quiz, and flashcards. 100 parts. One connected story."}
          </p>
          <a
            href={checkoutHref}
            data-track="checkout_clicked"
            data-plan="individual-lifetime"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-ink font-bold text-base shadow-lg shadow-gold/30 transition-all hover:shadow-gold/40 hover:scale-[1.02] active:scale-[0.99]"
          >
            {ctaLabel}
          </a>
          <p className="text-xs text-text-muted mt-4">
            {isRtl
              ? "ألغِ في أي وقت · ضمان استرداد خلال ٧ أيام"
              : "Cancel anytime · 7-day refund guarantee"}
          </p>
        </div>
      )}
    </div>
  );
}
