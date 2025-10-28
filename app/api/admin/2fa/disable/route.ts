import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { disableTwoFactor, verifyTwoFactorCode } from '@/lib/two-factor-auth';

/**
 * POST /api/admin/2fa/disable
 * Disable 2FA for admin user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdminAuth(request);
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    // Verify the code before disabling
    const verification = await verifyTwoFactorCode(user.email, code);
    if (!verification.isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Disable 2FA
    const success = await disableTwoFactor(user.email);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to disable 2FA' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully',
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}
