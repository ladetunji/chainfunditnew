import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { enableTwoFactor, verifyTOTPCode } from '@/lib/two-factor-auth';

/**
 * POST /api/admin/2fa/enable
 * Enable 2FA for admin user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdminAuth(request);
    const body = await request.json();
    const { secret, code, backupCodes } = body;

    if (!secret || !code || !backupCodes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the code before enabling
    console.log('Verifying TOTP code:', { secret: secret.substring(0, 8) + '...', code });
    const isValid = verifyTOTPCode(secret, code);
    console.log('TOTP verification result:', isValid);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Enable 2FA
    const success = await enableTwoFactor(user.email, secret, backupCodes);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to enable 2FA' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully',
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}
