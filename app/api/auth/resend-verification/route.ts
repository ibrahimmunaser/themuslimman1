import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hashToken } from "@/lib/hash-token";
import { Resend } from "resend";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

const generateToken = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 32);


export async function POST(request: NextRequest) {
  // Rate limit: 3 attempts per 15 minutes per IP
  const ip = getIP(request);
  const rl = checkRateLimit(`resend-verify:${ip}`, 3, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Your email is already verified" },
        { status: 400 }
      );
    }

    // Generate new verification token — send raw token in email, store only hash in DB.
    const rawToken = generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: hashToken(rawToken),
        verificationExpires,
      },
    });

    // Email link contains the raw token; the verify route will hash it on receipt.
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${rawToken}`;

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);

      const { error: emailError } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "TheMuslimMan <noreply@themuslimman.com>",
        to: user.email,
        subject: "Verify your email - TheMuslimMan",
        html: generateVerificationEmail({
          fullName: user.fullName,
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

      return NextResponse.json({
        success: true,
        message: "Verification email sent successfully",
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

function generateVerificationEmail(data: {
  fullName: string;
  verificationUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your email</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #f4c542; margin: 0; font-size: 28px;">Verify Your Email</h1>
          <p style="color: #e5e5e5; margin: 10px 0 0 0; font-size: 16px;">One more step to unlock your account</p>
        </div>

        <div style="background: #ffffff; padding: 40px 30px; border-left: 1px solid #e5e5e5; border-right: 1px solid #e5e5e5;">
          <p style="font-size: 16px; margin: 0 0 20px 0;">As-salamu alaykum ${data.fullName || "there"},</p>
          
          <p style="font-size: 16px; margin: 0 0 20px 0;">
            You're almost ready to start learning! Click the button below to verify your email address and unlock full access to your account.
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

          <p style="font-size: 14px; color: #666; margin: 30px 0 0 0;">
            This link will expire in 24 hours.
          </p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e5; border-top: none;">
          <p style="font-size: 13px; color: #999; margin: 0;">
            © ${new Date().getFullYear()} TheMuslimMan · Complete Seerah
          </p>
        </div>

        <p style="font-size: 12px; color: #999; text-align: center; margin: 20px 0 0 0;">
          Didn't request this email? You can safely ignore it.
        </p>

      </body>
    </html>
  `;
}
