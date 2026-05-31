import { createHash, randomBytes } from "crypto";

/** Generate a cryptographically secure 32-byte hex token (64 chars). */
export function generateGiftToken(): string {
  return randomBytes(32).toString("hex");
}

/** SHA-256 hash of a raw token for safe DB storage. */
export function hashGiftToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/** Build the full claim URL from a raw token. */
export function buildClaimUrl(rawToken: string, appUrl?: string): string {
  const base = appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://seerah.themuslimman.com";
  return `${base}/gift/claim/${rawToken}`;
}

/** Send the recipient gift email. Returns true on success. */
export async function sendGiftClaimEmail(opts: {
  recipientEmail: string;
  recipientName: string | null;
  purchaserEmail: string;
  giftMessage: string | null;
  claimUrl: string;
}): Promise<void> {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const _fromName = opts.purchaserEmail.split("@")[0]; // fallback display name
  const toName = opts.recipientName ? opts.recipientName : "there";
  const messageBlock = opts.giftMessage
    ? `<div style="background:#f9f4e8;border:1px solid #e8d88a;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="font-size:14px;color:#555;margin:0 0 6px 0;font-weight:600;">A personal message:</p>
        <p style="font-size:14px;color:#333;margin:0;line-height:1.6;font-style:italic;">"${opts.giftMessage}"</p>
       </div>`
    : "";

  const year = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://seerah.themuslimman.com";

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "TheMuslimMan <noreply@themuslimman.com>",
    to: opts.recipientEmail,
    subject: "You've been gifted Complete Seerah",
    html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:30px 20px;text-align:center;border-radius:12px 12px 0 0;">
      <div style="font-size:36px;margin-bottom:12px;">🎁</div>
      <h1 style="color:#f4c542;margin:0 0 8px 0;font-size:24px;">You've Been Gifted Complete Seerah</h1>
      <p style="color:#ccc;margin:0;font-size:15px;">A gift from ${opts.purchaserEmail}</p>
    </div>

    <div style="background:#ffffff;padding:40px 30px;border:1px solid #e5e5e5;border-top:none;">
      <p style="font-size:16px;margin:0 0 16px 0;">As-salamu alaykum ${toName},</p>

      <p style="font-size:15px;margin:0 0 16px 0;">
        ${opts.purchaserEmail} gifted you lifetime access to <strong>Complete Seerah</strong>,
        a structured course teaching the life of the Prophet ﷺ as one connected story.
      </p>

      ${messageBlock}

      <p style="font-size:15px;margin:0 0 24px 0;">
        Click below to claim your access. You'll need to create an account or sign in
        — then your full lifetime access is activated instantly.
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${opts.claimUrl}" style="display:inline-block;background:#f4c542;color:#1a1a1a;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;">
          Claim Your Gift
        </a>
      </div>

      <p style="font-size:13px;color:#777;margin:0 0 8px 0;">
        This link is for you. It can only be used once.
      </p>

      <div style="background:#f5f5f5;border:1px solid #ddd;border-radius:8px;padding:16px;margin:24px 0;font-size:13px;color:#666;">
        <strong style="color:#333;">What's included:</strong>
        <ul style="margin:8px 0 0 0;padding-left:20px;line-height:1.8;">
          <li>All 100 Seerah parts — videos, briefings, quizzes, flashcards, and more</li>
          <li>Guided progress tracking</li>
          <li>Lifetime access — learn at your own pace, anytime</li>
        </ul>
      </div>

      <p style="font-size:13px;color:#aaa;margin:0;">
        Questions? <a href="${appUrl}/contact" style="color:#b8960c;">Contact support</a>
      </p>
    </div>

    <div style="background:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e5e5e5;border-top:none;">
      <p style="font-size:12px;color:#999;margin:0;">
        © ${year} TheMuslimMan · Complete Seerah
      </p>
    </div>
  </body>
</html>
    `,
  });
}
