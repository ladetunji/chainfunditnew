import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyUserJWT } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from either Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Try to get token from cookies
      token = request.cookies.get('auth_token')?.value;
    }
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No authorization token provided' },
        { status: 401 }
      );
    }
    
    // Verify the JWT token
    const userPayload = verifyUserJWT(token);
    if (!userPayload || !userPayload.email) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user from database
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        avatar: users.avatar,
        role: users.role,
        hasCompletedProfile: users.hasCompletedProfile,
        hasSeenWelcomeModal: users.hasSeenWelcomeModal,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        twoFactorEnabled: users.twoFactorEnabled,
      })
      .from(users)
      .where(eq(users.email, userPayload.email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        role: user.role,
        hasCompletedProfile: user.hasCompletedProfile,
        hasSeenWelcomeModal: user.hasSeenWelcomeModal,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error('Error in /api/user/me:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user information' },
      { status: 500 }
    );
  }
}
