import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireAdminAuthWith2FA } from '@/lib/admin-auth';

/**
 * GET /api/admin/account-requests
 * Get list of all account change requests
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication with 2FA
    await requireAdminAuthWith2FA(request);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'pending'; // pending, all

    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(users.accountChangeRequested, true)];
    
    // Get users with account change requests
    const requests = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        accountNumber: users.accountNumber,
        bankCode: users.bankCode,
        bankName: users.bankName,
        accountName: users.accountName,
        accountVerified: users.accountVerified,
        accountLocked: users.accountLocked,
        accountChangeRequested: users.accountChangeRequested,
        accountChangeReason: users.accountChangeReason,
        updatedAt: users.updatedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(...whereConditions))
      .orderBy(desc(users.updatedAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalCount = await db
      .select()
      .from(users)
      .where(and(...whereConditions));

    const totalPages = Math.ceil(totalCount.length / limit);

    return NextResponse.json({
      requests,
      totalPages,
      currentPage: page,
      totalCount: totalCount.length,
    });

  } catch (error) {
    console.error('Error fetching account change requests:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message === '2FA verification required') {
        return NextResponse.json(
          { error: '2FA verification required' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch account change requests' },
      { status: 500 }
    );
  }
}

