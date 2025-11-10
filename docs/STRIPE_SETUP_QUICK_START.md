# Stripe Setup Quick Start Checklist

## ✅ Step-by-Step Setup

### 1. Create Stripe Account (Platform Account)
- [ ] Go to [stripe.com](https://stripe.com) and sign up
- [ ] Complete business verification
- [ ] Add bank account for receiving funds
- [ ] Verify identity

### 2. Get API Keys
- [ ] Go to **Developers** → **API keys** in Stripe Dashboard
- [ ] Copy **Publishable key** (`pk_test_...`)
- [ ] Copy **Secret key** (`sk_test_...`)
- [ ] Add to `.env.local`:
  ```bash
  STRIPE_SECRET_KEY=sk_test_...
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
  ```

### 3. Enable Stripe Connect
- [ ] Go to **Settings** → **Connect** in Stripe Dashboard
- [ ] Click **Get started** or **Activate Connect**
- [ ] Choose **Express accounts**
- [ ] Complete Connect setup (branding, payout settings)

### 4. Set Up Webhooks
- [ ] Go to **Developers** → **Webhooks**
- [ ] Click **Add endpoint**
- [ ] Enter URL: `https://your-domain.com/api/webhooks/stripe`
  - For local: `https://localhost:3002/api/webhooks/stripe`
- [ ] Select events:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.canceled`
  - `charge.refunded`
  - `account.updated`
- [ ] Copy **Signing secret** (`whsec_...`)
- [ ] Add to `.env.local`:
  ```bash
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```

### 5. Test the Flow
- [ ] Start server: `npm run dev`
- [ ] Start webhook forwarding: `stripe listen --forward-to https://localhost:3002/api/webhooks/stripe`
- [ ] Make test donation with card: `4242 4242 4242 4242`
- [ ] Verify payment appears in Stripe Dashboard
- [ ] Test creator payout request
- [ ] Verify creator onboarding works

---

## 📋 Environment Variables Summary

```bash
# Required
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://localhost:3002
```

---

## 🔄 Money Flow

```
Donor → Platform Stripe Account → Creator Stripe Connect Account
```

- **Donations** go to your platform Stripe account
- **Payouts** transfer from platform to creator accounts
- **Fees** are deducted automatically

---

## 🧪 Test Cards

**Stripe Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`
- Expiry: Any future date
- CVC: Any 3 digits

---

## 🚀 Going to Production

1. Switch to live keys (`sk_live_...`, `pk_live_...`)
2. Complete account verification
3. Update webhook URL to production domain
4. Test with small real transactions
5. Monitor in Stripe Dashboard

---

## 📚 Full Documentation

See [STRIPE_CONNECT_SETUP.md](./STRIPE_CONNECT_SETUP.md) for detailed information.


