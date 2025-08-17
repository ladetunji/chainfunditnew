import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

export function generateUserJWT(user: { id: string; email: string }) {
  const secret = process.env.JWT_SECRET || "dev_secret";
  return jwt.sign({ sub: user.id, email: user.email }, secret, {
    expiresIn: "7d",
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
      id: "google",
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
      if (account?.provider === "google" || account?.provider === "discord") {
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
