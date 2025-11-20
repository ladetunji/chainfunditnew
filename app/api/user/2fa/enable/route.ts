import { NextRequest, NextResponse } from 'next/server';
import { requireUserAuth } from '@/lib/user-auth';
import { enableTwoFactor, verifyTOTPCode } from '@/lib/two-factor-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUserAuth(request);
    const body = await request.json();
    const { secret, code, backupCodes } = body;

    if (!secret || !code || !backupCodes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isValid = verifyTOTPCode(secret, code);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    const success = await enableTwoFactor(user.email, secret, backupCodes);
    if (!success) {
      return NextResponse.json({ error: 'Failed to enable 2FA' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Two-factor authentication enabled' });
  } catch (error) {
    console.error('User 2FA enable error:', error);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
}

