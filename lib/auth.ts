import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { parse } from "cookie";

// Simple in-memory cache for user lookups
const userCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function generateUserJWT(user: { id: string; email: string }) {
  const secret = process.env.JWT_SECRET || "dev_secret";
  return jwt.sign({ sub: user.id, email: user.email }, secret, {
    expiresIn: "2d",
  });
}

export function verifyUserJWT(token: string): { sub: string; email: string } | null {
  const secret = process.env.JWT_SECRET || "dev_secret";
  try {
    return jwt.verify(token, secret) as { sub: string; email: string };
  } catch {
    return null;
  }
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
