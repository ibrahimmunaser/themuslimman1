import { Resend } from "resend";
import { isBlockedEmail, getOrCreateUnsubscribeToken, buildUnsubscribeUrl } from "./email-automation";

const FROM    = process.env.EMAIL_FROM    ?? "TheMuslimMan <noreply@themuslimman.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";

// CAN-SPAM §5(a)(5): must be a valid physical postal address. Update before sending live emails.
const PHYSICAL_ADDRESS = process.env.EMAIL_PHYSICAL_ADDRESS ?? "TheMuslimMan · PO Box 1234 · New York, NY 10001 · USA";

// ─── Checkout URL helpers ──────────────────────────────────────────────────────

function checkoutUrl(recommendedPlan: string, source: string | null, step: number): string {
  // Preserve the exact plan the quiz recommended — do not downgrade lifetime to monthly.
  // Unknown/empty plans fall back to individual-monthly.
  const knownPlans = ["individual-monthly", "individual-lifetime", "family-monthly", "family-lifetime"];
  const plan = knownPlans.includes(recommendedPlan) ? recommendedPlan : "individual-monthly";
  const base = `${APP_URL}/checkout`;
  const p = new URLSearchParams({
    plan,
    utm_source:   "email",
    utm_medium:   "checkup_followup",
    utm_campaign: `checkup_step_${step}`,
  });
  if (source) p.set("source", source);
  return `${base}?${p.toString()}`;
}

function part1Url(step: number): string {
  return `${APP_URL}/seerah?utm_source=email&utm_medium=checkup_followup&utm_campaign=checkup_step_${step}`;
}

// ─── Shared footer ─────────────────────────────────────────────────────────────

function footer(unsubscribeUrl: string): string {
  const year = new Date().getFullYear();
  return `
  <div style="background:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e5e5e5;border-top:none;">
    <p style="font-size:12px;color:#999;margin:0 0 4px 0;">© ${year} TheMuslimMan · Complete Seerah</p>
    <p style="font-size:11px;color:#bbb;margin:0 0 4px 0;">${PHYSICAL_ADDRESS}</p>
    <p style="font-size:11px;color:#bbb;margin:0;">
      You received this because you completed the Seerah Checkup quiz.
      <a href="${unsubscribeUrl}" style="color:#aaa;">Unsubscribe</a>
    </p>
  </div>`;
}

function header(): string {
  return `
  <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:30px 20px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:#f4c542;margin:0 0 6px 0;font-size:22px;">The Muslim Man</h1>
    <p style="color:#aaa;margin:0;font-size:14px;">Complete Seerah</p>
  </div>`;
}

// ─── Step 1: 2-hour reminder (score + result link) ────────────────────────────

export function buildStep1Html(opts: {
  firstName: string;
  score: number;
  resultType: string;
  recommendedPlan: string;
  source: string | null;
  unsubscribeUrl: string;
}): string {
  const { firstName, score, resultType, recommendedPlan, source, unsubscribeUrl } = opts;
  const resultLabel = resultType === "strong"    ? "Strong Foundation"
    : resultType === "partial"   ? "Partial Knowledge"
    : resultType === "scattered" ? "Foundation Needs Structure"
    : "Just Getting Started";
  const ctaUrl = checkoutUrl(recommendedPlan, source, 1);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  ${header()}
  <div style="background:#ffffff;padding:40px 30px;border:1px solid #e5e5e5;border-top:none;">
    <p style="font-size:16px;margin:0 0 20px 0;">Asalamu Alaikum${firstName ? ` ${firstName}` : ""},</p>

    <p style="font-size:15px;margin:0 0 8px 0;color:#333;">Your Seerah Checkup result:</p>

    <div style="background:#f9f5e7;border:1px solid #f4c542;border-radius:10px;padding:20px 24px;margin:0 0 24px 0;text-align:center;">
      <p style="font-size:32px;font-weight:700;color:#1a1a1a;margin:0 0 4px 0;">${score}/100</p>
      <p style="font-size:14px;color:#666;margin:0;">${resultLabel}</p>
    </div>

    <p style="font-size:15px;margin:0 0 16px 0;color:#333;">
      Most Muslims score in a similar range. The goal of The Muslim Man is to take you from wherever you are to a complete, structured understanding of the Seerah — in order, from beginning to end.
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${ctaUrl}"
         style="display:inline-block;background:#f4c542;color:#1a1a1a;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;">
        View Your Plan
      </a>
    </div>

    <p style="font-size:14px;color:#666;margin:0;">Or start with Part 1 free: <a href="${part1Url(1)}" style="color:#b8902a;">Watch here</a></p>

    <p style="font-size:15px;color:#333;margin:32px 0 0 0;">
      Jazak Allahu khayran,<br>
      <strong>The Muslim Man</strong>
    </p>
  </div>
  ${footer(unsubscribeUrl)}
</body>
</html>`;
}

// ─── Step 2: 24-hour educational ──────────────────────────────────────────────

export function buildStep2Html(opts: {
  firstName: string;
  objection: string | null;
  unsubscribeUrl: string;
}): string {
  const { firstName, objection, unsubscribeUrl } = opts;
  const p1 = part1Url(2);

  const objectionLine = objection
    ? `<p style="font-size:15px;margin:0 0 16px 0;color:#333;">You mentioned: <em>"${objection}"</em> — that is one of the most common reasons. The Muslim Man is designed specifically for that.</p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  ${header()}
  <div style="background:#ffffff;padding:40px 30px;border:1px solid #e5e5e5;border-top:none;">
    <p style="font-size:16px;margin:0 0 20px 0;">Asalamu Alaikum${firstName ? ` ${firstName}` : ""},</p>

    <p style="font-size:15px;margin:0 0 16px 0;color:#333;">
      Most Muslims know individual stories from the life of the Prophet ﷺ. Very few know the full timeline in order.
    </p>

    ${objectionLine}

    <p style="font-size:15px;margin:0 0 16px 0;color:#333;">
      The Muslim Man is 100 structured parts — short videos, quizzes, flashcards, mind maps, and summaries — built to take you through the entire Seerah step by step.
    </p>

    <p style="font-size:15px;margin:0 0 24px 0;color:#333;">Part 1 is free. No account needed to start.</p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${p1}"
         style="display:inline-block;background:#f4c542;color:#1a1a1a;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;">
        Watch Part 1 Free
      </a>
    </div>

    <p style="font-size:15px;color:#333;margin:32px 0 0 0;">
      Jazak Allahu khayran,<br>
      <strong>The Muslim Man</strong>
    </p>
  </div>
  ${footer(unsubscribeUrl)}
</body>
</html>`;
}

// ─── Step 3: 72-hour plan recommendation ──────────────────────────────────────

export function buildStep3Html(opts: {
  firstName: string;
  score: number;
  recommendedPlan: string;
  audienceType: string | null;
  source: string | null;
  unsubscribeUrl: string;
}): string {
  const { firstName, score, recommendedPlan, audienceType, source, unsubscribeUrl } = opts;
  const isFamily   = recommendedPlan.includes("family") || audienceType === "family" || audienceType === "self_and_family";
  const planLabel  = isFamily ? "Family Plan — $9.99/mo" : "Individual Plan — $4.99/mo";
  const planNote   = isFamily
    ? "Full access for you and your family — one payment."
    : "Full access to all 100 parts — one low monthly cost.";
  const ctaUrl     = checkoutUrl(isFamily ? "family-monthly" : "individual-monthly", source, 3);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  ${header()}
  <div style="background:#ffffff;padding:40px 30px;border:1px solid #e5e5e5;border-top:none;">
    <p style="font-size:16px;margin:0 0 20px 0;">Asalamu Alaikum${firstName ? ` ${firstName}` : ""},</p>

    <p style="font-size:15px;margin:0 0 16px 0;color:#333;">
      You scored <strong>${score}/100</strong> on the Seerah Checkup.
    </p>

    <p style="font-size:15px;margin:0 0 16px 0;color:#333;">
      Based on your answers, we recommend:
    </p>

    <div style="background:#f9f5e7;border:1px solid #f4c542;border-radius:10px;padding:20px 24px;margin:0 0 24px 0;">
      <p style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0 0 4px 0;">${planLabel}</p>
      <p style="font-size:14px;color:#666;margin:0;">${planNote}</p>
    </div>

    <p style="font-size:15px;margin:0 0 24px 0;color:#333;">
      This gives you access to all 100 structured parts of the Seerah, plus quizzes, flashcards, mind maps, and summaries.
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${ctaUrl}"
         style="display:inline-block;background:#f4c542;color:#1a1a1a;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;">
        Unlock Full Access
      </a>
    </div>

    <p style="font-size:15px;color:#333;margin:32px 0 0 0;">
      Jazak Allahu khayran,<br>
      <strong>The Muslim Man</strong>
    </p>
  </div>
  ${footer(unsubscribeUrl)}
</body>
</html>`;
}

// ─── Step 4: Checkout recovery (1 hour after checkout click) ──────────────────

export function buildStep4Html(opts: {
  firstName: string;
  recommendedPlan: string;
  source: string | null;
  unsubscribeUrl: string;
}): string {
  const { firstName, recommendedPlan, source, unsubscribeUrl } = opts;
  const isFamily  = recommendedPlan.includes("family");
  const planLabel = isFamily ? "Family Plan" : "Individual Plan";
  const ctaUrl    = checkoutUrl(recommendedPlan, source, 4);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  ${header()}
  <div style="background:#ffffff;padding:40px 30px;border:1px solid #e5e5e5;border-top:none;">
    <p style="font-size:16px;margin:0 0 20px 0;">Asalamu Alaikum${firstName ? ` ${firstName}` : ""},</p>

    <p style="font-size:15px;margin:0 0 16px 0;color:#333;">
      You started the checkout for the <strong>${planLabel}</strong> but did not complete it.
    </p>

    <p style="font-size:15px;margin:0 0 24px 0;color:#333;">
      Your progress is still there. It takes less than a minute to complete.
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${ctaUrl}"
         style="display:inline-block;background:#f4c542;color:#1a1a1a;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;">
        Complete Your Order
      </a>
    </div>

    <p style="font-size:14px;color:#666;margin:0;">
      Questions? Reply to this email — we read every message.
    </p>

    <p style="font-size:15px;color:#333;margin:32px 0 0 0;">
      Jazak Allahu khayran,<br>
      <strong>The Muslim Man</strong>
    </p>
  </div>
  ${footer(unsubscribeUrl)}
</body>
</html>`;
}

// ─── Send helper ───────────────────────────────────────────────────────────────

export interface CheckupLeadForEmail {
  id:             string;
  email:          string;
  name:           string | null;
  score:          number;
  resultType:     string;
  purchasedAt?:   Date | null;
  recommendedPlan: string;
  mainObjection:  string | null;
  audienceType:   string | null;
  source:         string | null;
}

export async function sendCheckupFollowupEmail(
  lead: CheckupLeadForEmail,
  step: 1 | 2 | 3 | 4,
): Promise<void> {
  const blocked = isBlockedEmail(lead.email);
  if (blocked) throw new Error(`Blocked: ${blocked}`);

  const firstName      = (lead.name ?? "").split(" ")[0] ?? "";
  const unsubToken     = await getOrCreateUnsubscribeToken(lead.email);
  const unsubscribeUrl = buildUnsubscribeUrl(unsubToken);

  const subjects: Record<number, string> = {
    1: `Your Seerah score: ${lead.score}/100`,
    2: "Most Muslims learn the Seerah out of order",
    3: "The plan we recommended for you",
    4: "You were close — your checkout is still open",
  };

  let html: string;
  if (step === 1) {
    html = buildStep1Html({
      firstName, score: lead.score, resultType: lead.resultType,
      recommendedPlan: lead.recommendedPlan, source: lead.source, unsubscribeUrl,
    });
  } else if (step === 2) {
    html = buildStep2Html({ firstName, objection: lead.mainObjection, unsubscribeUrl });
  } else if (step === 3) {
    html = buildStep3Html({
      firstName, score: lead.score, recommendedPlan: lead.recommendedPlan,
      audienceType: lead.audienceType, source: lead.source, unsubscribeUrl,
    });
  } else {
    html = buildStep4Html({
      firstName, recommendedPlan: lead.recommendedPlan, source: lead.source, unsubscribeUrl,
    });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from:    FROM,
    to:      lead.email,
    subject: subjects[step],
    html,
  });

  if (error) throw new Error(error.message ?? "Resend error");
}
