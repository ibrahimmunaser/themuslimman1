import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { subject, message } = await req.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Send email to admin
    await resend.emails.send({
      from: "Seerah Support <noreply@themuslimman.com>",
      to: "themuslimman77@gmail.com", // Admin email
      replyTo: user.email,
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
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 32px 32px 24px; border-bottom: 1px solid #2a2a2a;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #d4af37;">
                          Support Request
                        </h1>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 24px 32px;">
                        <!-- User Info -->
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                          <tr>
                            <td style="padding: 16px; background-color: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 8px;">
                              <p style="margin: 0 0 8px; font-size: 14px; color: #a3a3a3;">
                                <strong style="color: #e5e5e5;">From:</strong> ${user.fullName}
                              </p>
                              <p style="margin: 0 0 8px; font-size: 14px; color: #a3a3a3;">
                                <strong style="color: #e5e5e5;">Email:</strong> ${user.email}
                              </p>
                              <p style="margin: 0; font-size: 14px; color: #a3a3a3;">
                                <strong style="color: #e5e5e5;">User ID:</strong> ${user.id}
                              </p>
                            </td>
                          </tr>
                        </table>

                        <!-- Subject -->
                        <div style="margin-bottom: 16px;">
                          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #d4af37; text-transform: uppercase; letter-spacing: 0.5px;">
                            Subject
                          </p>
                          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #e5e5e5;">
                            ${subject}
                          </p>
                        </div>

                        <!-- Message -->
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

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 32px; border-top: 1px solid #2a2a2a; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #737373;">
                          Reply directly to this email to respond to the user
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
