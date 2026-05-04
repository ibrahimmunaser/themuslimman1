# Automated Weekly Parent Progress Reports

## Overview
Automatic weekly progress report system that sends emails every Sunday to parents/guardians who have:
1. A verified parent email
2. Weekly reports enabled

## How It Works

### Manual Reporting
**Location:** Progress tab → "Send Report Now" button

**Features:**
- Instant progress report generation
- Sent to verified parent email
- 5-minute cooldown protection
- Success/error feedback
- Shows next scheduled automatic report

### Automatic Reporting
**Schedule:** Every Sunday at 9:00 AM (server time)

**Process:**
1. Cron job triggers `/api/cron/send-weekly-reports`
2. Finds all users with verified parent emails and `sendWeeklyReports: true`
3. Generates progress report for each user
4. Sends email via Resend
5. Logs results (sent, failed, errors)

## Setup

### 1. Environment Variables

Add to `.env.local` and Vercel:

```bash
# Required for cron endpoint
CRON_SECRET=your-secure-random-string-here

# Required for sending emails (already set)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=Seerah LMS <noreply@themuslimman.com>
```

Generate a secure CRON_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Vercel Cron Configuration

File: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/send-weekly-reports",
      "schedule": "0 9 * * 0"
    }
  ]
}
```

**Schedule:** `0 9 * * 0`
- `0` = minute (0)
- `9` = hour (9 AM)
- `*` = day of month (every)
- `*` = month (every)
- `0` = day of week (Sunday, 0-6 where 0 is Sunday)

**Time Zone:** UTC (Vercel Cron uses UTC)
- 9 AM UTC = 5 AM EST / 2 AM PST
- Adjust as needed for your target timezone

### 3. Deploy to Vercel

```bash
git add vercel.json
git commit -m "Add automated weekly report cron"
git push
```

Vercel will automatically:
- Detect `vercel.json`
- Register the cron job
- Execute it on schedule

### 4. Verify Cron Setup

1. Go to Vercel Dashboard → Your Project
2. Click "Settings" → "Crons"
3. Verify the cron job appears
4. Check execution logs

## API Endpoint

### `GET /api/cron/send-weekly-reports`

**Authorization:** Bearer token in header

```bash
curl -X GET https://themuslimman.com/api/cron/send-weekly-reports \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Response:**
```json
{
  "success": true,
  "message": "Weekly reports sent",
  "results": {
    "total": 10,
    "sent": 9,
    "failed": 1,
    "errors": ["user-id-123: Email delivery failed"]
  }
}
```

## Security

1. **Authorization Required**
   - Endpoint requires `CRON_SECRET` in Authorization header
   - Prevents unauthorized access
   - Different from Resend API key

2. **Vercel Cron Authentication**
   - Vercel automatically includes authorization
   - Manual calls require the secret

3. **Rate Limiting**
   - 500ms delay between each email
   - Prevents Resend rate limiting
   - Scales for large user bases

## Monitoring

### Check Cron Execution

**Vercel Dashboard:**
1. Project → Deployments → Functions
2. Find cron executions
3. View logs

**Console Logs:**
```bash
[CRON] Found 10 users for weekly reports
[CRON] Sent weekly report to parent@example.com
[CRON] Failed to send to parent2@example.com: Rate limit exceeded
[CRON] Weekly reports completed: { total: 10, sent: 9, failed: 1 }
```

### Test Manually

For testing before Sunday:

```bash
# Local testing (with .env.local)
curl -X GET http://localhost:3000/api/cron/send-weekly-reports \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Production testing
curl -X GET https://themuslimman.com/api/cron/send-weekly-reports \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Report Content

### For Essentials Users
- Lessons watched
- Briefings read
- Study time
- Current lesson
- Progress bar
- Next suggested lesson

### For Complete Users
- All Essentials content PLUS:
- Quiz scores & attempts
- Flashcards reviewed
- Weak/strong areas (future)
- Recommended review lessons (future)
- Certificate progress (future)

## Troubleshooting

### Cron Not Running

1. **Check Vercel Dashboard**
   - Verify cron is registered
   - Check execution logs

2. **Verify Schedule Syntax**
   - Use crontab format: `minute hour day month weekday`
   - Use [crontab.guru](https://crontab.guru) to validate

3. **Check Environment Variables**
   - `CRON_SECRET` must be set in Vercel
   - `RESEND_API_KEY` must be valid

### Emails Not Sending

1. **Check Resend Dashboard**
   - Verify API key is valid
   - Check sending limits
   - Review email logs

2. **Check User Data**
   - Verify `parentEmailVerified: true`
   - Verify `sendWeeklyReports: true`
   - Verify `parentEmail` exists

3. **Check Logs**
   - Look for error messages
   - Check failed email list in response

### Rate Limiting

If sending to many users:

1. **Increase delay between emails**
   ```typescript
   await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second
   ```

2. **Batch processing**
   - Process in chunks of 100 users
   - Add delays between batches

3. **Upgrade Resend plan**
   - Higher sending limits
   - More API requests per minute

## Future Enhancements

- [ ] Customizable report frequency (daily, biweekly, monthly)
- [ ] Customizable send day/time
- [ ] Report summaries in dashboard
- [ ] Email templates customization
- [ ] A/B testing for email content
- [ ] Unsubscribe link
- [ ] Report analytics (open rate, click rate)
- [ ] Multiple parent emails per student

## Manual Override

To send a specific user's report manually:

1. User goes to Progress tab
2. Clicks "Send Report Now"
3. 5-minute cooldown applies
4. Works independently of weekly schedule

Both systems coexist peacefully!

---

**Deployment Status:**
✅ API endpoint created
✅ Vercel cron configured
✅ Security implemented
✅ Error handling added
✅ Monitoring logs included
⏳ Requires `CRON_SECRET` environment variable
⏳ Requires Vercel deployment to activate
