import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, email, phone,
      answers, score, resultType, recommendedPlan, openText,
      source, utmSource, utmMedium, utmCampaign, utmContent,
    } = body;

    if (!name || !email || typeof score !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const lead = await prisma.seerahCheckupLead.create({
      data: {
        name: String(name).trim(),
        email: String(email).toLowerCase().trim(),
        phone: phone ? String(phone).trim() : null,
        answers: answers ?? {},
        score: Math.round(score),
        resultType: String(resultType),
        recommendedPlan: String(recommendedPlan),
        openText: openText ? String(openText).trim() : null,
        source: source ? String(source) : null,
        utmSource: utmSource ? String(utmSource) : null,
        utmMedium: utmMedium ? String(utmMedium) : null,
        utmCampaign: utmCampaign ? String(utmCampaign) : null,
        utmContent: utmContent ? String(utmContent) : null,
      },
    });

    return NextResponse.json({ success: true, id: lead.id });
  } catch (err) {
    console.error("[checkup/submit]", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
