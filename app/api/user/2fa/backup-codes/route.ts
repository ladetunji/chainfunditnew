import { NextRequest, NextResponse } from 'next/server';
import { requireUserAuth } from '@/lib/user-auth';
import { regenerateBackupCodes } from '@/lib/two-factor-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUserAuth(request);

    const codes = await regenerateBackupCodes(user.email);

    return NextResponse.json({
      success: true,
      data: codes,
    });
  } catch (error) {
    console.error('User 2FA backup codes error:', error);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
}

