import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";
import { checkRateLimit, getIP } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

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

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await login(email, password);

    if (!result.success) {
      const elapsed = Date.now() - startTime;
      console.log(`[API] POST /api/auth/signin: Login failed [${elapsed}ms]: ${result.error}`);
      return NextResponse.json(
        { error: result.error || "Login failed" },
        { status: 401 }
      );
    }

    const elapsed = Date.now() - startTime;
    console.log(`[API] POST /api/auth/signin: SUCCESS role=${result.role} hasPurchase=${result.hasPurchase} [${elapsed}ms]`);

    // For family plan users, we need to know profile count to route correctly.
    let isFamily = false;
    let profileCount = 0;
    if (result.userId && result.role === "student") {
      const userData = await prisma.user.findUnique({
        where: { id: result.userId },
        select: {
          planType: true,
          _count: { select: { learnerProfiles: true } },
        },
      });
      isFamily = userData?.planType === "family";
      profileCount = userData?._count?.learnerProfiles ?? 0;
    }

    return NextResponse.json({
      success: true,
      role: result.role,
      hasPurchase: result.hasPurchase,
      isFamily,
      profileCount,
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
