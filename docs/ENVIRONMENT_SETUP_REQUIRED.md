# CRITICAL SETUP REQUIRED

## The signup error is caused by missing/incorrect environment variables.

### What Needs To Be Fixed:

#### 1. **Database Password** (CRITICAL - Signup won't work)
Your `.env` file has:
```
DATABASE_URL="postgresql://postgres.btbaumqtxjuxjctgvjlm:YOUR_PASSWORD@..."
```

**Action Required:**
1. Go to your Supabase dashboard
2. Find your database password
3. Replace `YOUR_PASSWORD` in `.env` with your actual password

#### 2. **Email Verification** (Required for account verification)
```
RESEND_API_KEY="re_your_api_key_here"
```

**Action Required:**
1. Sign up at https://resend.com (free tier available)
2. Get your API key
3. Replace `re_your_api_key_here` in `.env`

#### 3. **Stripe Payment Keys** (Required for checkout)
The `.env.local` file needs:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK
STRIPE_PRICE_ESSENTIALS=price_YOUR_ID
STRIPE_PRICE_COMPLETE=price_YOUR_ID
```

**Action Required:**
1. Create Stripe account at https://dashboard.stripe.com
2. Get API keys from Developers → API keys
3. Create products and get Price IDs
4. Update `.env.local`

### Quick Fix Priority:

**RIGHT NOW (to fix signup):**
1. Update DATABASE_URL with your Supabase password

**BEFORE TESTING SIGNUP:**
2. Update RESEND_API_KEY (or signup will succeed but no verification email)

**BEFORE TESTING CHECKOUT:**
3. Set up Stripe keys

### After Fixing Database:

Run this to apply the Purchase model migration:
```bash
npx prisma migrate dev --name add_purchases
```

### Current Error:
The signup form shows "Something went wrong" because the database credentials are invalid, so it can't create the user account.
