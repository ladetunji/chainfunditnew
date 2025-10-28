import { NextRequest, NextResponse } from 'next/server';
import { verifyTwoFactorCode } from '@/lib/two-factor-auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/admin/2fa/verify
 * Verify 2FA code for admin user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Verify the code
    const verification = await verifyTwoFactorCode(email, code);
    
    if (!verification.isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Get user info to verify admin role
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        isVerified: users.isVerified,
        accountLocked: users.accountLocked,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    if (user.accountLocked || !user.isVerified) {
      return NextResponse.json(
        { error: 'Account is locked or not verified' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      backupCodeUsed: verification.backupCodeUsed,
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
