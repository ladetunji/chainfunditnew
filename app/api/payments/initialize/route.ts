import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { campaigns } from '@/lib/schema/campaigns';
import { users } from '@/lib/schema/users';
import { eq } from 'drizzle-orm';
import { createStripePaymentIntent, simulateStripePayment } from '@/lib/payments/stripe';
import { createPaystackTransaction, simulatePaystackPayment } from '@/lib/payments/paystack';
import { getSupportedProviders } from '@/lib/payments/config';

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

    // Get authenticated user
    const userPayload = await auth.api.getSession({ headers: request.headers });
    if (!userPayload?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user details
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, userPayload.user.email))
      .limit(1);

    if (!user.length) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate campaign exists and is active
    const campaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign.length) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (campaign[0].status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Campaign is not active' },
        { status: 400 }
      );
    }

    // Check minimum donation amount
    const minDonation = parseFloat(campaign[0].minimumDonation);
    if (amount < minDonation) {
      return NextResponse.json(
        { success: false, error: `Minimum donation amount is ${campaign[0].currency} ${minDonation}` },
        { status: 400 }
      );
    }

    // Create donation record
    const newDonation = await db.insert(donations).values({
      campaignId,
      donorId: user[0].id,
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
      
      if (simulate) {
        paymentResult = await simulateStripePayment({
          amount: amountInCents,
          currency,
          donationId,
          campaignId,
          donorEmail: user[0].email!,
          metadata: {
            donorName: `${user[0].firstName} ${user[0].lastName}`,
            campaignTitle: campaign[0].title,
          },
        });
      } else {
        paymentResult = await createStripePaymentIntent({
          amount: amountInCents,
          currency,
          donationId,
          campaignId,
          donorEmail: user[0].email!,
          metadata: {
            donorName: `${user[0].firstName} ${user[0].lastName}`,
            campaignTitle: campaign[0].title,
          },
        });
      }

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
      
      if (simulate) {
        paymentResult = await simulatePaystackPayment({
          amount: amountInKobo,
          currency,
          email: user[0].email!,
          donationId,
          campaignId,
          metadata: {
            donorName: `${user[0].firstName} ${user[0].lastName}`,
            campaignTitle: campaign[0].title,
          },
        });
      } else {
        paymentResult = await createPaystackTransaction({
          amount: amountInKobo,
          currency,
          email: user[0].email!,
          donationId,
          campaignId,
          metadata: {
            donorName: `${user[0].firstName} ${user[0].lastName}`,
            campaignTitle: campaign[0].title,
          },
        });
      }

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
      { success: false, error: paymentResult?.error || 'Payment initialization failed' },
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
