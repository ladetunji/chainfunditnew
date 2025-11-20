import { NextRequest, NextResponse } from 'next/server';
import { requireUserAuth } from '@/lib/user-auth';
import { generateTwoFactorSetup } from '@/lib/two-factor-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUserAuth(request);
    const setup = await generateTwoFactorSetup(user.email);
    return NextResponse.json({ success: true, data: setup });
  } catch (error) {
    console.error('User 2FA setup error:', error);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
}

