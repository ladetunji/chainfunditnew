# Stripe Connect Setup Guide for ChainFundIt

## 🎯 Overview

This guide explains how to set up Stripe for ChainFundIt, including:
- **Platform Account**: Your main Stripe account that receives donations
- **Connected Accounts**: Creator accounts that receive payouts via Stripe Connect

---

## 📋 Prerequisites

1. A Stripe account ([stripe.com](https://stripe.com))
2. Access to your Stripe Dashboard
3. Your `.env.local` file

---

## 1️⃣ Platform Account Setup (Receiving Donations)

This is your main Stripe account that will hold all the money from donations.

### Step 1: Create/Verify Your Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. If you don't have an account, sign up
3. Complete business verification:
   - Business information
   - Tax information
   - Bank account for receiving funds
   - Identity verification

### Step 2: Get Your API Keys

1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Make sure you're in **Test mode** for development
3. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

4. Add to your `.env.local`:
```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Step 3: Enable Stripe Connect

1. In Stripe Dashboard, go to **Settings** → **Connect**
2. Click **Get started** or **Activate Connect**
3. Choose **Express accounts** (recommended for creators)
4. Complete the Connect setup:
   - Set up your platform branding
   - Configure payout settings
   - Set your business type

### Step 4: Configure Connect Settings

1. Go to **Settings** → **Connect** → **Settings**
2. Configure:
   - **Statement descriptor**: How your platform appears on statements (e.g., "ChainFundIt")
   - **Payout schedule**: How often you want to send payouts (daily, weekly, monthly)
   - **Business information**: Your platform details

---

## 2️⃣ Money Flow Architecture

### How It Works:

```
┌─────────────────┐
│   Donor         │
│   Pays $100     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ChainFundIt    │
│  Platform       │
│  Stripe Account │
│  (Holds $100)   │
└────────┬────────┘
         │
         │ (When creator requests payout)
         ▼
┌─────────────────┐
│  Creator's      │
│  Stripe Connect  │
│  Account        │
│  (Receives $95) │
└─────────────────┘
```

**Important Notes:**
- Donations go directly to **your platform Stripe account**
- Money is held in your Stripe account balance
- When creators request payouts, you transfer money from your account to their connected account
- Stripe Connect handles the transfer automatically

---

## 3️⃣ Creator Onboarding (Stripe Connect)

Creators need to set up Stripe Connect accounts to receive payouts.

### For Creators - How It Works:

1. **Creator requests payout** from their campaign
2. **System checks** if creator has Stripe Connect account
3. **If not**, creator is prompted to create one:
   - System creates a Stripe Connect Express account
   - Creator is redirected to Stripe onboarding
   - Creator completes:
     - Business/personal information
     - Bank account details
     - Tax information
     - Identity verification
4. **Once onboarded**, creator can receive payouts

### Technical Flow:

The code already handles this automatically:

1. **Account Creation**: `/api/stripe-connect/create-account`
   - Creates Express account in Stripe Connect
   - Stores `stripeAccountId` in user record

2. **Onboarding**: `/api/stripe-connect/account-link`
   - Generates onboarding URL
   - Creator completes Stripe's onboarding flow
   - System checks if account is ready

3. **Payout Processing**: `/lib/payments/payout-processor.ts`
   - Creates transfer from platform account to creator's account
   - Uses Stripe Transfers API

---

## 4️⃣ Environment Variables

Add these to your `.env.local`:

```bash
# App URL (important for redirects)
NEXT_PUBLIC_APP_URL=https://localhost:3002

# Stripe Platform Account (Receives Donations)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Note: Stripe Connect uses the same API keys
# The platform account is determined by the STRIPE_SECRET_KEY
```

---

## 5️⃣ Webhook Setup

Webhooks notify your app about payment events.

### Setup Webhooks:

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/webhooks/stripe
   ```
   For local testing:
   ```
   https://localhost:3002/api/webhooks/stripe
   ```

4. Select events to listen to:
   - ✅ `payment_intent.succeeded` - Donation successful
   - ✅ `payment_intent.payment_failed` - Donation failed
   - ✅ `payment_intent.canceled` - Donation canceled
   - ✅ `charge.refunded` - Refund processed
   - ✅ `account.updated` - Connect account updated (for creator onboarding)

5. Click **Add endpoint**
6. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Local Testing with Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to https://localhost:3002/api/webhooks/stripe

# Copy the webhook signing secret (starts with whsec_)
# Add to .env.local as STRIPE_WEBHOOK_SECRET
```

---

## 6️⃣ Testing the Flow

### Test Donation Flow:

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Start Stripe webhook forwarding** (in another terminal):
   ```bash
   stripe listen --forward-to https://localhost:3002/api/webhooks/stripe
   ```

3. **Make a test donation:**
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Check Stripe Dashboard → **Payments** to see the payment

### Test Payout Flow:

1. **Create a campaign** and receive donations
2. **Request a payout** from the payouts page
3. **If creator hasn't onboarded:**
   - System creates Stripe Connect account
   - Creator redirected to Stripe onboarding
   - Complete test onboarding (use test data)
4. **Once onboarded:**
   - Payout is processed
   - Transfer created from platform to creator account
   - Check in Stripe Dashboard → **Connect** → **Accounts**

---

## 7️⃣ Understanding Stripe Connect Account Types

### Express Accounts (Current Implementation)

- **Best for**: Individual creators, small businesses
- **Onboarding**: Simple, Stripe-hosted flow
- **Control**: Creators manage their own account
- **Fees**: Standard Stripe fees apply

### Standard Accounts (Not Currently Used)

- **Best for**: Larger businesses
- **Onboarding**: More complex, more control
- **Control**: You have more oversight
- **Fees**: Customizable fee structure

---

## 8️⃣ Fees and Pricing

### Current Structure:

1. **Donation Processing Fees**:
   - Stripe charges: 2.9% + $0.30 per successful card payment
   - These fees are deducted when donations are received

2. **Payout Fees** (from your code):
   - Stripe: 2.5% + $0.30 per payout
   - Paystack: 1.5% per payout (for NGN)

3. **Platform Fees** (if you want to charge):
   - Currently not implemented
   - You can add platform fees in the payout calculation

### Example:

```
Donation: $100
├─ Stripe processing fee: $3.20 (2.9% + $0.30)
├─ Net received: $96.80
│
Payout Request: $96.80
├─ Payout fee: $2.72 (2.5% + $0.30)
└─ Creator receives: $94.08
```

---

## 9️⃣ Production Checklist

Before going live:

- [ ] Switch to live API keys in production
- [ ] Complete Stripe account verification
- [ ] Enable Stripe Connect in production
- [ ] Set up production webhooks
- [ ] Test full donation → payout flow
- [ ] Verify creator onboarding works
- [ ] Set up monitoring and alerts
- [ ] Configure payout schedule
- [ ] Set up automated compliance checks
- [ ] Test with real bank accounts (small amounts)

---

## 🔟 Important Notes

### Security:

1. **Never expose your secret key** - Keep `STRIPE_SECRET_KEY` server-side only
2. **Verify webhook signatures** - Always validate webhook events
3. **Use HTTPS** - Required for production
4. **Store Connect account IDs securely** - Already handled in your database

### Compliance:

1. **Know Your Customer (KYC)**: Stripe handles KYC for Express accounts
2. **Tax Reporting**: Stripe provides 1099 forms for US creators
3. **International**: Different countries have different requirements
4. **Bank Account Verification**: Creators must verify their bank accounts

### Money Management:

1. **Platform Balance**: Your Stripe account holds all donation funds
2. **Transfers**: Money moves to creators via Stripe Transfers
3. **Settlement**: Funds settle to your bank account per your payout schedule
4. **Holds**: Stripe may hold funds for new accounts (risk management)

---

## 1️⃣1️⃣ Troubleshooting

### Creators Can't Receive Payouts:

**Problem**: Creator's Stripe Connect account not ready

**Solutions**:
1. Check if account is fully onboarded
2. Verify `stripeAccountReady` flag in database
3. Check Stripe Dashboard → Connect → Accounts
4. Look for requirements that need completion

### Transfers Failing:

**Problem**: Transfer to creator account fails

**Solutions**:
1. Check if creator account is active
2. Verify account has valid bank account
3. Check Stripe Dashboard for error messages
4. Ensure sufficient balance in platform account

### Webhooks Not Working:

**Problem**: Payment succeeded but database not updated

**Solutions**:
1. Verify webhook URL is correct
2. Check webhook secret matches
3. Check server logs for errors
4. Test with Stripe CLI

---

## 1️⃣2️⃣ Additional Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Connect Express Accounts](https://stripe.com/docs/connect/express-accounts)
- [Stripe Transfers](https://stripe.com/docs/connect/charges-transfers)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)

---

## 🎉 You're Ready!

Your Stripe setup is complete! Here's what you can do:

✅ **Receive donations** into your platform Stripe account  
✅ **Onboard creators** via Stripe Connect  
✅ **Send payouts** to creators' connected accounts  
✅ **Track everything** in Stripe Dashboard  

The system automatically:
- Creates Connect accounts for creators
- Handles onboarding flow
- Processes payouts via transfers
- Tracks account status


