import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { verifyTwoFactorCode } from '@/lib/two-factor-auth';

/**
 * POST /api/admin/2fa/session
 * Set 2FA verification session for admin user
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

    // Verify the code
    const verification = await verifyTwoFactorCode(user.email, code);
    
    if (!verification.isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Set 2FA verification cookie 
    const response = NextResponse.json({
      success: true,
      message: '2FA verification successful',
      backupCodeUsed: verification.backupCodeUsed,
    });

    response.cookies.set('2fa_verified', 'true', {
      httpOnly: true,
      path: '/',
      maxAge: 48 * 60 * 60, // 48 hours
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    console.error('2FA session error:', error);
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}
