# ChainFundIt Setup Guide

## Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Neon.tech PostgreSQL database
- Vercel account (for deployment)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
BETTER_AUTH_SECRET=your-better-auth-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Email & Phone Verification
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
TWILIO_PHONE_NUMBER=+1234567890

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=sk_test_...
PAYSTACK_SECRET_KEY=sk_test_...

# File Storage
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# AI Services
OPENAI_API_KEY=sk-...

# Notifications
QSTASH_TOKEN=your-qstash-token

# Analytics
POSTHOG_KEY=your-posthog-key

# Error Tracking
SENTRY_DSN=your-sentry-dsn

# Link Shortening
DUB_CO_TOKEN=your-dub-co-token
```

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up the database:
```bash
# Generate migrations
pnpm db:generate

# Push schema to database
pnpm db:push

# Or run migrations
pnpm db:migrate
```

3. Start the development server:
```bash
pnpm dev
```

## Database Schema

The project uses Drizzle ORM with PostgreSQL. The schema includes:

- **users**: User accounts and profiles
- **campaigns**: Fundraising campaigns with chainer commission settings
- **donations**: Donation records with payment tracking
- **chainers**: Referral system with commission tracking
- **commission_payouts**: Commission distribution records
- **link_clicks**: Referral link click tracking
- **referrals**: Referral relationships
- **payments**: Payment transaction records
- **notifications**: User notifications
- **campaign_media**: Campaign images and videos
- **campaign_updates**: Campaign progress updates
- **campaign_comments**: Campaign comments

## API Routes

The project uses Next.js App Router API routes:

- `GET/POST /api/campaigns` - Campaign management
- `GET/PUT/DELETE /api/campaigns/[id]` - Individual campaign operations
- `GET/POST /api/donations` - Donation management
- `GET/POST /api/chainers` - Chainer management
- `GET /api/c/[referralCode]` - Referral link redirects
- `POST/GET /api/auth/[...betterauth]` - Authentication

## Key Features Implemented

1. **Multi-currency Support**: USD, GBP, NGN with localized minimums
2. **Chainer System**: Referral-based commission system
3. **Commission Management**: 1-10% commission rates with flexible destinations
4. **Payment Integration**: Stripe (USD/GBP) and Paystack (NGN)
5. **Database Schema**: Complete schema for all features
6. **API Routes**: RESTful API for all operations
7. **Authentication**: Better Auth with OAuth providers

## Next Steps

1. Set up payment providers (Stripe, Paystack)
2. Configure file storage (Cloudinary)
3. Set up notification system (QStash)
4. Configure analytics (PostHog)
5. Set up error tracking (Sentry)
6. Deploy to Vercel

## Development

- **Frontend**: Next.js 15+ with App Router
- **Database**: Drizzle ORM + Neon.tech PostgreSQL
- **Authentication**: Better Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Payments**: Stripe + Paystack
- **Deployment**: Vercel 