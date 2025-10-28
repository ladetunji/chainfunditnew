import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { regenerateBackupCodes } from '@/lib/two-factor-auth';

/**
 * POST /api/admin/2fa/backup-codes
 * Regenerate backup codes for admin user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdminAuth(request);
    
    const newBackupCodes = await regenerateBackupCodes(user.email);
    
    return NextResponse.json({
      success: true,
      backupCodes: newBackupCodes,
    });
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}
