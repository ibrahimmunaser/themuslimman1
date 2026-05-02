// Email templates for support system

export function getStudentConfirmationEmail(data: {
  name: string;
  subject: string;
  message: string;
}) {
  return {
    subject: "We received your message — TheMuslimMan",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { background: linear-gradient(135deg, #D4A574 0%, #C89B5F 100%); padding: 32px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: #0a0a0a; margin: 0; font-size: 24px; font-weight: 700; }
    .content { background: #ffffff; padding: 32px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px; }
    .content p { color: #3f3f46; line-height: 1.6; margin: 0 0 16px; }
    .ticket-box { background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .ticket-box h3 { margin: 0 0 8px; color: #18181b; font-size: 16px; }
    .ticket-box p { margin: 0; color: #52525b; }
    .footer { text-align: center; padding: 24px; color: #71717a; font-size: 14px; }
    .button { display: inline-block; background: linear-gradient(135deg, #D4A574 0%, #C89B5F 100%); color: #0a0a0a; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Message Received ✓</h1>
    </div>
    <div class="content">
      <p>As-salamu alaykum ${data.name},</p>
      
      <p>Thank you for reaching out to TheMuslimMan. We've received your message and will respond within 24-48 hours on business days.</p>
      
      <div class="ticket-box">
        <h3>Your Message:</h3>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p style="margin-top: 12px;"><strong>Message:</strong></p>
        <p style="margin-top: 8px; white-space: pre-wrap;">${data.message}</p>
      </div>
      
      <p>In the meantime, you might find answers in our <a href="https://themuslimman.com/help" style="color: #D4A574; text-decoration: none;">Help Center</a>.</p>
      
      <p style="margin-top: 24px;">If you have any urgent issues, please reply to this email directly.</p>
      
      <p style="margin-top: 24px; margin-bottom: 0;">Barakallahu feek,<br><strong>TheMuslimMan Team</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TheMuslimMan. All rights reserved.</p>
      <p style="margin-top: 8px;"><a href="https://themuslimman.com" style="color: #D4A574; text-decoration: none;">themuslimman.com</a></p>
    </div>
  </div>
</body>
</html>
    `,
    text: `As-salamu alaykum ${data.name},

Thank you for reaching out to TheMuslimMan. We've received your message and will respond within 24-48 hours on business days.

Your Message:
Subject: ${data.subject}
Message: ${data.message}

In the meantime, you might find answers in our Help Center at https://themuslimman.com/help

If you have any urgent issues, please reply to this email directly.

Barakallahu feek,
TheMuslimMan Team

© ${new Date().getFullYear()} TheMuslimMan. All rights reserved.
themuslimman.com`,
  };
}

export function getAdminNotificationEmail(data: {
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return {
    subject: `New Support Ticket: ${data.subject}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { background: #ef4444; padding: 32px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
    .content { background: #ffffff; padding: 32px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px; }
    .content p { color: #3f3f46; line-height: 1.6; margin: 0 0 16px; }
    .info-box { background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .info-box .row { margin-bottom: 12px; }
    .info-box .row:last-child { margin-bottom: 0; }
    .info-box .label { color: #71717a; font-size: 14px; font-weight: 600; }
    .info-box .value { color: #18181b; margin-top: 4px; }
    .message-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; }
    .message-box p { margin: 0; color: #3f3f46; white-space: pre-wrap; }
    .button { display: inline-block; background: #ef4444; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎫 New Support Ticket</h1>
    </div>
    <div class="content">
      <p><strong>A new support ticket has been submitted.</strong></p>
      
      <div class="info-box">
        <div class="row">
          <div class="label">Ticket ID</div>
          <div class="value"><code>${data.ticketId}</code></div>
        </div>
        <div class="row">
          <div class="label">From</div>
          <div class="value">${data.name}</div>
        </div>
        <div class="row">
          <div class="label">Email</div>
          <div class="value"><a href="mailto:${data.email}" style="color: #D4A574; text-decoration: none;">${data.email}</a></div>
        </div>
        <div class="row">
          <div class="label">Subject</div>
          <div class="value">${data.subject}</div>
        </div>
      </div>
      
      <div class="message-box">
        <p><strong>Message:</strong></p>
        <p style="margin-top: 12px;">${data.message}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/support" class="button">
          View in Admin Dashboard
        </a>
      </div>
      
      <p style="margin-top: 24px; font-size: 14px; color: #71717a;">
        Reply to this email to respond directly to the student.
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `🎫 New Support Ticket

Ticket ID: ${data.ticketId}
From: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}

View in Admin Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/support

Reply to this email to respond directly to the student.`,
  };
}
