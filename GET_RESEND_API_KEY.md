# Get Your Resend API Key

## Quick Setup (5 minutes)

### 1. Sign Up for Resend
Go to [resend.com/signup](https://resend.com/signup) and create a free account.

### 2. Verify Your Domain
1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter: `themuslimman.com`
4. Add the DNS records to your domain registrar:
   - **SPF Record** (TXT)
   - **DKIM Record** (TXT)
   - **DMARC Record** (TXT)
5. Click **Verify** (takes 5-15 minutes)

### 3. Get Your API Key
1. Go to **API Keys** in the sidebar
2. Click **Create API Key**
3. Give it a name (e.g., "Production" or "Development")
4. Choose **Full Access** permissions
5. Click **Create**
6. **Copy the key** (starts with `re_`)

### 4. Add to Your .env File

Open `c:\Users\abe\Documents\Websites\Seerah\.env` and replace:

```bash
RESEND_API_KEY="YOUR_RESEND_API_KEY_HERE"
```

with your actual key:

```bash
RESEND_API_KEY="re_abc123xyz..."
```

### 5. Restart Dev Server
```bash
npm run dev
```

---

## Test It Works

1. Go to `http://localhost:3000/help`
2. Fill out the contact form
3. Submit
4. Check your email at `imunaser@themuslimman.com`

You should receive:
- ✅ Confirmation email (if you used your email in the form)
- ✅ Admin notification email

---

## Resend Free Tier

✅ **100 emails per day**
✅ **3,000 emails per month**
✅ **Unlimited domains**
✅ **All features included**
✅ **No credit card required**

Perfect for your use case!

---

## DNS Records to Add

When you add your domain in Resend, you'll get 3 DNS records. Add these to your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.):

### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
```

### DKIM Record
```
Type: TXT
Name: resend._domainkey
Value: [unique value from Resend]
```

### DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none
```

**Note**: Exact values will be provided by Resend dashboard.

---

## Why Resend?

- ✅ **Modern API** - Simple, clean interface
- ✅ **Fast delivery** - Emails sent instantly
- ✅ **Great deliverability** - Built on AWS SES
- ✅ **Generous free tier** - 3,000 emails/month
- ✅ **Easy to use** - Already integrated in your code
- ✅ **No credit card** - Start for free

---

## Troubleshooting

### Domain verification taking too long?
- DNS changes can take up to 24 hours
- Use Resend's test mode while waiting
- Check DNS propagation: [dnschecker.org](https://dnschecker.org)

### Emails not arriving?
- Check spam folder
- Verify domain is verified in Resend
- Check Resend dashboard logs
- Make sure EMAIL_FROM uses verified domain

### API key not working?
- Make sure you copied the entire key
- No spaces or quotes in .env
- Restart dev server after adding key
- Check for typos

---

## Alternative: Use Resend's Test Mode

While waiting for domain verification, you can test with Resend's onboarding email:

Update `.env`:
```bash
EMAIL_FROM="Acme <onboarding@resend.dev>"
```

This uses Resend's verified test domain. Perfect for development!

---

## Need Help?

Resend has great docs: [resend.com/docs](https://resend.com/docs)

Or check Resend support: [resend.com/support](https://resend.com/support)
