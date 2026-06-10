import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, changePassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Per-user rate limit: 5 attempts per 15 minutes to prevent brute-force of current password.
    const rl = checkRateLimit(`change-password:${user.id}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: "New password must be different from your current password" }, { status: 400 });
    }

    const result = await changePassword(currentPassword, newPassword);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to change password" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
