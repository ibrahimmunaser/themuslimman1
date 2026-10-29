import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ContactForm } from "@/components/help/contact-form";
import { Mail, Clock } from "lucide-react";
import { getPreviewLangFromCookies } from "@/lib/part1-preview-data";
import { siteT } from "@/lib/site-copy";

export async function generateMetadata() {
  const lang = await getPreviewLangFromCookies();
  return {
    title: siteT(lang, "footContact"),
    description: siteT(lang, "contactMetaDesc"),
  };
}

export default async function ContactPage() {
  const lang = await getPreviewLangFromCookies();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ink py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-text mb-3">
              {siteT(lang, "footContact")}
            </h1>
            <p className="text-text-secondary text-base">{siteT(lang, "contactIntro")}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            <div className="p-5 rounded-xl border border-border bg-surface flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text mb-0.5">
                  {siteT(lang, "contactEmailCard")}
                </p>
                <a
                  href="mailto:themuslimman77@gmail.com"
                  dir="ltr"
                  className="text-sm text-gold hover:underline inline-block"
                >
                  themuslimman77@gmail.com
                </a>
              </div>
            </div>
            <div className="p-5 rounded-xl border border-border bg-surface flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text mb-0.5">
                  {siteT(lang, "contactResponseCard")}
                </p>
                <p className="text-sm text-text-secondary">{siteT(lang, "contactResponseTime")}</p>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
