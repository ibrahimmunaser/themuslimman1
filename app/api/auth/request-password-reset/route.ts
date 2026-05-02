import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Call the password reset function
    const result = await requestPasswordReset(email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send reset email" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a reset link has been sent",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
