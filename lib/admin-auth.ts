import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyUserJWT } from '@/lib/auth';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'super_admin';
  isVerified: boolean;
  accountLocked: boolean;
  twoFactorEnabled: boolean;
}

/**
 * Get admin user from request with role verification
 */
export async function getAdminUser(request: NextRequest): Promise<AdminUser | null> {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    // Verify token
    const userPayload = verifyUserJWT(token);
    if (!userPayload || !userPayload.email) {
      return null;
    }

    // Get user from database
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        isVerified: users.isVerified,
        accountLocked: users.accountLocked,
        twoFactorEnabled: users.twoFactorEnabled,
      })
      .from(users)
      .where(eq(users.email, userPayload.email))
      .limit(1);

    if (!user) {
      return null;
    }

    // Check if user has admin role
    if (!user.role || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return null;
    }

    // Check if account is locked or not verified
    if (user.accountLocked || !user.isVerified) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as 'admin' | 'super_admin',
      isVerified: user.isVerified,
      accountLocked: user.accountLocked || false,
      twoFactorEnabled: user.twoFactorEnabled || false,
    };

  } catch (error) {
    console.error('Get admin user error:', error);
    return null;
  }
}

/**
 * Check if user has super admin privileges
 */
export function isSuperAdmin(user: AdminUser | null): boolean {
  return user?.role === 'super_admin';
}

/**
 * Check if user has admin privileges (admin or super_admin)
 */
export function isAdmin(user: AdminUser | null): boolean {
  return user?.role === 'admin' || user?.role === 'super_admin';
}

/**
 * Require admin authentication middleware
 */
export async function requireAdminAuth(request: NextRequest): Promise<AdminUser> {
  const user = await getAdminUser(request);
  
  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Require super admin authentication middleware
 */
export async function requireSuperAdminAuth(request: NextRequest): Promise<AdminUser> {
  const user = await getAdminUser(request);
  
  if (!user) {
    throw new Error('Authentication required');
  }

  if (!isSuperAdmin(user)) {
    throw new Error('Super admin privileges required');
  }

  return user;
}

/**
 * Check if 2FA is required for admin access
 */
export function requiresTwoFactor(user: AdminUser | null): boolean {
  return user?.twoFactorEnabled || false;
}

/**
 * Require admin authentication with 2FA verification
 */
export async function requireAdminAuthWith2FA(request: NextRequest): Promise<AdminUser> {
  const user = await getAdminUser(request);
  
  if (!user) {
    throw new Error('Authentication required');
  }

  // If 2FA is enabled, check for 2FA verification in session
  if (user.twoFactorEnabled) {
    const twoFactorVerified = request.cookies.get('2fa_verified')?.value === 'true';
    if (!twoFactorVerified) {
      throw new Error('2FA verification required');
    }
  }

  return user;
}
