import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { campaigns } from '@/lib/schema/campaigns';
import { users } from '@/lib/schema/users';
import { eq } from 'drizzle-orm';
import { createStripePaymentIntent } from '@/lib/payments/stripe';
import { initializePaystackPayment } from '@/lib/payments/paystack';
import { getSupportedProviders } from '@/lib/payments/config';
import { validateCampaignForDonations, checkAndUpdateGoalReached } from '@/lib/utils/campaign-validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaignId,
      amount,
      currency,
      paymentProvider,
      message,
      isAnonymous,
      simulate = false, // For testing purposes
    } = body;

    // Validate required fields
    if (!campaignId || !amount || !currency || !paymentProvider) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate payment provider is supported for currency
    const supportedProviders = getSupportedProviders(currency);
    if (!supportedProviders.includes(paymentProvider)) {
      return NextResponse.json(
        { success: false, error: `${paymentProvider} does not support ${currency}` },
        { status: 400 }
      );
    }

    // Get authenticated user or create guest user
    const userEmail = await getUserFromRequest(request);
    let user;
    
    if (userEmail) {
      // Get authenticated user details
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, userEmail))
        .limit(1);

      if (!userResult.length) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      user = userResult[0];
    } else {
      // Create guest user for anonymous donations
      const guestEmail = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@chainfundit.com`;
      const guestUser = await db.insert(users).values({
        email: guestEmail,
        fullName: 'Anonymous Donor',
        isVerified: false,
        hasCompletedProfile: false,
      }).returning();
      
      user = guestUser[0];
    }

    // Validate campaign can accept donations
    const campaignValidation = await validateCampaignForDonations(campaignId);
    
    if (!campaignValidation.canAcceptDonations) {
      return NextResponse.json(
        { 
          success: false, 
          error: campaignValidation.reason || 'Campaign cannot accept donations',
          campaignStatus: campaignValidation.campaign?.status
        },
        { status: 400 }
      );
    }

    const campaign = campaignValidation.campaign;

    // Check minimum donation amount
    const minDonation = parseFloat(campaign.minimumDonation);
    if (amount < minDonation) {
      return NextResponse.json(
        { success: false, error: `Minimum donation amount is ${campaign.currency} ${minDonation}` },
        { status: 400 }
      );
    }

    // Create donation record
    const newDonation = await db.insert(donations).values({
      campaignId,
      donorId: user.id,
      amount: amount.toString(),
      currency,
      paymentMethod: paymentProvider,
      paymentStatus: 'pending',
      message,
      isAnonymous: isAnonymous || false,
    }).returning();

    const donationId = newDonation[0].id;

    // Initialize payment based on provider
    let paymentResult;
    
    if (paymentProvider === 'stripe') {
      const amountInCents = Math.round(amount * 100); // Convert to cents
      
      // Create payment intent (simulate mode removed - using real payments)
      const paymentIntent = await createStripePaymentIntent(
        amount,
        currency,
        {
          donationId,
          campaignId,
          donorEmail: user.email!,
          donorName: user.fullName || '',
          campaignTitle: campaign.title,
        }
      );

      paymentResult = {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };

      if (paymentResult.success) {
        // Update donation with payment intent ID
        await db
          .update(donations)
          .set({ paymentIntentId: paymentResult.paymentIntentId })
          .where(eq(donations.id, donationId));

        return NextResponse.json({
          success: true,
          provider: 'stripe',
          clientSecret: paymentResult.clientSecret,
          donationId,
          paymentIntentId: paymentResult.paymentIntentId,
        });
      }
    } 
    else if (paymentProvider === 'paystack') {
      const amountInKobo = currency === 'NGN' ? Math.round(amount * 100) : Math.round(amount * 100);
      
      // Initialize Paystack payment (simulate mode removed - using real payments)
      const paystackResponse = await initializePaystackPayment(
        user.email!,
        amount,
        currency,
        {
          donationId,
          campaignId,
          donorName: user.fullName || '',
          campaignTitle: campaign.title,
        },
        `${process.env.NEXT_PUBLIC_APP_URL}api/payments/paystack/callback`
      );

      paymentResult = {
        success: paystackResponse.status,
        authorization_url: paystackResponse.data.authorization_url,
        reference: paystackResponse.data.reference,
        accessCode: paystackResponse.data.access_code,
      };

      if (paymentResult.success) {
        // Update donation with reference
        await db
          .update(donations)
          .set({ paymentIntentId: paymentResult.reference })
          .where(eq(donations.id, donationId));

        return NextResponse.json({
          success: true,
          provider: 'paystack',
          authorization_url: paymentResult.authorization_url,
          donationId,
          reference: paymentResult.reference,
        });
      }
    }

    // If payment initialization failed, delete the donation record
    await db.delete(donations).where(eq(donations.id, donationId));

    return NextResponse.json(
      { success: false, error: 'Payment initialization failed' },
      { status: 500 }
    );

  } catch (error) {
    console.error('Error initializing payment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
