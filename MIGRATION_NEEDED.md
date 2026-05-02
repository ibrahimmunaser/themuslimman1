# ⚠️ Setup Required: Database Migration + Email Configuration

## What Was Implemented
✅ Complete support system with:
- Student help center at `/help` with FAQs and contact form
- Email notifications (student confirmations + admin alerts)
- Admin dashboard at `/admin/support` for managing tickets
- Auto-response system

## Setup Steps

### 1. Database Migration
Run these commands to create the `SupportTicket` table:

```bash
npx prisma migrate dev --name add_support_tickets
npx prisma generate
```

### 2. Email Configuration (Resend)

#### Get Resend API Key
1. Sign up at [resend.com](https://resend.com) (it's free!)
2. Verify your domain (themuslimman.com)
3. Generate API key from dashboard

#### Add Environment Variables
Add to your `.env` file:

```bash
# Resend API Key
RESEND_API_KEY="re_xxxxxxxxxxxxx"

# Email From Address (must be from verified domain)
EMAIL_FROM="The Muslim Man Academy <support@themuslimman.com>"

# Admin Email (where YOU receive ticket notifications)
ADMIN_EMAIL="your-email@example.com"

# App URL (for links in emails)
NEXT_PUBLIC_APP_URL="https://themuslimman.com"
```

### 3. Restart Dev Server
```bash
npm run dev
```

---

## What Works Now

### For Students
- Visit `/help` to see FAQs
- Submit support questions via contact form
- Receive instant confirmation email
- Professional, branded email template

### For You (Admin)
- Receive email notification for each new ticket
- View all tickets at `/admin/support`
- Filter by status (open, in progress, resolved, closed)
- Reply via email (one click)
- Update ticket status
- Delete spam tickets
- See open ticket count on main dashboard

---

## Testing Checklist

After setup, test:

1. **Submit test ticket**
   - Go to `/help`
   - Fill out contact form
   - Click "Send Message"

2. **Check emails**
   - Student should receive confirmation
   - Admin should receive notification

3. **Check admin dashboard**
   - Go to `/admin/support`
   - See new ticket in "Open" tab
   - Try changing status
   - Test reply via email button

---

## If Emails Don't Work

Check these common issues:

1. **RESEND_API_KEY not set** - Add to `.env`
2. **Domain not verified** - Verify in Resend dashboard
3. **EMAIL_FROM uses wrong domain** - Must match verified domain
4. **Free tier limits** - Resend free = 100 emails/day

Tickets will still be saved to database even if emails fail.

---

## Documentation

Full documentation available in:
- `docs/HELP_CENTER_IMPLEMENTATION.md` - Help center features
- `docs/EMAIL_AND_SUPPORT_SYSTEM.md` - Complete email & admin system guide

---

## Quick Start (TL;DR)

```bash
# 1. Run migration
npx prisma migrate dev --name add_support_tickets
npx prisma generate

# 2. Add to .env
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="The Muslim Man Academy <support@themuslimman.com>"
ADMIN_EMAIL="your-email@example.com"
NEXT_PUBLIC_APP_URL="https://themuslimman.com"

# 3. Restart server
npm run dev
```

Then visit `/help` to test!
