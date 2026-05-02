import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * Test endpoint to verify Resend email configuration
 * DELETE THIS FILE AFTER TESTING
 */
export async function GET(request: NextRequest) {
  try {
    // Check if API key exists
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: "RESEND_API_KEY not found in environment variables",
        env: process.env.NODE_ENV,
      }, { status: 500 });
    }

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Try to send a test email
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "TheMuslimMan <noreply@themuslimman.com>",
      to: "ibrahimmunaser3@gmail.com", // Your test email
      subject: "Test Email - Resend Configuration",
      html: `
        <h1>Test Email</h1>
        <p>If you're reading this, Resend is configured correctly!</p>
        <p>Environment: ${process.env.NODE_ENV}</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      result,
      config: {
        hasApiKey: !!process.env.RESEND_API_KEY,
        emailFrom: process.env.EMAIL_FROM,
        env: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      config: {
        hasApiKey: !!process.env.RESEND_API_KEY,
        emailFrom: process.env.EMAIL_FROM,
        env: process.env.NODE_ENV,
      }
    }, { status: 500 });
  }
}
