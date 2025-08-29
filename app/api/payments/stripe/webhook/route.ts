import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { eq } from 'drizzle-orm';
import { handleStripeWebhook } from '@/lib/payments/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    const { success, event, error } = await handleStripeWebhook(body, signature);

    if (!success) {
      console.error('Stripe webhook error:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: any) {
  try {
    const donationId = paymentIntent.metadata.donationId;
    
    if (!donationId) {
      console.error('No donation ID found in payment intent metadata');
      return;
    }

    await db
      .update(donations)
      .set({
        paymentStatus: 'completed',
        processedAt: new Date(),
      })
      .where(eq(donations.id, donationId));

    console.log(`Payment completed for donation: ${donationId}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  try {
    const donationId = paymentIntent.metadata.donationId;
    
    if (!donationId) {
      console.error('No donation ID found in payment intent metadata');
      return;
    }

    await db
      .update(donations)
      .set({
        paymentStatus: 'failed',
      })
      .where(eq(donations.id, donationId));

    console.log(`Payment failed for donation: ${donationId}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}
