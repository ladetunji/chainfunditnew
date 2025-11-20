import { NextRequest, NextResponse } from 'next/server';
import { requireUserAuth } from '@/lib/user-auth';
import { disableTwoFactor, verifyTwoFactorCode } from '@/lib/two-factor-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUserAuth(request);
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    const verification = await verifyTwoFactorCode(user.email, code);
    if (!verification.isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    const success = await disableTwoFactor(user.email);
    if (!success) {
      return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Two-factor authentication disabled' });
  } catch (error) {
    console.error('User 2FA disable error:', error);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
}

