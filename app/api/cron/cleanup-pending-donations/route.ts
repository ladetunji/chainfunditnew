import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { notifications } from '@/lib/schema/notifications';
import { campaigns } from '@/lib/schema/campaigns';
import { eq, and, lt } from 'drizzle-orm';
import { toast } from 'sonner';

export async function GET(request: NextRequest) {
  try {
    // Find pending donations older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const oldPendingDonations = await db
      .select({
        id: donations.id,
        campaignId: donations.campaignId,
        amount: donations.amount,
        currency: donations.currency,
        paymentMethod: donations.paymentMethod,
        createdAt: donations.createdAt,
        campaignTitle: campaigns.title,
      })
      .from(donations)
      .leftJoin(campaigns, eq(donations.campaignId, campaigns.id))
      .where(and(
        eq(donations.paymentStatus, 'pending'),
        lt(donations.createdAt, oneHourAgo)
      ));

    if (oldPendingDonations.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No old pending donations found',
        cleaned: 0 
      });
    }

    let cleanedCount = 0;

    // Update each donation to failed status
    for (const donation of oldPendingDonations) {
      try {
        const hoursOld = Math.floor((Date.now() - donation.createdAt.getTime()) / (1000 * 60 * 60));
        
        // Update donation status to failed
        await db
          .update(donations)
          .set({
            paymentStatus: 'failed',
            failureReason: 'Payment timeout - no response from payment provider',
            lastStatusUpdate: new Date(),
            providerStatus: 'timeout',
            providerError: `Payment pending for ${hoursOld} hours without response`,
            retryAttempts: 1,
          })
          .where(eq(donations.id, donation.id));

        // Create notification for campaign creator
        const campaign = await db
          .select({ creatorId: campaigns.creatorId })
          .from(campaigns)
          .where(eq(campaigns.id, donation.campaignId))
          .limit(1);

        if (campaign.length > 0) {
          await db.insert(notifications).values({
            userId: campaign[0].creatorId,
            type: 'donation_failed',
            title: 'Donation Timeout',
            message: `A donation of ${donation.currency} ${donation.amount} timed out after ${hoursOld} hours. The payment provider did not respond.`,
            metadata: JSON.stringify({
              donationId: donation.id,
              campaignId: donation.campaignId,
              amount: donation.amount,
              currency: donation.currency,
              reason: 'timeout',
              hoursPending: hoursOld
            })
          });
        }

        cleanedCount++;
      } catch (error) {
        toast.error('Error updating donation: ' + error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully cleaned up ${cleanedCount} old pending donations`,
      cleaned: cleanedCount 
    });

  } catch (error) {
    toast.error('Cleanup failed: ' + error);
    return NextResponse.json(
      { success: false, error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}
