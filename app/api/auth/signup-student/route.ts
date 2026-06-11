import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { customAlphabet, nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/hash-token";
import { Resend } from "resend";
import { cookies } from "next/headers";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

const generateToken = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 32);
const COOKIE_NAME = "seerah_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const SignupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(1000, "Password is too long"),
  // Optional: safe internal redirect path to include in the verification link
  // so the user returns to their destination (e.g. gift claim) after verifying.
  redirectAfterVerify: z.string().max(500).optional(),
});

/**
 * POST /api/auth/signup-student
 * 
 * Creates a new student account with auto-generated username
 * Sends verification email with welcome message
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[API] /api/auth/signup-student: POST request received`);

  // Rate limit: 5 signups per 10 minutes per IP
  const ip = getIP(request);
  const rl = checkRateLimit(`signup:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const body = await request.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Invalid input";
      console.log(`[API] /api/auth/signup-student: Validation failed: ${errorMsg}`);
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      );
    }

    const { fullName, email, password, redirectAfterVerify } = parsed.data;

    // Validate the optional redirect: must be a safe internal relative path.
    const safeRedirect =
      redirectAfterVerify &&
      redirectAfterVerify.startsWith("/") &&
      !redirectAfterVerify.startsWith("//")
        ? redirectAfterVerify
        : null;

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      console.log(`[API] /api/auth/signup-student: Email already registered`);
      return NextResponse.json(
        { error: "Unable to create an account with this email. If you already have an account, please sign in." },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // In development, auto-verify emails. In production, require verification.
    const isDevelopment = process.env.NODE_ENV !== "production";
    const rawVerificationToken = isDevelopment ? null : generateToken();
    // Store only the hash in the DB; the raw token travels to the user via email.
    const verificationToken = rawVerificationToken ? hashToken(rawVerificationToken) : null;
    const verificationExpires = isDevelopment ? null : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    console.log(`[API] /api/auth/signup-student: Mode: ${isDevelopment ? "development" : "production"}, auto-verify: ${isDevelopment}`);

    // Create user and student profile in transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          fullName: fullName.trim(),
          email: email.toLowerCase(),
          passwordHash,
          role: "student",
          emailVerified: isDevelopment,
          verificationToken,
          verificationExpires,
          studentProfile: {
            create: {
              id: crypto.randomUUID(),
              isActive: true,
              updatedAt: new Date(),
            },
          },
        },
        include: {
          studentProfile: true,
        },
      });

      console.log(`[API] /api/auth/signup-student: User created (id: ${newUser.id}, studentProfileId: ${newUser.studentProfile?.id})`);
      return newUser;
    });

    // Create session and set cookie (auto-login after signup)
    console.log(`[API] /api/auth/signup-student: Creating session for user ${user.id}...`);
    const sessionToken = nanoid(48);
    const sessionExpiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);
    
    // Store only the SHA-256 hash so a DB leak cannot be used to hijack sessions.
    await prisma.session.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        token: hashToken(sessionToken),
        expiresAt: sessionExpiresAt,
      },
    });
    console.log(`[API] /api/auth/signup-student: Session created, expires ${sessionExpiresAt.toISOString()}`);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: sessionExpiresAt,
      path: "/",
    });
    cookieStore.set("seerah_role", "student", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: sessionExpiresAt,
      path: "/",
    });
    // Send verification email (only in production)
    // Use the raw (un-hashed) token in the URL — the DB stores the hash.
    if (!isDevelopment && rawVerificationToken) {
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${rawVerificationToken}${safeRedirect ? `&redirect=${encodeURIComponent(safeRedirect)}` : ""}`;

      try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { error: emailError } = await resend.emails.send({
          from: process.env.EMAIL_FROM || "TheMuslimMan <noreply@themuslimman.com>",
          to: email,
          subject: "Welcome to Complete Seerah - Verify your email",
          html: generateWelcomeEmail({
            fullName: fullName.trim(),
            verificationUrl,
          }),
        });

        if (emailError) {
          console.error(`[API] /api/auth/signup-student: Failed to send verification email:`, emailError);
        } else {
          console.log(`[API] /api/auth/signup-student: Verification email sent`);
        }
      } catch (emailError) {
        console.error(`[API] /api/auth/signup-student: Exception sending verification email:`, emailError);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[API] /api/auth/signup-student: SUCCESS - User created and logged in [${elapsed}ms]`);

    return NextResponse.json({
      success: true,
      message: isDevelopment 
        ? "Account created and auto-verified! You can sign in now."
        : "Account created successfully. Please check your email to verify.",
      emailVerified: isDevelopment,
      requiresVerification: !isDevelopment,
    });

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[API] /api/auth/signup-student: ERROR [${elapsed}ms]:`, error);
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      // Database connection errors
      if (error.message.includes("EMAXCONNSESSION") || error.message.includes("max clients")) {
        console.error(`[API] /api/auth/signup-student: Database connection error`);
        return NextResponse.json(
          { error: "Server is experiencing high traffic. Please try again in a moment." },
          { status: 503 }
        );
      }
      
      // Unique constraint violations (duplicate email — race condition)
      if (error.message.includes("Unique constraint")) {
        console.error(`[API] /api/auth/signup-student: Unique constraint violation`);
        return NextResponse.json(
          { error: "Unable to create an account with this email. If you already have an account, please sign in." },
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
        <title>Welcome to Complete Seerah</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #f4c542; margin: 0; font-size: 28px;">Welcome to Complete Seerah</h1>
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
            © ${new Date().getFullYear()} Complete Seerah · TheMuslimMan
          </p>
        </div>

        <p style="font-size: 12px; color: #999; text-align: center; margin: 20px 0 0 0;">
          Didn't create an account? You can safely ignore this email.
        </p>

      </body>
    </html>
  `;
}
