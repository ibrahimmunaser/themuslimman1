import { Resend } from "resend";
import {
  buildUnsubscribeUrl,
  getOrCreateUnsubscribeToken,
  isBlockedEmail,
} from "@/lib/email-automation";
import { escapeHtml } from "@/lib/html-escape";

const FROM = process.env.EMAIL_FROM ?? "TheMuslimMan <noreply@themuslimman.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";

export const LANGUAGES_LAUNCH_OUTREACH_TYPE = "LANGUAGES_LAUNCH";
export const LANGUAGES_LAUNCH_SUBJECT =
  "Complete Seerah is now in English, Arabic & French";

export function buildLanguagesLaunchHtml(opts: {
  firstName: string;
  unsubscribeUrl: string;
}): string {
  const { firstName, unsubscribeUrl } = opts;
  const year = new Date().getFullYear();
  const homeUrl = `${APP_URL}/?utm_source=email&utm_medium=languages_launch&utm_campaign=three_languages`;
  const previewUrl = `${APP_URL}/#preview?utm_source=email&utm_medium=languages_launch&utm_campaign=three_languages`;
  const waText = encodeURIComponent(
    "Complete Seerah is now available in English, Arabic, and French — with more languages coming. Learn the life of the Prophet ﷺ in order: https://themuslimman.com",
  );
  const waUrl = `https://wa.me/?text=${waText}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:30px 20px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:#f4c542;margin:0 0 6px 0;font-size:22px;">The Muslim Man</h1>
    <p style="color:#aaa;margin:0;font-size:14px;">Complete Seerah</p>
  </div>

  <div style="background:#ffffff;padding:40px 30px;border:1px solid #e5e5e5;border-top:none;">
    <p style="font-size:16px;margin:0 0 20px 0;">Asalamu Alaikum${firstName ? ` ${firstName}` : ""},</p>

    <p style="font-size:15px;margin:0 0 16px 0;color:#333;">
      Great news — <strong>Complete Seerah is now available in three languages:</strong>
      English, Arabic, and French.
    </p>

    <p style="font-size:15px;margin:0 0 16px 0;color:#333;">
      That includes the lessons, quizzes, flashcards, and reference guides. And we plan to add more languages next.
    </p>

    <p style="font-size:15px;margin:0 0 24px 0;color:#333;">
      If you have not started yet, Part 1 is still free — no account required. Switch languages anytime with the EN / عربي / FR toggle.
    </p>

    <div style="text-align:center;margin:24px 0 16px 0;">
      <a href="${previewUrl}"
         style="display:inline-block;background:#f4c542;color:#1a1a1a;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;">
        Try Part 1 Free
      </a>
    </div>

    <div style="text-align:center;margin:0 0 28px 0;">
      <a href="${waUrl}"
         style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">
        Share on WhatsApp
      </a>
    </div>

    <p style="font-size:14px;color:#666;margin:0;">
      Or visit <a href="${homeUrl}" style="color:#c8a96e;">themuslimman.com</a> anytime.
    </p>

    <p style="font-size:15px;color:#333;margin:32px 0 0 0;">
      Jazak Allahu khayran,<br>
      <strong>The Muslim Man</strong>
    </p>
  </div>

  <div style="background:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e5e5e5;border-top:none;">
    <p style="font-size:12px;color:#999;margin:0 0 6px 0;">
      © ${year} TheMuslimMan · Complete Seerah
    </p>
    <p style="font-size:11px;color:#bbb;margin:0;">
      You received this because you visited TheMuslimMan or shared your email with us.
      <a href="${unsubscribeUrl}" style="color:#aaa;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;
}

export async function sendLanguagesLaunchEmail(opts: {
  email: string;
  fullName: string;
}): Promise<void> {
  const block = isBlockedEmail(opts.email);
  if (block) throw new Error(block);

  const firstName = escapeHtml((opts.fullName ?? "").split(" ")[0] ?? "");
  const unsubToken = await getOrCreateUnsubscribeToken(opts.email);
  const unsubscribeUrl = buildUnsubscribeUrl(unsubToken);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const html = buildLanguagesLaunchHtml({ firstName, unsubscribeUrl });

  const { error } = await resend.emails.send({
    from: FROM,
    to: opts.email,
    subject: LANGUAGES_LAUNCH_SUBJECT,
    html,
  });

  if (error) throw new Error(error.message ?? "Resend error");
}
