import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaignComments, campaigns, users } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/campaigns/[id]/comments - Get all comments for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    
    // Get campaign comments with user details
    const comments = await db
      .select({
        id: campaignComments.id,
        content: campaignComments.content,
        isPublic: campaignComments.isPublic,
        createdAt: campaignComments.createdAt,
        updatedAt: campaignComments.updatedAt,
        userId: campaignComments.userId,
        userName: users.fullName,
        userEmail: users.email,
        userAvatar: users.avatar,
      })
      .from(campaignComments)
      .innerJoin(users, eq(campaignComments.userId, users.id))
      .where(eq(campaignComments.campaignId, campaignId))
      .orderBy(desc(campaignComments.createdAt));

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error('Error fetching campaign comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign comments' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns/[id]/comments - Create a new comment
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

    // Validate required fields
    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Create the comment
    const newComment = await db
      .insert(campaignComments)
      .values({
        campaignId,
        userId,
        content: body.content.trim(),
        isPublic: body.isPublic !== undefined ? body.isPublic : true,
      })
      .returning();

    // Get the created comment with user details
    const commentWithUser = await db
      .select({
        id: campaignComments.id,
        content: campaignComments.content,
        isPublic: campaignComments.isPublic,
        createdAt: campaignComments.createdAt,
        updatedAt: campaignComments.updatedAt,
        userId: campaignComments.userId,
        userName: users.fullName,
        userEmail: users.email,
        userAvatar: users.avatar,
      })
      .from(campaignComments)
      .innerJoin(users, eq(campaignComments.userId, users.id))
      .where(eq(campaignComments.id, newComment[0].id))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: commentWithUser[0],
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

// PUT /api/campaigns/[id]/comments/[commentId] - Update a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: campaignId, commentId } = await params;
    
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
    
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Ensure body is an object
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body format' },
        { status: 400 }
      );
    }

    // Check if campaign exists
    const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (!campaign.length) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    // Check if comment exists
    const existingComment = await db
      .select()
      .from(campaignComments)
      .where(and(eq(campaignComments.id, commentId), eq(campaignComments.campaignId, campaignId)))
      .limit(1);

    if (!existingComment.length) {
      return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
    }

    // Verify user is the author of the comment
    if (existingComment[0].userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    // Validate content
    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Update the comment
    const updatedComment = await db
      .update(campaignComments)
      .set({
        content: body.content.trim(),
        updatedAt: new Date(),
      })
      .where(and(eq(campaignComments.id, commentId), eq(campaignComments.campaignId, campaignId)))
      .returning();

    // Get the updated comment with user details
    const commentWithUser = await db
      .select({
        id: campaignComments.id,
        content: campaignComments.content,
        isPublic: campaignComments.isPublic,
        createdAt: campaignComments.createdAt,
        updatedAt: campaignComments.updatedAt,
        userId: campaignComments.userId,
        userName: users.fullName,
        userEmail: users.email,
        userAvatar: users.avatar,
      })
      .from(campaignComments)
      .innerJoin(users, eq(campaignComments.userId, users.id))
      .where(eq(campaignComments.id, commentId))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: commentWithUser[0],
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// DELETE /api/campaigns/[id]/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: campaignId, commentId } = await params;
    
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

    // Check if campaign exists
    const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (!campaign.length) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    // Check if comment exists
    const existingComment = await db
      .select()
      .from(campaignComments)
      .where(and(eq(campaignComments.id, commentId), eq(campaignComments.campaignId, campaignId)))
      .limit(1);

    if (!existingComment.length) {
      return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
    }

    // Verify user is the author of the comment OR the campaign creator
    if (existingComment[0].userId !== userId && campaign[0].creatorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own comments or comments on your campaigns' },
        { status: 403 }
      );
    }

    // Delete the comment
    await db
      .delete(campaignComments)
      .where(and(eq(campaignComments.id, commentId), eq(campaignComments.campaignId, campaignId)));

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
} 