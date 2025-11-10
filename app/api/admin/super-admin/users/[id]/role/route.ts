import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireSuperAdminAuth } from '@/lib/admin-auth';

/**
 * PATCH /api/admin/super-admin/users/[id]/role
 * Update user role (super admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require super admin authentication
    await requireSuperAdminAuth(request);
    
    const body = await request.json();
    const { role } = body;
    const { id: userId } = await params;

    // Validate role
    const validRoles = ['user', 'admin', 'super_admin'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: user, admin, super_admin' },
        { status: 400 }
      );
    }

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user role
    const [updatedUser] = await db
      .update(users)
      .set({
        role: role as 'user' | 'admin' | 'super_admin',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
      });

    return NextResponse.json({
      message: 'User role updated successfully',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message === 'Super admin privileges required') {
        return NextResponse.json(
          { error: 'Super admin privileges required' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}

