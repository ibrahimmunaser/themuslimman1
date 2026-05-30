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

    // Attempt login — retry once on transient DB connection errors (Vercel cold start).
    let result = await login(email, password).catch(async (firstErr: unknown) => {
      const msg = firstErr instanceof Error ? firstErr.message : String(firstErr);
      const isTransient =
        msg.includes("Can't reach database") ||
        msg.includes("Connection refused") ||
        msg.includes("pool timeout") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("P1001") ||
        msg.includes("P1008") ||
        msg.includes("P2024");
      console.error(`[API] signin: first attempt failed${isTransient ? " (transient, retrying)" : ""}:`, msg);
      if (isTransient) {
        await new Promise((r) => setTimeout(r, 600));
        return login(email, password);
      }
      throw firstErr;
    });

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
      try {
        const userData = await prisma.user.findUnique({
          where: { id: result.userId },
          select: {
            planType: true,
            _count: { select: { LearnerProfile: true } },
          },
        });
        isFamily = userData?.planType === "family";
        profileCount = userData?._count?.LearnerProfile ?? 0;
      } catch (err) {
        // Non-fatal: can't determine family status, default to individual routing.
        console.error(`[API] POST /api/auth/signin: family-check DB query failed:`, err);
      }
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
    const msg   = error instanceof Error ? error.message : String(error);
    const code  = (error as { code?: string }).code ?? "unknown";
    const meta  = (error as { meta?: unknown }).meta;
    console.error(`[API] POST /api/auth/signin: UNHANDLED ERROR [${elapsed}ms] code=${code}:`, msg, meta ?? "");
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
