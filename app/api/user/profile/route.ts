import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema/users';
import { eq } from 'drizzle-orm';
import { parse } from 'cookie';
import { verifyUserJWT } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookies
    const cookie = request.headers.get('cookie') || '';
    const cookies = parse(cookie);
    const token = cookies['auth_token'];
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    const userPayload = verifyUserJWT(token);
    if (!userPayload || !userPayload.email) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    const { fullName, avatar } = await request.json();
    // Update user profile
    const updateResult = await db.update(users)
      .set({ fullName, avatar, hasCompletedProfile: true, updatedAt: new Date() })
      .where(eq(users.email, userPayload.email))
      .returning();
    if (!updateResult.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, user: updateResult[0] });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get('cookie') || '';
    const cookies = parse(cookie);
    const token = cookies['auth_token'];
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    const userPayload = verifyUserJWT(token);
    if (!userPayload || !userPayload.email) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    const [user] = await db.select().from(users).where(eq(users.email, userPayload.email)).limit(1);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 