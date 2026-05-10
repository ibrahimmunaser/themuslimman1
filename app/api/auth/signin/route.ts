import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[API] POST /api/auth/signin: Request received`);
  
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
    console.log(`[API] POST /api/auth/signin: SUCCESS for ${email}, role: ${result.role} [${elapsed}ms]`);

    return NextResponse.json({
      success: true,
      role: result.role,
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
