# Stripe Checkout Integration

Complete checkout flow with Stripe integration for TheMuslimMan Seerah platform.

## Setup Instructions

### 1. Install Dependencies

Already installed:
```bash
npm install stripe @stripe/stripe-js
```

### 2. Configure Stripe

#### A. Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers → API keys**
3. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
4. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

#### B. Create Products & Prices in Stripe

1. Go to **Products** in Stripe Dashboard
2. Click **Add product**
3. Create two products:

**Product 1: Seerah Essentials**
- Name: `Seerah Essentials`
- Price: `$49.00` (one-time payment)
- Copy the **Price ID** (starts with `price_`)

**Product 2: Complete Seerah System**
- Name: `Complete Seerah System`
- Price: `$79.00` (one-time payment)
- Copy the **Price ID** (starts with `price_`)

#### C. Set Up Webhook

1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)

#### D. Update Environment Variables

Update `.env.local` with your actual keys:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Product Price IDs
STRIPE_PRICE_ESSENTIALS=price_YOUR_ESSENTIALS_ID
STRIPE_PRICE_COMPLETE=price_YOUR_COMPLETE_ID
```

### 3. Run Database Migration

```bash
npx prisma migrate dev --name add_purchase_model
```

### 4. Test in Development

```bash
npm run dev
```

Visit: `http://localhost:3000`

#### Test with Stripe Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

## User Flow

1. **Homepage** → User clicks $49 or $79 plan button
2. **Get Started Page** → Shows plan features, user clicks "Create Account"
3. **Signup Page** → User creates account (plan parameter preserved)
4. **Email Verification** → User verifies email
5. **Checkout Page** → User enters payment details
6. **Payment Success** → User gets access to dashboard
7. **Dashboard** → Full access to all Seerah content

## File Structure

```
app/
├── checkout/
│   └── page.tsx                 # Stripe checkout form
├── payment/
│   └── success/
│       └── page.tsx             # Success page
├── api/
│   └── stripe/
│       ├── create-payment-intent/
│       │   └── route.ts         # Creates payment intent
│       ├── verify-payment/
│       │   └── route.ts         # Verifies payment
│       └── webhook/
│           └── route.ts         # Handles Stripe webhooks
lib/
└── stripe.ts                    # Stripe config & pricing

prisma/
└── schema.prisma               # Purchase model added
```

## Security Notes

- Never commit `.env.local` to git
- Always use test keys in development
- Switch to live keys only in production
- Webhook secret must match Stripe dashboard
- Payment intents include user metadata for verification

## Production Deployment

1. Set environment variables in Vercel/hosting platform
2. Update webhook URL to production domain
3. Switch to live Stripe keys (`pk_live_` and `sk_live_`)
4. Test complete flow with real card (then refund)

## Troubleshooting

### "Missing Stripe keys" error
- Check `.env.local` has all required variables
- Restart dev server after adding variables

### Webhook not working locally
- Use Stripe CLI for local testing:
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```

### Payment not completing
- Check browser console for errors
- Verify Stripe publishable key is correct
- Ensure webhook is configured correctly

## Support

For issues with Stripe integration, check:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
