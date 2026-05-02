import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { getStudentConfirmationEmail, getAdminNotificationEmail } from "@/lib/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Store the support request in the database
    const ticket = await prisma.supportTicket.create({
      data: {
        name,
        email,
        subject,
        message,
        status: "open",
      },
    });

    // Send emails (both confirmation and admin notification)
    const emailResults = await Promise.allSettled([
      // 1. Send confirmation email to student
      resend.emails.send({
        from: process.env.EMAIL_FROM || "TheMuslimMan <admin@themuslimman.com>",
        to: email,
        replyTo: process.env.ADMIN_EMAIL || "admin@themuslimman.com",
        ...getStudentConfirmationEmail({ name, subject, message }),
      }),
      
      // 2. Send notification email to admin
      resend.emails.send({
        from: process.env.EMAIL_FROM || "TheMuslimMan <admin@themuslimman.com>",
        to: process.env.ADMIN_EMAIL || "admin@themuslimman.com",
        replyTo: email,
        ...getAdminNotificationEmail({
          ticketId: ticket.id,
          name,
          email,
          subject,
          message,
        }),
      }),
    ]);

    // Log email results but don't fail the request if emails fail
    emailResults.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Email ${index + 1} failed:`, result.reason);
      }
    });

    return NextResponse.json({ 
      success: true,
      message: "Support request received" 
    });
  } catch (error) {
    console.error("Support contact error:", error);
    return NextResponse.json(
      { error: "Failed to submit support request" },
      { status: 500 }
    );
  }
}
