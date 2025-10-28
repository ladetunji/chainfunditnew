import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyUserJWT } from '@/lib/auth';

/**
 * Get user role from JWT token
 */
export async function getUserRoleFromToken(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return null;

    const userPayload = verifyUserJWT(token);
    if (!userPayload || !userPayload.email) return null;

    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.email, userPayload.email))
      .limit(1);

    return user?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Get appropriate redirect URL based on user role
 */
export function getRoleBasedRedirect(role: string | null, redirect?: string): string {
  // If there's a specific redirect and it's safe, use it
  if (redirect && isSafeRedirect(redirect)) {
    return redirect;
  }

  // Role-based redirects
  switch (role) {
    case 'admin':
    case 'super_admin':
      return '/admin/overview';
    case 'user':
    default:
      return '/dashboard';
  }
}

/**
 * Check if redirect URL is safe (prevents open redirect attacks)
 */
function isSafeRedirect(url: string): boolean {
  try {
    const urlObj = new URL(url, 'http://localhost');
    
    // Only allow same-origin redirects
    if (urlObj.origin !== window.location.origin) {
      return false;
    }

    // Block dangerous paths
    const dangerousPaths = ['/api/', '/admin/login', '/signin', '/signup'];
    return !dangerousPaths.some(path => urlObj.pathname.startsWith(path));
  } catch {
    return false;
  }
}

/**
 * Client-side role-based redirect
 */
export function redirectBasedOnRole(role: string | null, redirect?: string): void {
  const targetUrl = getRoleBasedRedirect(role, redirect);
  window.location.href = targetUrl;
}
