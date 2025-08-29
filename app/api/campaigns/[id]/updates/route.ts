import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaignUpdates, campaigns, users } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/campaigns/[id]/updates - Get all updates for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    
    // Get campaign updates
    const updates = await db
      .select()
      .from(campaignUpdates)
      .where(eq(campaignUpdates.campaignId, campaignId))
      .orderBy(desc(campaignUpdates.createdAt));

    return NextResponse.json({
      success: true,
      data: updates,
    });
  } catch (error) {
    console.error('Error fetching campaign updates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign updates' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns/[id]/updates - Create a new campaign update
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    
    // Get authenticated user
    const userEmail = await getUserFromRequest(request);
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user details
    const user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (!user.length) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user[0].id;
    const body = await request.json();

    // Check if campaign exists
    const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (!campaign.length) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    // Verify user is the creator of the campaign
    if (campaign[0].creatorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only add updates to campaigns you created' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Create the update
    const newUpdate = await db
      .insert(campaignUpdates)
      .values({
        campaignId,
        title: body.title,
        content: body.content,
        isPublic: body.isPublic !== undefined ? body.isPublic : true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newUpdate[0],
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create campaign update' },
      { status: 500 }
    );
  }
}

// PUT /api/campaigns/[id]/updates/[updateId] - Update a campaign update
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  try {
    const { id: campaignId, updateId } = await params;
    
    // Get authenticated user
    const userEmail = await getUserFromRequest(request);
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user details
    const user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (!user.length) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user[0].id;
    const body = await request.json();

    // Check if campaign exists and user is creator
    const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (!campaign.length) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign[0].creatorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only edit updates for campaigns you created' },
        { status: 403 }
      );
    }

    // Check if update exists
    const existingUpdate = await db
      .select()
      .from(campaignUpdates)
      .where(and(eq(campaignUpdates.id, updateId), eq(campaignUpdates.campaignId, campaignId)))
      .limit(1);

    if (!existingUpdate.length) {
      return NextResponse.json({ success: false, error: 'Update not found' }, { status: 404 });
    }

    // Update the update
    const updatedUpdate = await db
      .update(campaignUpdates)
      .set({
        title: body.title,
        content: body.content,
        isPublic: body.isPublic,
        updatedAt: new Date(),
      })
      .where(and(eq(campaignUpdates.id, updateId), eq(campaignUpdates.campaignId, campaignId)))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedUpdate[0],
    });
  } catch (error) {
    console.error('Error updating campaign update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update campaign update' },
      { status: 500 }
    );
  }
}

// DELETE /api/campaigns/[id]/updates/[updateId] - Delete a campaign update
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  try {
    const { id: campaignId, updateId } = await params;
    
    // Get authenticated user
    const userEmail = await getUserFromRequest(request);
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user details
    const user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (!user.length) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user[0].id;

    // Check if campaign exists and user is creator
    const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (!campaign.length) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign[0].creatorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only delete updates for campaigns you created' },
        { status: 403 }
      );
    }

    // Check if update exists
    const existingUpdate = await db
      .select()
      .from(campaignUpdates)
      .where(and(eq(campaignUpdates.id, updateId), eq(campaignUpdates.campaignId, campaignId)))
      .limit(1);

    if (!existingUpdate.length) {
      return NextResponse.json({ success: false, error: 'Update not found' }, { status: 404 });
    }

    // Delete the update
    await db
      .delete(campaignUpdates)
      .where(and(eq(campaignUpdates.id, updateId), eq(campaignUpdates.campaignId, campaignId)));

    return NextResponse.json({
      success: true,
      message: 'Update deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting campaign update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign update' },
      { status: 500 }
    );
  }
} 