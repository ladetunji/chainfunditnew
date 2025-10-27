import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens, refreshTokens } from "@/lib/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { parse } from "cookie";
import { randomBytes } from "crypto";

// Simple in-memory cache for user lookups
const userCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Token configuration
export const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRY: "30m", // 30 minutes
  REFRESH_TOKEN_EXPIRY_DAYS: 30, // 30 days
  REFRESH_TOKEN_ROTATION: true, // Enable token rotation for security
};

/**
 * Generate an access token (short-lived)
 */
export function generateAccessToken(user: { id: string; email: string }) {
  const secret = process.env.JWT_SECRET || "dev_secret";
  return jwt.sign(
    { 
      sub: user.id, 
      email: user.email,
      type: 'access'
    }, 
    secret, 
    {
      expiresIn: "30m",
    }
  );
}

/**
 * Generate a refresh token (long-lived)
 */
export function generateRefreshToken(user: { id: string; email: string }) {
  const secret = process.env.JWT_SECRET || "dev_secret";
  const tokenId = randomBytes(32).toString('hex');
  
  return {
    token: jwt.sign(
      { 
        sub: user.id, 
        email: user.email,
        type: 'refresh',
        jti: tokenId, // JWT ID for tracking
      }, 
      secret, 
      {
        expiresIn: "30d",
      }
    ),
    tokenId,
  };
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(
  user: { id: string; email: string },
  request?: NextRequest
) {
  const accessToken = generateAccessToken(user);
  const { token: refreshToken, tokenId } = generateRefreshToken(user);
  
  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY_DAYS);
  
  const userAgent = request?.headers.get('user-agent') || null;
  const ipAddress = request?.headers.get('x-forwarded-for') || 
                    request?.headers.get('x-real-ip') || null;
  
  await db.insert(refreshTokens).values({
    userId: user.id,
    token: tokenId,
    expiresAt,
    userAgent,
    ipAddress,
  });
  
  return {
    accessToken,
    refreshToken,
    tokenId,
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): { sub: string; email: string } | null {
  const secret = process.env.JWT_SECRET || "dev_secret";
  try {
    const payload = jwt.verify(token, secret) as any;
    if (payload.type !== 'access') return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): { sub: string; email: string; jti: string } | null {
  const secret = process.env.JWT_SECRET || "dev_secret";
  try {
    const payload = jwt.verify(token, secret) as any;
    if (payload.type !== 'refresh') return null;
    return { sub: payload.sub, email: payload.email, jti: payload.jti };
  } catch {
    return null;
  }
}

/**
 * Validate refresh token against database
 */
export async function validateRefreshToken(tokenId: string, userId: string): Promise<boolean> {
  const result = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.token, tokenId),
        eq(refreshTokens.userId, userId),
        isNull(refreshTokens.isRevoked),
        gt(refreshTokens.expiresAt, new Date())
      )
    )
    .limit(1);
  
  return result.length > 0;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  request?: NextRequest
): Promise<{ accessToken: string; refreshToken?: string } | null> {
  // Verify refresh token JWT
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) return null;
  
  // Validate against database
  const isValid = await validateRefreshToken(payload.jti, payload.sub);
  if (!isValid) return null;
  
  // Update last used timestamp
  await db
    .update(refreshTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(refreshTokens.token, payload.jti));
  
  // Generate new access token
  const accessToken = generateAccessToken({ id: payload.sub, email: payload.email });
  
  // Token rotation: issue new refresh token and revoke old one
  if (TOKEN_CONFIG.REFRESH_TOKEN_ROTATION) {
    // Revoke old refresh token
    await revokeRefreshToken(payload.jti);
    
    // Generate new refresh token
    const newTokenPair = await generateTokenPair(
      { id: payload.sub, email: payload.email },
      request
    );
    
    return {
      accessToken: newTokenPair.accessToken,
      refreshToken: newTokenPair.refreshToken,
    };
  }
  
  return { accessToken };
}

/**
 * Revoke a refresh token
 */
export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ isRevoked: new Date() })
    .where(eq(refreshTokens.token, tokenId));
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ isRevoked: new Date() })
    .where(
      and(
        eq(refreshTokens.userId, userId),
        isNull(refreshTokens.isRevoked)
      )
    );
}

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use generateTokenPair instead
 */
export function generateUserJWT(user: { id: string; email: string }) {
  return generateAccessToken(user);
}

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use verifyAccessToken instead
 */
export function verifyUserJWT(token: string): { sub: string; email: string } | null {
  return verifyAccessToken(token);
}

export async function getUserFromRequest(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const cookie = request.headers.get('cookie') || '';
    const cookies = parse(cookie);
    const token = cookies['auth_token'];
    
    if (!token) return null;
    
    const userPayload = verifyUserJWT(token);
    if (!userPayload || !userPayload.email) return null;
    
    // Check cache first
    const cached = userCache.get(userPayload.email);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return userPayload.email;
    }
    
    // Cache miss - verify user exists in database
    const user = await db.select({ id: users.id }).from(users).where(eq(users.email, userPayload.email)).limit(1);
    
    if (user.length > 0) {
      // Cache the result
      userCache.set(userPayload.email, { user: user[0], timestamp: Date.now() });
      return userPayload.email;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
}, CACHE_TTL);

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",
  database: drizzleAdapter(db, {
    provider: "pg", // PostgreSQL
  }),
  providers: [
    {
      type: "email-otp",
      apiKey: process.env.RESEND_API_KEY,
    },
    {
      type: "phone-otp",
      apiKey: process.env.TWILIO_AUTH_TOKEN,
    },
    {
      type: "oauth",
      id: "discord",
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    },
    // {
    //     type: "oauth",
    //     id: "apple",
    //     clientId: process.env.APPLE_CLIENT_ID!,
    //     clientSecret: process.env.APPLE_CLIENT_SECRET!,
    // },
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      // Handle OAuth sign-in
      if (account?.provider === "discord") {
        // Update user profile with OAuth data
        if (profile) {
          await db.update(users)
            .set({
              fullName: profile.name || profile.username || user.name || user.email?.split('@')[0] || 'User',
              avatar: profile.picture || profile.image || profile.avatar,
              isVerified: true,
              hasCompletedProfile: true,
            })
            .where(eq(users.id, user.id));
        }
      }
      return true;
    },
    async session({ session, user }: any) {
      // Add user data to session
      if (session.user) {
        session.user.id = user.id;
        session.user.email = user.email;
        session.user.name = user.name;
      }
      return session;
    },
  },
});
