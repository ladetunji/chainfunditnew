import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // PostgreSQL
    }),
    providers: [
        {
            type: "email-otp",
            // You may need to configure your email provider here
            // Example: service: 'resend', apiKey: process.env.RESEND_API_KEY
        },
        {
            type: "phone-otp",
            // You may need to configure your SMS provider here
            // Example: service: 'twilio', apiKey: process.env.TWILIO_API_KEY
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