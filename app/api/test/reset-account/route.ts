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

export async function POST(request: NextRequest) {
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

    // Reset account details to allow testing
    await db
      .update(users)
      .set({
        accountNumber: null,
        bankCode: null,
        bankName: null,
        accountName: null,
        accountVerified: false,
        accountVerificationDate: null,
        accountLocked: false,
        accountChangeRequested: false,
        accountChangeReason: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: 'Account details have been reset successfully. You can now test the verification flow.',
    });
  } catch (error) {
    console.error('Reset account error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset account details' },
      { status: 500 }
    );
  }
}
