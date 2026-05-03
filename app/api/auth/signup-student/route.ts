import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { customAlphabet, nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import { cookies } from "next/headers";

const generateToken = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 32);
const COOKIE_NAME = "seerah_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const SignupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  courseFor: z.enum(["myself", "my_child", "my_family"]).default("myself"),
  studentName: z.string().nullable().optional(),
  parentEmail: z.string().email().nullable().optional().or(z.literal("")),
  sendWeeklyReports: z.boolean().default(false),
});

/**
 * POST /api/auth/signup-student
 * 
 * Creates a new student account with auto-generated username
 * Sends verification email with welcome message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { fullName, email, password, courseFor, studentName, parentEmail, sendWeeklyReports } = parsed.data;

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // In development, auto-verify emails. In production, require verification.
    const isDevelopment = process.env.NODE_ENV !== "production";
    const verificationToken = isDevelopment ? null : generateToken();
    const verificationExpires = isDevelopment ? null : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user and student profile in transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: email.toLowerCase(),
          passwordHash,
          role: "student",
          emailVerified: isDevelopment,
          verificationToken,
          verificationExpires,
          courseFor: courseFor || "myself",
          studentName: studentName?.trim() || null,
          parentEmail: parentEmail?.trim() || null,
          sendWeeklyReports: sendWeeklyReports || false,
          student: {
            create: {
              isActive: true,
            },
          },
        },
        include: {
          student: true,
        },
      });

      return newUser;
    });

    // Create session and set cookie (auto-login after signup)
    const sessionToken = nanoid(48);
    const sessionExpiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);
    
    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: sessionExpiresAt,
      },
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: sessionExpiresAt,
      path: "/",
    });

    // Send verification email (only in production)
    if (!isDevelopment && verificationToken) {
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;

      try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { error: emailError } = await resend.emails.send({
          from: process.env.EMAIL_FROM || "TheMuslimMan <noreply@themuslimman.com>",
          to: email,
          subject: "Welcome to Seerah LMS - Verify your email",
          html: generateWelcomeEmail({
            fullName: fullName.trim(),
            verificationUrl,
          }),
        });

        if (emailError) {
          console.error("Failed to send verification email:", emailError);
        } else {
          console.log(`[EMAIL] Verification email sent to ${email}`);
        }
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }
    } else {
      console.log(`[DEV] Auto-verified user: ${email}`);
    }

    return NextResponse.json({
      success: true,
      message: isDevelopment 
        ? "Account created and auto-verified! You can sign in now."
        : "Account created successfully. Please check your email to verify.",
      emailVerified: isDevelopment,
      requiresVerification: !isDevelopment,
    });

  } catch (error) {
    console.error("Signup error:", error);
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      // Database connection errors
      if (error.message.includes("EMAXCONNSESSION") || error.message.includes("max clients")) {
        return NextResponse.json(
          { error: "Server is experiencing high traffic. Please try again in a moment." },
          { status: 503 }
        );
      }
      
      // Unique constraint violations (duplicate email)
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Unable to create account. Please try again or contact support if the issue persists." },
      { status: 500 }
    );
  }
}

/**
 * Generate welcome email HTML
 */
function generateWelcomeEmail(data: {
  fullName: string;
  verificationUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Seerah LMS</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #f4c542; margin: 0; font-size: 28px;">Welcome to Seerah LMS</h1>
          <p style="color: #e5e5e5; margin: 10px 0 0 0; font-size: 16px;">Start your journey through the life of the Prophet ﷺ</p>
        </div>

        <div style="background: #ffffff; padding: 40px 30px; border-left: 1px solid #e5e5e5; border-right: 1px solid #e5e5e5;">
          <p style="font-size: 16px; margin: 0 0 20px 0;">As-salamu alaykum ${data.fullName},</p>
          
          <p style="font-size: 16px; margin: 0 0 20px 0;">
            Your account has been created successfully! Before you can start learning, please verify your email address.
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
        </div>

        <div style="background: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e5; border-top: none;">
          <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">
            Ready to start learning? Complete the full Seerah from beginning to end.
          </p>
          <p style="font-size: 13px; color: #999; margin: 0;">
            © ${new Date().getFullYear()} Seerah LMS · TheMuslimMan
          </p>
        </div>

        <p style="font-size: 12px; color: #999; text-align: center; margin: 20px 0 0 0;">
          Didn't create an account? You can safely ignore this email.
        </p>

      </body>
    </html>
  `;
}
