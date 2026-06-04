import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { checkRateLimit, getIP } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Require authentication — testimonials should only come from real students.
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to submit a testimonial." }, { status: 401 });
  }

  // Rate limit: 3 submissions per 15 minutes per IP to prevent email flooding.
  const ip = getIP(req);
  const rl = checkRateLimit(`testimonial:${ip}`, 3, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before submitting again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  function escapeHtml(str: string): string {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }

  try {
    const body = await req.json();
    const { name, email, whatMadeYouTry, mostHelpful, whoWouldRecommend, canUseWords, displayPref } = body;

    if (!name || !email || !whatMadeYouTry || !mostHelpful || !canUseWords || !displayPref) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const safeName            = escapeHtml(name);
    const safeEmail           = escapeHtml(email);
    const safeWhatMadeYouTry  = escapeHtml(whatMadeYouTry);
    const safeMostHelpful     = escapeHtml(mostHelpful);
    const safeWhoWouldRecommend = whoWouldRecommend ? escapeHtml(whoWouldRecommend) : null;
    const safeDisplayPref     = escapeHtml(displayPref);
    const safeCanUseWords     = escapeHtml(canUseWords);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const to = process.env.SUPPORT_EMAIL ?? "themuslimman77@gmail.com";
    const from = process.env.EMAIL_FROM ?? "TheMuslimMan <noreply@themuslimman.com>";
    const submittedAt = new Date().toUTCString();

    await resend.emails.send({
      from,
      to,
      subject: `[Testimonial] New submission from ${safeName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
            <h2 style="color: #b8960c; border-bottom: 2px solid #e8d88a; padding-bottom: 8px;">New Testimonial Submission</h2>
            <p style="font-size: 13px; color: #999;">Submitted: ${submittedAt}</p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; width: 35%; vertical-align: top;">Name</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; vertical-align: top;">Email</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${safeEmail}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; vertical-align: top;">Can use publicly?</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: ${safeCanUseWords === "yes" ? "#16a34a" : "#dc2626"}; font-weight: 600;">
                  ${safeCanUseWords === "yes" ? "YES — approved for public use" : "NO — keep private"}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; vertical-align: top;">Display preference</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${safeDisplayPref}</td>
              </tr>
            </table>

            <h3 style="margin-top: 24px; color: #555;">What made you try the course?</h3>
            <p style="background: #f9f9f9; padding: 12px; border-radius: 6px; border-left: 3px solid #f4c542;">${safeWhatMadeYouTry}</p>

            <h3 style="margin-top: 20px; color: #555;">What was most helpful?</h3>
            <p style="background: #f9f9f9; padding: 12px; border-radius: 6px; border-left: 3px solid #f4c542;">${safeMostHelpful}</p>

            ${safeWhoWouldRecommend ? `
            <h3 style="margin-top: 20px; color: #555;">Who would they recommend it to?</h3>
            <p style="background: #f9f9f9; padding: 12px; border-radius: 6px; border-left: 3px solid #f4c542;">${safeWhoWouldRecommend}</p>
            ` : ""}

            <p style="margin-top: 24px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 12px;">
              This testimonial has NOT been published. Review and approve manually before using publicly.
            </p>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[TESTIMONIAL] Failed to send:", err);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
