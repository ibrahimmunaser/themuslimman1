import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import { customAlphabet } from "nanoid";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashToken } from "@/lib/hash-token";

const generateToken = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 32);


function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { parentEmail } = await request.json();

    // Rate-limit to prevent spamming arbitrary parent addresses
    const limit = checkRateLimit(`parent-email:${user.id}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    if (!parentEmail || !parentEmail.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Generate verification token — store only the hash in DB, send raw token in email.
    const rawToken = generateToken();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";
    const verificationUrl = `${appUrl}/api/student/parent-email/verify?token=${rawToken}`;

    // Update user with parent email and hashed verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        parentEmail: parentEmail.trim().toLowerCase(),
        parentEmailVerified: false,
        parentVerificationToken: hashToken(rawToken),
      },
    });

    // Send verification email to parent — escape all user-supplied values in HTML.
    const resend = new Resend(process.env.RESEND_API_KEY);
    const safeStudentName = escapeHtml(user.studentName || user.fullName);
    const safeParentEmail = escapeHtml(parentEmail.trim());

    const { error: emailError } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Complete Seerah <noreply@themuslimman.com>",
      to: parentEmail.trim(),
      subject: `Verify Your Email for ${safeStudentName}'s Progress Reports`,
      html: generateVerificationEmail({
        studentName: safeStudentName,
        parentEmail: safeParentEmail,
        verificationUrl,
      }),
    });

    if (emailError) {
      console.error("Failed to send verification email:", emailError);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    console.log(`[EMAIL] Parent verification email sent for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: "Verification email sent to parent",
    });
  } catch (error) {
    console.error("Add parent email error:", error);
    return NextResponse.json(
      { error: "Failed to add parent email" },
      { status: 500 }
    );
  }
}

function generateVerificationEmail(data: {
  studentName: string;
  parentEmail: string;
  verificationUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
    
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="color: #f4c542; margin: 0; font-size: 28px;">Verify Your Email</h1>
      <p style="color: #e5e5e5; margin: 10px 0 0 0; font-size: 16px;">Parent Progress Reports Setup</p>
    </div>

    <div style="background: #ffffff; padding: 40px 30px; border-left: 1px solid #e5e5e5; border-right: 1px solid #e5e5e5;">
      <p style="font-size: 16px; margin: 0 0 20px 0;">As-salamu alaykum,</p>
      
      <p style="font-size: 15px; margin: 0 0 20px 0; color: #555;">
        ${data.studentName} has added your email (${data.parentEmail}) to receive progress reports about their Seerah learning journey.
      </p>

      <p style="font-size: 15px; margin: 0 0 30px 0; color: #555;">
        Please click the button below to verify your email and start receiving progress reports:
      </p>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${data.verificationUrl}" style="display: inline-block; background: #f4c542; color: #1a1a1a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Verify Email Address
        </a>
      </div>

      <p style="font-size: 14px; color: #666; margin: 30px 0 0 0;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="font-size: 12px; color: #999; word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: 'Courier New', monospace;">
        ${data.verificationUrl}
      </p>

      <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e5e5;">
        <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">
          <strong>What happens after verification?</strong>
        </p>
        <ul style="font-size: 14px; color: #666; padding-left: 20px;">
          <li>Your email will be locked and cannot be removed without your approval</li>
          <li>You can receive weekly progress reports about ${data.studentName}'s learning</li>
          <li>${data.studentName} can send you progress reports anytime from their dashboard</li>
        </ul>
      </div>
    </div>

    <div style="background: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e5; border-top: none;">
      <p style="font-size: 13px; color: #999; margin: 0;">
        © ${new Date().getFullYear()} Complete Seerah · TheMuslimMan
      </p>
      <p style="font-size: 12px; color: #999; margin: 10px 0 0 0;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>

  </body>
</html>
  `;
}
