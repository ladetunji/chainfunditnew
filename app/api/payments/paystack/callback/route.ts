import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { campaigns } from '@/lib/schema/campaigns';
import { eq, sum, and } from 'drizzle-orm';
import { verifyPaystackTransaction } from '@/lib/payments/paystack';

// Helper function to update campaign currentAmount based on completed donations
async function updateCampaignAmount(campaignId: string) {
  try {
    // Calculate total amount from completed donations
    const donationStats = await db
      .select({
        totalAmount: sum(donations.amount),
      })
      .from(donations)
      .where(and(
        eq(donations.campaignId, campaignId),
        eq(donations.paymentStatus, 'completed')
      ));

    const totalAmount = Number(donationStats[0]?.totalAmount || 0);

    // Update campaign currentAmount
    await db
      .update(campaigns)
      .set({
        currentAmount: totalAmount.toString(),
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));
  } catch (error) {
    console.error('Error updating campaign amount:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    
    if (!reference) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/campaigns?donation_status=failed&error=missing_reference`
      );
    }

    // Verify the transaction
    const verification = await verifyPaystackTransaction(reference);
    
    if (!verification.success) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/campaigns?donation_status=failed&error=verification_failed`
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
        `${process.env.NEXT_PUBLIC_APP_URL}/campaigns?donation_status=failed&error=donation_not_found`
      );
    }

    console.log('Paystack callback: Found donation', donation[0].id, 'for reference', reference);

    // Update donation status
    await db
      .update(donations)
      .set({
        paymentStatus: 'completed',
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(donations.id, donation[0].id));

    console.log('Paystack callback: Updated donation status to completed');

    // Update campaign currentAmount
    await updateCampaignAmount(donation[0].campaignId);
    console.log('Paystack callback: Updated campaign amount');


    // Redirect to campaign page with success status
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/campaign/${donation[0].campaignId}?donation_status=success&donation_id=${donation[0].id}`;
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/campaigns?donation_status=failed&error=callback_error`
    );
  }
}
