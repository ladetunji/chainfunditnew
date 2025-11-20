import { NextRequest } from 'next/server';
import { parse } from 'cookie';
import { verifyUserJWT } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string | null;
  twoFactorEnabled: boolean;
  twoFactorBackupCodes: string | null;
}

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try NextRequest cookies API first
  const cookieToken = request.cookies.get('auth_token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback to parsing cookie header (for compatibility)
  const cookieHeader = request.headers.get('cookie') || '';
  if (cookieHeader) {
    const cookies = parse(cookieHeader);
    if (cookies['auth_token']) {
      return cookies['auth_token'];
    }
  }

  return null;
}

export async function requireUserAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const token = extractToken(request);
  if (!token) {
    throw new Error('Unauthorized');
  }

  const payload = verifyUserJWT(token);
  if (!payload?.sub) {
    throw new Error('Unauthorized');
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      twoFactorEnabled: users.twoFactorEnabled,
      twoFactorBackupCodes: users.twoFactorBackupCodes,
    })
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);

  if (!user) {
    throw new Error('Unauthorized');
  }

  return {
    ...user,
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
  };
}

