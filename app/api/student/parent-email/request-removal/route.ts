import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import { customAlphabet } from "nanoid";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashToken } from "@/lib/hash-token";

const generateToken = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 32);


function escapeHtml(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://seerah.themuslimman.com";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate-limit to prevent spam removal requests
    const limit = checkRateLimit(`parent-removal:${user.id}`, 3, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    if (!user.parentEmail || !user.parentEmailVerified) {
      return NextResponse.json(
        { error: "No verified parent email found" },
        { status: 400 }
      );
    }

    // Generate removal confirmation token — store only the hash in DB.
    const rawToken   = generateToken();
    const confirmUrl = `${APP_URL}/api/student/parent-email/confirm-removal?token=${rawToken}`;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        parentVerificationToken: hashToken(rawToken),
      },
    });

    // Escape all user-supplied strings before HTML interpolation.
    const safeStudentName = escapeHtml(user.studentName || user.fullName);
    const safeParentEmail = escapeHtml(user.parentEmail);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Complete Seerah <noreply@themuslimman.com>",
      to: user.parentEmail,
      subject: `Confirm Removal of Your Email from ${safeStudentName}'s Progress Reports`,
      html: generateRemovalConfirmationEmail({
        studentName: safeStudentName,
        parentEmail: safeParentEmail,
        confirmUrl,
      }),
    });

    if (emailError) {
      console.error("Failed to send removal confirmation email:", emailError);
      return NextResponse.json(
        { error: "Failed to send confirmation email" },
        { status: 500 }
      );
    }

    console.log(`[EMAIL] Parent email removal request sent for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: "Confirmation email sent to parent",
    });
  } catch (error) {
    console.error("Request removal error:", error);
    return NextResponse.json(
      { error: "Failed to request removal" },
      { status: 500 }
    );
  }
}

function generateRemovalConfirmationEmail(data: {
  studentName: string;
  parentEmail: string;
  confirmUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Email Removal</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
    
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="color: #f4c542; margin: 0; font-size: 28px;">Email Removal Request</h1>
      <p style="color: #e5e5e5; margin: 10px 0 0 0; font-size: 16px;">Action Required</p>
    </div>

    <div style="background: #ffffff; padding: 40px 30px; border-left: 1px solid #e5e5e5; border-right: 1px solid #e5e5e5;">
      <p style="font-size: 16px; margin: 0 0 20px 0;">As-salamu alaykum,</p>
      
      <p style="font-size: 15px; margin: 0 0 20px 0; color: #555;">
        ${data.studentName} has requested to remove your email (${data.parentEmail}) from their Seerah progress reports.
      </p>

      <div style="background: #fff3cd; border-left: 4px solid #f4c542; padding: 15px; margin: 30px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #856404;">
          <strong>Important:</strong> If you approve this removal, you will no longer receive progress reports about ${data.studentName}'s learning.
        </p>
      </div>

      <p style="font-size: 15px; margin: 0 0 30px 0; color: #555;">
        If you approve this removal, click the button below:
      </p>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${data.confirmUrl}" style="display: inline-block; background: #dc3545; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Confirm Email Removal
        </a>
      </div>

      <p style="font-size: 14px; color: #666; margin: 30px 0 0 0;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="font-size: 12px; color: #999; word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: 'Courier New', monospace;">
        ${data.confirmUrl}
      </p>

      <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e5e5;">
        <p style="font-size: 14px; color: #666; margin: 0;">
          <strong>Don't want to remove your email?</strong> Simply ignore this email and your email will remain connected to ${data.studentName}'s progress reports.
        </p>
      </div>
    </div>

    <div style="background: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e5; border-top: none;">
      <p style="font-size: 13px; color: #999; margin: 0;">
        &copy; ${new Date().getFullYear()} Complete Seerah &middot; TheMuslimMan
      </p>
      <p style="font-size: 12px; color: #999; margin: 10px 0 0 0;">
        This removal request expires in 24 hours.
      </p>
    </div>

  </body>
</html>
  `;
}
