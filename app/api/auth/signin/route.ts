import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[API] POST /api/auth/signin: Request received`);

  // Rate limit: 5 attempts per 10 minutes per IP
  const ip = getIP(request);
  const rl = checkRateLimit(`signin:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }
  
  try {
    const { email, password } = await request.json();
    console.log(`[API] POST /api/auth/signin: Email: ${email}`);

    if (!email || !password) {
      console.log(`[API] POST /api/auth/signin: Missing email or password`);
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await login(email, password);

    if (!result.success) {
      const elapsed = Date.now() - startTime;
      console.log(`[API] POST /api/auth/signin: Login failed for ${email}: ${result.error} [${elapsed}ms]`);
      return NextResponse.json(
        { error: result.error || "Login failed" },
        { status: 401 }
      );
    }

    const elapsed = Date.now() - startTime;
    console.log(`[API] POST /api/auth/signin: SUCCESS for ${email}, role: ${result.role}, hasPurchase: ${result.hasPurchase} [${elapsed}ms]`);

    return NextResponse.json({
      success: true,
      role: result.role,
      hasPurchase: result.hasPurchase,
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[API] POST /api/auth/signin: ERROR [${elapsed}ms]:`, error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
