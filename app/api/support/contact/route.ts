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

    // Try to send emails, but don't fail if email service is not configured
    if (process.env.RESEND_API_KEY) {
      try {
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

        // Log email results
        emailResults.forEach((result, index) => {
          if (result.status === "rejected") {
            console.error(`Email ${index + 1} failed:`, result.reason);
          }
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Continue anyway - ticket is saved
      }
    } else {
      console.warn("RESEND_API_KEY not configured - emails will not be sent");
    }

    return NextResponse.json({ 
      success: true,
      message: "Support request received" 
    });
  } catch (error) {
    console.error("Support contact error:", error);
    
    // Provide more specific error message
    const errorMessage = error instanceof Error ? error.message : "Failed to submit support request";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
