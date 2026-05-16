import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const body = await req.json();
    const { name: bodyName, email: bodyEmail, subject, message } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    if (subject.length > 200 || message.length > 5000) {
      return NextResponse.json(
        { error: "Subject or message is too long" },
        { status: 400 }
      );
    }

    // Use session user if logged in; otherwise fall back to body-supplied identity
    const sessionUser = await getCurrentUser();

    const senderName: string = sessionUser?.fullName ?? bodyName ?? "Anonymous";
    const senderEmail: string = sessionUser?.email ?? bodyEmail ?? "no-email-provided";
    const userId: string | null = sessionUser?.id ?? null;

    if (!sessionUser && (!bodyEmail || !bodyEmail.includes("@"))) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "Seerah Support <noreply@themuslimman.com>",
      to: process.env.SUPPORT_EMAIL ?? "themuslimman77@gmail.com",
      replyTo: senderEmail,
      subject: `Support Request: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #e5e5e5;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0a0a0a;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px;">
                    <tr>
                      <td style="padding: 32px 32px 24px; border-bottom: 1px solid #2a2a2a;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #d4af37;">
                          Support Request
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 24px 32px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                          <tr>
                            <td style="padding: 16px; background-color: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 8px;">
                              <p style="margin: 0 0 8px; font-size: 14px; color: #a3a3a3;">
                                <strong style="color: #e5e5e5;">From:</strong> ${senderName}
                              </p>
                              <p style="margin: 0 0 8px; font-size: 14px; color: #a3a3a3;">
                                <strong style="color: #e5e5e5;">Email:</strong> ${senderEmail}
                              </p>
                              ${userId ? `<p style="margin: 0; font-size: 14px; color: #a3a3a3;"><strong style="color: #e5e5e5;">User ID:</strong> ${userId}</p>` : '<p style="margin: 0; font-size: 14px; color: #a3a3a3;"><em>Pre-purchase visitor</em></p>'}
                            </td>
                          </tr>
                        </table>
                        <div style="margin-bottom: 16px;">
                          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #d4af37; text-transform: uppercase; letter-spacing: 0.5px;">
                            Subject
                          </p>
                          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #e5e5e5;">
                            ${subject}
                          </p>
                        </div>
                        <div>
                          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #d4af37; text-transform: uppercase; letter-spacing: 0.5px;">
                            Message
                          </p>
                          <div style="padding: 16px; background-color: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 8px;">
                            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #e5e5e5; white-space: pre-wrap;">${message}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 24px 32px; border-top: 1px solid #2a2a2a; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #737373;">
                          Reply directly to this email to respond to the sender
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Support contact error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
