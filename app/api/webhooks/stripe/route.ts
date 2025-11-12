import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyStripeWebhook } from '@/lib/payments/stripe';
import { db } from '@/lib/db';
import { charityDonations, charities } from '@/lib/schema/charities';
import { campaignPayouts, commissionPayouts } from '@/lib/schema';
import { eq, sql, or } from 'drizzle-orm';
import Stripe from 'stripe';
import { notifyAdminsOfCharityDonation } from '@/lib/notifications/charity-donation-alerts';

export const runtime = 'nodejs';

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyStripeWebhook(body, signature);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentCanceled(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;
      }

      case 'transfer.created':
      case 'transfer.reversed': {
        const transfer = event.data.object as Stripe.Transfer;
        await handleTransfer(event.type, transfer);
        break;
      }

      default:
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing Stripe webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const donationId = paymentIntent.metadata.donationId;

    if (!donationId) {
      console.error('No donation ID in payment intent metadata');
      return;
    }

    // Update donation status
    const [donation] = await db
      .update(charityDonations)
      .set({
        paymentStatus: 'completed',
        transactionId: paymentIntent.id,
        updatedAt: new Date(),
      })
      .where(eq(charityDonations.id, donationId))
      .returning();

    if (!donation) {
      console.error('Donation not found:', donationId);
      return;
    }

    // Update charity total received
    await db
      .update(charities)
      .set({
        totalReceived: sql`${charities.totalReceived} + ${donation.amount}`,
        pendingAmount: sql`${charities.pendingAmount} + ${donation.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(charities.id, donation.charityId));

    // Get charity details for notification
    const charity = await db.query.charities.findFirst({
      where: eq(charities.id, donation.charityId),
    });

    if (charity) {
      // Send notification to admins
      await notifyAdminsOfCharityDonation({
        donationId: donation.id,
        charityId: charity.id,
        charityName: charity.name,
        amount: donation.amount,
        currency: donation.currency,
        donorName: donation.donorName || 'Anonymous',
        donorEmail: donation.donorEmail || '',
        isAnonymous: donation.isAnonymous,
        message: donation.message || undefined,
      });
    }

    // TODO: Send confirmation email to donor
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const donationId = paymentIntent.metadata.donationId;

    if (!donationId) {
      console.error('No donation ID in payment intent metadata');
      return;
    }

    await db
      .update(charityDonations)
      .set({
        paymentStatus: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(charityDonations.id, donationId));

    // TODO: Send failure notification to donor
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

/**
 * Handle canceled payment
 */
async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    const donationId = paymentIntent.metadata.donationId;

    if (!donationId) {
      console.error('No donation ID in payment intent metadata');
      return;
    }

    await db
      .update(charityDonations)
      .set({
        paymentStatus: 'canceled',
        updatedAt: new Date(),
      })
      .where(eq(charityDonations.id, donationId));

  } catch (error) {
    console.error('Error handling payment cancellation:', error);
    throw error;
  }
}

/**
 * Handle refund
 */
async function handleRefund(charge: Stripe.Charge) {
  try {
    const paymentIntentId = charge.payment_intent as string;

    // Find donation by payment intent ID
    const donation = await db.query.charityDonations.findFirst({
      where: eq(charityDonations.paymentIntentId, paymentIntentId),
    });

    if (!donation) {
      console.error('Donation not found for refund:', paymentIntentId);
      return;
    }

    // Update donation status
    await db
      .update(charityDonations)
      .set({
        paymentStatus: 'refunded',
        updatedAt: new Date(),
      })
      .where(eq(charityDonations.id, donation.id));

    // Update charity totals
    await db
      .update(charities)
      .set({
        totalReceived: sql`${charities.totalReceived} - ${donation.amount}`,
        pendingAmount: sql`${charities.pendingAmount} - ${donation.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(charities.id, donation.charityId));

    // TODO: Send refund confirmation to donor
  } catch (error) {
    console.error('Error handling refund:', error);
    throw error;
  }
}

/**
 * Handle transfer events (payouts)
 */
async function handleTransfer(eventType: string, transfer: Stripe.Transfer) {
  try {
    const payoutId = transfer.metadata?.payoutId;
    const payoutType = transfer.metadata?.type; // 'campaign' | 'commission'

    if (!payoutId) {
      return;
    }

    let status: string;
    let processedAt: Date | null = null;

    switch (eventType) {
      case 'transfer.created':
        // Transfer created - check if it's reversed, otherwise mark as completed
        if (transfer.reversed) {
          status = 'failed';
        } else {
          status = 'completed';
          processedAt = new Date();
        }
        break;
      case 'transfer.reversed':
        status = 'failed'; // Treat reversed as failed
        break;
      default:
        status = 'processing';
    }

    if (payoutType === 'campaign') {
      await db
        .update(campaignPayouts)
        .set({
          status,
          transactionId: transfer.id,
          processedAt,
          failureReason: status === 'failed' ? (transfer.reversed ? 'Transfer reversed' : 'Transfer failed') : null,
          updatedAt: new Date(),
        })
        .where(eq(campaignPayouts.id, payoutId));

    } else if (payoutType === 'commission') {
      await db
        .update(commissionPayouts)
        .set({
          status,
          transactionId: transfer.id,
          processedAt,
        })
        .where(eq(commissionPayouts.id, payoutId));

    } else {
    }
  } catch (error) {
    console.error('Error handling transfer webhook:', error);
    throw error;
  }
}

