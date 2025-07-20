import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/schema/campaigns';
import { eq } from 'drizzle-orm';

// GET /api/campaigns/[id] - Get a specific campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const campaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, id))
      .limit(1);

    if (!campaign.length) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: campaign[0],
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

// PUT /api/campaigns/[id] - Update a campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      goalAmount,
      minimumDonation,
      chainerCommissionRate,
      status,
    } = body;

    // Validate commission rate if provided
    if (chainerCommissionRate && (chainerCommissionRate < 1 || chainerCommissionRate > 10)) {
      return NextResponse.json(
        { success: false, error: 'Commission rate must be between 1% and 10%' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (goalAmount) updateData.goalAmount = goalAmount.toString();
    if (minimumDonation) updateData.minimumDonation = minimumDonation.toString();
    if (chainerCommissionRate) updateData.chainerCommissionRate = chainerCommissionRate.toString();
    if (status) updateData.status = status;
    updateData.updatedAt = new Date();

    const updatedCampaign = await db
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, id))
      .returning();

    if (!updatedCampaign.length) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCampaign[0],
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

// DELETE /api/campaigns/[id] - Delete a campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const deletedCampaign = await db
      .delete(campaigns)
      .where(eq(campaigns.id, id))
      .returning();

    if (!deletedCampaign.length) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
} 