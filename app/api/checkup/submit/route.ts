import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const AUDIENCE_MAP: Record<number, string> = {
  0: "self",
  1: "family",
  2: "self_and_family",
  3: "group",
};

const OBJECTION_OPTIONS = [
  "I don't know where to start",
  "Books and lectures feel too long",
  "I forget what I learn",
  "I get busy and stop",
  "I want to see the quality first",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, email, phone,
      answers, score, resultType, recommendedPlan, openText,
      source, utmSource, utmMedium, utmCampaign, utmContent,
      sessionId, quizVersion,
    } = body;

    if (!email || typeof score !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedAnswers = answers ?? {};
    const q9idx = typeof parsedAnswers[9] === "number" ? parsedAnswers[9] : -1;
    const q10idx = typeof parsedAnswers[10] === "number" ? parsedAnswers[10] : -1;
    const mainObjection = q9idx >= 0 ? (OBJECTION_OPTIONS[q9idx] ?? null) : null;
    const audienceType  = q10idx >= 0 ? (AUDIENCE_MAP[q10idx] ?? null) : null;

    const lead = await prisma.seerahCheckupLead.create({
      data: {
        name:           name ? String(name).trim() : null,
        email:          String(email).toLowerCase().trim(),
        phone:          phone ? String(phone).trim() : null,
        answers:        parsedAnswers,
        score:          Math.round(score),
        resultType:     String(resultType),
        recommendedPlan: String(recommendedPlan),
        openText:       openText ? String(openText).trim() : null,
        sessionId:      sessionId ? String(sessionId) : null,
        mainObjection,
        audienceType,
        influencer:     source ? String(source) : null,
        quizVersion:    quizVersion ? String(quizVersion) : "1.0",
        source:         source ? String(source) : null,
        utmSource:      utmSource ? String(utmSource) : null,
        utmMedium:      utmMedium ? String(utmMedium) : null,
        utmCampaign:    utmCampaign ? String(utmCampaign) : null,
        utmContent:     utmContent ? String(utmContent) : null,
      },
    });

    return NextResponse.json({ success: true, id: lead.id });
  } catch (err) {
    console.error("[checkup/submit]", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
