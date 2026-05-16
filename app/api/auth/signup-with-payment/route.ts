import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const generateToken = () => nanoid(32);

function generateWelcomeEmail({
  fullName,
  verificationUrl,
}: {
  fullName: string;
  verificationUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h1 style="margin: 0 0 20px; color: #d4af37; font-size: 28px;">Welcome to Complete Seerah!</h1>
              <p style="margin: 0 0 20px; color: #e0e0e0; font-size: 16px; line-height: 1.5;">
                Hi ${fullName},
              </p>
              <p style="margin: 0 0 20px; color: #e0e0e0; font-size: 16px; line-height: 1.5;">
                Thank you for your purchase! Your account has been created and you're ready to start learning the Seerah.
              </p>
              <p style="margin: 0 0 30px; color: #a0a0a0; font-size: 14px; line-height: 1.5;">
                Please verify your email address to complete your account setup:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: #0a0a0a; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Verify Email Address</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 30px 0 0; color: #a0a0a0; font-size: 14px; line-height: 1.5;">
                Or copy and paste this URL into your browser:<br>
                <a href="${verificationUrl}" style="color: #d4af37; word-break: break-all;">${verificationUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #0f0f0f; border-top: 1px solid #2a2a2a;">
              <p style="margin: 0; color: #666; font-size: 12px; line-height: 1.5;">
                If you didn't create this account, please ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password, paymentIntentId } = await req.json();

    // Validate inputs
    if (!fullName || !email || !password || !paymentIntentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Verify payment was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with PAID status
    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        emailVerified: false,
        verificationToken,
        verificationExpires,
        role: "student",
        hasPaid: true, // Mark as paid
        stripePaymentIntentId: paymentIntentId,
      },
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
    
    const mailerSend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY || "",
    });

    const sentFrom = new Sender(
      "admin@themuslimman.com",
      "Complete Seerah"
    );

    const recipients = [new Recipient(email, fullName.trim())];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject("Welcome to Complete Seerah - Verify your email")
      .setHtml(generateWelcomeEmail({
        fullName: fullName.trim(),
        verificationUrl,
      }));

    await mailerSend.email.send(emailParams);

    console.log(`[SIGNUP+PAYMENT] Account created for ${email} with payment ${paymentIntentId}`);

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("[SIGNUP+PAYMENT] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
