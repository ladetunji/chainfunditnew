import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/schema/notifications';
import { users } from '@/lib/schema/users';
import { eq, desc } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const email = await getUserFromRequest(request);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Get user
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userId = user[0].id;

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Build where clause
    let whereClause = eq(notifications.userId, userId);
    if (unreadOnly) {
      whereClause = eq(notifications.isRead, false);
    }

    // Get notifications
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return NextResponse.json({
      success: true,
      notifications: userNotifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const email = await getUserFromRequest(request);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    // Get user
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userId = user[0].id;

    if (markAllAsRead) {
      // Mark all notifications as read
      await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date()
        })
        .where(eq(notifications.userId, userId));
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      for (const notificationId of notificationIds) {
        await db
          .update(notifications)
          .set({
            isRead: true,
            readAt: new Date()
          })
          .where(eq(notifications.id, notificationId));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
