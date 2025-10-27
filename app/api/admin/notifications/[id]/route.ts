import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminNotifications } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getAdminUser } from '@/lib/admin-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const adminUser = await getAdminUser(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case 'mark_read':
        updateData = {
          status: 'read',
          readAt: new Date(),
        };
        break;
      case 'mark_unread':
        updateData = {
          status: 'unread',
          readAt: null,
        };
        break;
      case 'archive':
        updateData = {
          status: 'archived',
          archivedAt: new Date(),
        };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const [notification] = await db
      .update(adminNotifications)
      .set(updateData)
      .where(eq(adminNotifications.id, id))
      .returning();

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notification,
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const adminUser = await getAdminUser(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    await db
      .delete(adminNotifications)
      .where(eq(adminNotifications.id, id));

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
