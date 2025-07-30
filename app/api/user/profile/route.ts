import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema/users';
import { eq } from 'drizzle-orm';
import { parse } from 'cookie';
import { verifyUserJWT } from '@/lib/auth';

async function getUserFromRequest(request: NextRequest) {
  const cookie = request.headers.get('cookie') || '';
  const cookies = parse(cookie);
  const token = cookies['auth_token'];
  if (!token) return null;
  const userPayload = verifyUserJWT(token);
  if (!userPayload || !userPayload.email) return null;
  return userPayload.email;
}

export async function GET(request: NextRequest) {
  const email = await getUserFromRequest(request);
  if (!email) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user.length) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, user: user[0] });
}

export async function POST(request: NextRequest) {
  try {
    const email = await getUserFromRequest(request);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    const {
      fullName,
      avatar,
      bio,
      instagram,
      facebook,
      linkedin,
      twitter,
      tiktok,
      youtube,
    } = await request.json();

    const updateResult = await db.update(users)
      .set({
        fullName,
        avatar,
        bio,
        instagram,
        facebook,
        linkedin,
        twitter,
        tiktok,
        youtube,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email))
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