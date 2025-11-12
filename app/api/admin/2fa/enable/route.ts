import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { enableTwoFactor, verifyTOTPCode } from '@/lib/two-factor-auth';
import { toast } from 'sonner';

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
    const isValid = verifyTOTPCode(secret, code);
    
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
    toast.error('Enable 2FA error: ' + error);
    return NextResponse.json(
      { error: 'Authentication required: ' + error },
      { status: 401 }
    );
  }
}
