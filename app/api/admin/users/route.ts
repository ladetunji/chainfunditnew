import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, donations, campaigns, chainers } from '@/lib/schema';
import { eq, like, and, desc, count, sum, sql } from 'drizzle-orm';
import { requireAdminAuthWith2FA } from '@/lib/admin-auth';

/**
 * GET /api/admin/users
 * Get paginated list of users with filters
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication with 2FA
    await requireAdminAuthWith2FA(request);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const role = searchParams.get('role') || 'all';

    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        sql`(${users.fullName} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`} OR ${users.phone} ILIKE ${`%${search}%`})`
      );
    }
    
    if (status !== 'all') {
      if (status === 'active') {
        whereConditions.push(eq(users.accountLocked, false));
      } else if (status === 'suspended' || status === 'banned') {
        whereConditions.push(eq(users.accountLocked, true));
      }
    }
    
    if (role !== 'all') {
      whereConditions.push(eq(users.role, role as any));
    }

    // Get users with pagination
    const baseQuery = db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        countryCode: users.countryCode,
        accountLocked: users.accountLocked,
        role: users.role,
        createdAt: users.createdAt,
        isVerified: users.isVerified,
      })
      .from(users);

    const usersList = await baseQuery
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countQuery = db
      .select({ count: count() })
      .from(users);

    const [totalCount] = await countQuery
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    // Get user stats for each user
    const usersWithStats = await Promise.all(
      usersList.map(async (user) => {
        // Get donation stats
        const [donationStats] = await db
          .select({
            totalDonations: count(),
            totalAmount: sum(donations.amount),
          })
          .from(donations)
          .where(and(
            eq(donations.donorId, user.id),
            eq(donations.paymentStatus, 'completed')
          ));

        // Get campaign stats
        const [campaignStats] = await db
          .select({ count: count() })
          .from(campaigns)
          .where(eq(campaigns.creatorId, user.id));

        // Get chainer stats
        const [chainerStats] = await db
          .select({ count: count() })
          .from(chainers)
          .where(eq(chainers.userId, user.id));

        return {
          ...user,
          status: user.accountLocked ? 'suspended' : 'active',
          stats: {
            totalDonations: donationStats?.totalDonations || 0,
            totalDonated: donationStats?.totalAmount || 0,
            totalRaised: 0, // This would need to be calculated from campaigns
            totalCampaigns: campaignStats?.count || 0,
            totalChains: chainerStats?.count || 0,
          },
        };
      })
    );

    const totalPages = Math.ceil(totalCount.count / limit);

    return NextResponse.json({
      users: usersWithStats,
      totalPages,
      currentPage: page,
      totalCount: totalCount.count,
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    
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
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication with 2FA
    await requireAdminAuthWith2FA(request);
    
    const body = await request.json();
    const { email, fullName, phone, role = 'user', status = 'active' } = body;

    // Validate required fields
    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        fullName,
        phone,
        role,
        isVerified: true, 
      })
      .returning();

    return NextResponse.json({
      message: 'User created successfully',
      user: newUser,
    });

  } catch (error) {
    console.error('Error creating user:', error);
    
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
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
