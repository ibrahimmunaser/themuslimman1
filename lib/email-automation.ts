import { Resend } from "resend";
import { prisma } from "./db";

const FROM = process.env.EMAIL_FROM ?? "TheMuslimMan <noreply@themuslimman.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";

// ─── Test / blocked domains ────────────────────────────────────────────────────
const BLOCKED_DOMAINS = new Set([
  "example.com", "test.com", "testonly.dev", "mailinator.com", "mailtest.com",
]);
const BLOCKED_KEYWORDS = [
  "guesttest", "qatest", "smoketest", "stress-test",
  "testpurchase", "testgooglepay", "paid-verified",
  "unpaid-verified", "unpaid-unverified",
];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isBlockedEmail(email: string): string | null {
  if (!EMAIL_REGEX.test(email)) return "invalid format";
  const lower = email.toLowerCase();
  const domain = lower.split("@")[1] ?? "";
  if (BLOCKED_DOMAINS.has(domain)) return `blocked domain (${domain})`;
  for (const kw of BLOCKED_KEYWORDS) {
    if (lower.includes(kw)) return `blocked keyword (${kw})`;
  }
  return null;
}

/**
 * Get or create an unsubscribe token for an email address.
 * Stores it in EmailUnsubscribe so the /api/unsubscribe endpoint can verify it.
 */
export async function getOrCreateUnsubscribeToken(email: string): Promise<string> {
  const existing = await prisma.emailUnsubscribe.findUnique({ where: { email } });
  if (existing) return existing.token;
  const token = crypto.randomUUID();
  await prisma.emailUnsubscribe.create({
    data: { id: crypto.randomUUID(), email, token },
  });
  return token;
}

export function buildUnsubscribeUrl(token: string): string {
  return `${APP_URL}/api/unsubscribe?token=${token}`;
}

// ─── Manual outreach template ──────────────────────────────────────────────────

export function buildManualOutreachHtml(opts: {
  firstName: string;
  unsubscribeUrl: string;
}): string {
  const { firstName, unsubscribeUrl } = opts;
  const year     = new Date().getFullYear();
  const part1Url = `${APP_URL}/seerah?utm_source=email&utm_medium=manual_outreach&utm_campaign=no_plan_part1`;

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
      You created an account on The Muslim Man, but you do not need to choose a plan right away.
    </p>

    <p style="font-size:15px;margin:0 0 16px 0;color:#333;">
      Start with Part 1 for free and see how the course is structured.
    </p>

    <p style="font-size:15px;margin:0 0 24px 0;color:#333;">
      The goal is simple: to help Muslims learn the life of the Prophet ﷺ in order, step by step — not scattered stories.
    </p>

    <p style="font-size:15px;margin:0 0 8px 0;color:#333;">Watch Part 1 free:</p>

    <div style="text-align:center;margin:24px 0 32px 0;">
      <a href="${part1Url}"
         style="display:inline-block;background:#f4c542;color:#1a1a1a;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;">
        Watch Part 1 Free
      </a>
    </div>

    <p style="font-size:14px;color:#666;margin:0 0 0 0;">
      If you find it useful, you can choose a plan later.
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
      You received this because you created an account on TheMuslimMan.
      <a href="${unsubscribeUrl}" style="color:#aaa;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;
}

export async function sendManualOutreachEmail(opts: {
  userId?: string;
  email: string;
  fullName: string;
}): Promise<void> {
  const { email, fullName } = opts;
  const firstName     = (fullName ?? "").split(" ")[0] ?? "";
  const unsubToken    = await getOrCreateUnsubscribeToken(email);
  const unsubscribeUrl = buildUnsubscribeUrl(unsubToken);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const html   = buildManualOutreachHtml({ firstName, unsubscribeUrl });

  const { error } = await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: "The first lesson is unlocked",
    html,
  });

  if (error) throw new Error(error.message ?? "Resend error");
}

function footer(year: number) {
  return `
    <div style="background:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e5e5e5;border-top:none;">
      <p style="font-size:12px;color:#999;margin:0;">
        © ${year} TheMuslimMan · Complete Seerah
      </p>
      <p style="font-size:11px;color:#bbb;margin:6px 0 0 0;">
        You received this because you created an account on TheMuslimMan.
      </p>
    </div>
  `;
}

function buildStep1Html(firstName: string): string {
  const year = new Date().getFullYear();
  const part1Url = `${APP_URL}/seerah?utm_source=email&utm_medium=no_plan_recovery&utm_campaign=no_plan_step_1`;

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
    <p style="font-size:16px;margin:0 0 20px 0;">Asalamu Alaikum${firstName ? `, ${firstName}` : ""},</p>

    <p style="font-size:15px;margin:0 0 16px 0;color:#333;">
      You created an account on The Muslim Man, but you do not need to choose a plan right away.
    </p>

    <p style="font-size:15px;margin:0 0 16px 0;color:#333;">
      Start with Part 1 for free and see how the course is structured.
    </p>

    <p style="font-size:15px;margin:0 0 24px 0;color:#333;">
      The goal is simple: to help Muslims learn the life of the Prophet ﷺ in order, step by step — not scattered stories.
    </p>

    <div style="text-align:center;margin:32px 0;">
      <a href="${part1Url}"
         style="display:inline-block;background:#f4c542;color:#1a1a1a;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;">
        Watch Part 1 Free
      </a>
    </div>

    <p style="font-size:14px;color:#666;margin:0 0 0 0;">
      If you find it useful, you can choose a plan later.
    </p>

    <p style="font-size:15px;color:#333;margin:32px 0 0 0;">
      Jazak Allahu khayran,<br>
      <strong>The Muslim Man</strong>
    </p>
  </div>

  ${footer(year)}
</body>
</html>`;
}

function buildStep2Html(firstName: string): string {
  const year = new Date().getFullYear();
  const part1Url = `${APP_URL}/seerah?utm_source=email&utm_medium=no_plan_recovery&utm_campaign=no_plan_step_2`;
  const plansUrl = `${APP_URL}/pricing?utm_source=email&utm_medium=no_plan_recovery&utm_campaign=no_plan_step_2`;

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
    <p style="font-size:16px;margin:0 0 20px 0;">Asalamu Alaikum${firstName ? `, ${firstName}` : ""},</p>

    <p style="font-size:15px;margin:0 0 16px 0;color:#333;">
      A lot of Muslims know individual stories from the life of the Prophet ﷺ, but many never learn the full timeline from beginning to end.
    </p>

    <p style="font-size:15px;margin:0 0 16px 0;color:#333;">
      That is why The Muslim Man is built in 100 structured parts, with videos, quizzes, flashcards, summaries, mind maps, and presentations.
    </p>

    <p style="font-size:15px;margin:0 0 24px 0;color:#333;">
      You can continue with Part 1 free here:
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${part1Url}"
         style="display:inline-block;background:#f4c542;color:#1a1a1a;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;">
        Continue Part 1
      </a>
    </div>

    <p style="font-size:15px;margin:24px 0 20px 0;color:#333;">
      If you want full access, lifetime plans are available as a one-time payment.
    </p>

    <div style="text-align:center;margin:0 0 28px 0;">
      <a href="${plansUrl}"
         style="display:inline-block;background:#ffffff;color:#1a1a1a;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;border:2px solid #e5e5e5;">
        View Plans
      </a>
    </div>

    <p style="font-size:15px;color:#333;margin:32px 0 0 0;">
      Jazak Allahu khayran,<br>
      <strong>The Muslim Man</strong>
    </p>
  </div>

  ${footer(year)}
</body>
</html>`;
}

export async function sendNoPlanRecoveryEmail(opts: {
  userId: string;
  email: string;
  fullName: string;
  step: 1 | 2;
}): Promise<void> {
  const { email, fullName, step } = opts;
  const firstName = (fullName ?? "").split(" ")[0] ?? "";

  const resend = new Resend(process.env.RESEND_API_KEY);

  const subject =
    step === 1
      ? "The first lesson is unlocked"
      : "Most Muslims learn scattered stories";

  const html = step === 1 ? buildStep1Html(firstName) : buildStep2Html(firstName);

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message ?? "Resend error");
  }
}
