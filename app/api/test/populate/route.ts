import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, donations, users } from '@/lib/schema';
import { generateTestCampaigns, generateTestDonations } from '@/lib/utils/test-data';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // This is a test endpoint - in production, you'd want proper authentication
    const body = await request.json();
    const { action, creatorId } = body;

    if (action === 'populate_campaigns') {
      if (!creatorId) {
        return NextResponse.json(
          { success: false, error: 'Creator ID is required' },
          { status: 400 }
        );
      }

      // Generate test campaigns
      const testCampaigns = generateTestCampaigns(creatorId);
      
      // Insert test campaigns
      const insertedCampaigns = await Promise.all(
        testCampaigns.map(async (campaign) => {
          const result = await db.insert(campaigns).values({
            id: campaign.id,
            creatorId: campaign.creatorId,
            title: campaign.title,
            subtitle: campaign.subtitle,
            description: campaign.description,
            reason: campaign.reason,
            fundraisingFor: campaign.fundraisingFor,
            duration: campaign.duration,
            goalAmount: campaign.goalAmount,
            currentAmount: campaign.currentAmount,
            currency: campaign.currency,
            minimumDonation: '1000',
            chainerCommissionRate: '5.0',
            status: campaign.status,
            isActive: campaign.isActive,
            createdAt: new Date(campaign.createdAt),
            updatedAt: new Date(campaign.updatedAt),
            closedAt: campaign.closedAt ? new Date(campaign.closedAt) : null,
          }).returning();
          
          return result[0];
        })
      );

      return NextResponse.json({
        success: true,
        message: `Inserted ${insertedCampaigns.length} test campaigns`,
        campaigns: insertedCampaigns
      });
    }

    if (action === 'populate_donations') {
      const { campaignId, donorIds } = body;
      
      if (!campaignId || !donorIds || !Array.isArray(donorIds)) {
        return NextResponse.json(
          { success: false, error: 'Campaign ID and donor IDs array are required' },
          { status: 400 }
        );
      }

      // Generate test donations
      const testDonations = generateTestDonations(campaignId, donorIds);
      
      // Insert test donations
      const insertedDonations = await Promise.all(
        testDonations.map(async (donation) => {
          const result = await db.insert(donations).values({
            id: donation.id,
            campaignId: donation.campaignId,
            donorId: donation.donorId,
            chainerId: donation.chainerId,
            amount: donation.amount,
            currency: donation.currency,
            paymentStatus: donation.paymentStatus,
            paymentMethod: donation.paymentMethod,
            paymentIntentId: donation.paymentIntentId,
            message: donation.message,
            isAnonymous: donation.isAnonymous,
            createdAt: new Date(donation.createdAt),
            processedAt: donation.processedAt ? new Date(donation.processedAt) : null,
          }).returning();
          
          return result[0];
        })
      );

      return NextResponse.json({
        success: true,
        message: `Inserted ${insertedDonations.length} test donations`,
        donations: insertedDonations
      });
    }

    if (action === 'cleanup') {
      // Clean up test data
      await db.delete(donations).where(eq(donations.paymentIntentId, 'pi_test_1'));
      await db.delete(donations).where(eq(donations.paymentIntentId, 'pi_test_2'));
      await db.delete(donations).where(eq(donations.paymentIntentId, 'pi_test_3'));
      await db.delete(donations).where(eq(donations.paymentIntentId, 'pi_test_4'));
      await db.delete(donations).where(eq(donations.paymentIntentId, 'pi_test_5'));
      await db.delete(donations).where(eq(donations.paymentIntentId, 'pi_test_6'));
      await db.delete(donations).where(eq(donations.paymentIntentId, 'pi_test_7'));
      
      await db.delete(campaigns).where(eq(campaigns.id, 'test-campaign-1'));
      await db.delete(campaigns).where(eq(campaigns.id, 'test-campaign-2'));
      await db.delete(campaigns).where(eq(campaigns.id, 'test-campaign-3'));
      await db.delete(campaigns).where(eq(campaigns.id, 'test-campaign-4'));

      return NextResponse.json({
        success: true,
        message: 'Test data cleaned up successfully'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error populating test data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to populate test data' },
      { status: 500 }
    );
  }
}
