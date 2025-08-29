import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { eq } from 'drizzle-orm';
import { verifyPaystackTransaction } from '@/lib/payments/paystack';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    
    if (!reference) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/donation/failed?error=missing_reference`
      );
    }

    // Verify the transaction
    const verification = await verifyPaystackTransaction(reference);
    
    if (!verification.success) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/donation/failed?error=verification_failed`
      );
    }

    // Find donation by payment intent ID (reference)
    const donation = await db
      .select()
      .from(donations)
      .where(eq(donations.paymentIntentId, reference))
      .limit(1);

    if (!donation.length) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/donation/failed?error=donation_not_found`
      );
    }

    // Update donation status
    await db
      .update(donations)
      .set({
        paymentStatus: 'completed',
        processedAt: new Date(),
      })
      .where(eq(donations.id, donation[0].id));

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/donation/success?donation=${donation[0].id}`
    );

  } catch (error) {
    console.error('Error processing Paystack callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/donation/failed?error=callback_error`
    );
  }
}
