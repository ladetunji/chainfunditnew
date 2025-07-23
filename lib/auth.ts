import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
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
  secret: process.env.BETTER_AUTH_SECRET,
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
      id: "facebook",
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    },
    // {
    //     type: "oauth",
    //     id: "apple",
    //     clientId: process.env.APPLE_CLIENT_ID!,
    //     clientSecret: process.env.APPLE_CLIENT_SECRET!,
    // },
  ],
});
