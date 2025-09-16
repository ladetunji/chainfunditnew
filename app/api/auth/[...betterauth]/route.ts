import { betterAuth } from "better-auth";

const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: "select_account", // optional
      accessType: "offline",    // optional
    },
  },
});

export const GET = auth.handler;
export const POST = auth.handler;