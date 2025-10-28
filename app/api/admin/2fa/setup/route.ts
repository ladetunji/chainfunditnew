import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { generateTwoFactorSetup } from '@/lib/two-factor-auth';

/**
 * GET /api/admin/2fa/setup
 * Generate 2FA setup data for admin user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdminAuth(request);
    
    const setup = await generateTwoFactorSetup(user.email);
    
    return NextResponse.json({
      success: true,
      data: setup,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}
