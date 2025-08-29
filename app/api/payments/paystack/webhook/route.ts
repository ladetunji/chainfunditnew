import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { eq } from 'drizzle-orm';
import { handlePaystackWebhook, verifyPaystackTransaction } from '@/lib/payments/paystack';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { success, event, error } = await handlePaystackWebhook(body);

    if (!success) {
      console.error('Paystack webhook error:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data);
        break;
      
      case 'charge.failed':
        await handleChargeFailed(event.data);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing Paystack webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleChargeSuccess(chargeData: any) {
  try {
    const donationId = chargeData.metadata?.donationId;
    const reference = chargeData.reference;
    
    if (!donationId) {
      console.error('No donation ID found in charge metadata');
      return;
    }

    // Verify the transaction
    const verification = await verifyPaystackTransaction(reference);
    
    if (verification.success) {
      await db
        .update(donations)
        .set({
          paymentStatus: 'completed',
          processedAt: new Date(),
        })
        .where(eq(donations.id, donationId));

      console.log(`Payment completed for donation: ${donationId}`);
    } else {
      console.error('Transaction verification failed:', verification.error);
    }
  } catch (error) {
    console.error('Error handling charge success:', error);
  }
}

async function handleChargeFailed(chargeData: any) {
  try {
    const donationId = chargeData.metadata?.donationId;
    
    if (!donationId) {
      console.error('No donation ID found in charge metadata');
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
    console.error('Error handling charge failure:', error);
  }
}
