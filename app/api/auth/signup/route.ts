import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { emailOtps } from "@/lib/schema/email-otps";
import { users } from "@/lib/schema/users";
import { eq, and, desc, gt } from "drizzle-orm";
import { generateUserJWT } from "@/lib/auth";

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, otp, fullName } = body;

    if (action === "request_email_otp") {
      if (!email) {
        return NextResponse.json(
          { success: false, error: "Email is required" },
          { status: 400 }
        );
      }
      const generatedOtp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await db
        .insert(emailOtps)
        .values({ email, otp: generatedOtp, expiresAt });
      console.log("Inserted email OTP record");
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "noreply@example.com",
          to: email,
          subject: "Signup OTP - ChainFundIt",
          html: `
            <h2>Your Signup OTP</h2>
            <p>Your verification code is: <strong>${generatedOtp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          `,
        });
        console.log("Email OTP sent successfully");
        return NextResponse.json({
          success: true,
          message: "Email OTP sent successfully",
        });
      } catch (error) {
        console.error("Resend error:", error);
        return NextResponse.json(
          { success: false, error: "Failed to send email OTP" },
          { status: 500 }
        );
      }
    }

    if (action === "verify_email_otp") {
      if (!email || !otp) {
        return NextResponse.json(
          { success: false, error: "Email and OTP are required" },
          { status: 400 }
        );
      }
      const now = new Date();
      const [record] = await db
        .select()
        .from(emailOtps)
        .where(
          and(
            eq(emailOtps.email, email),
            eq(emailOtps.otp, otp),
            gt(emailOtps.expiresAt, now)
          )
        )
        .orderBy(desc(emailOtps.createdAt))
        .limit(1);
      console.log("Fetched OTP record for verification");
      if (!record) {
        return NextResponse.json(
          {
            success: false,
            error: "No OTP found for this email or OTP expired/invalid",
          },
          { status: 400 }
        );
      }
      // Invalidate OTP
      await db.delete(emailOtps).where(eq(emailOtps.id, record.id));
      console.log("Invalidated OTP record");
      // Check if user exists
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (user) {
        return NextResponse.json(
          { success: false, error: "User already exists. Please log in." },
          { status: 409 }
        );
      }
      // Create user (require fullName, or use email as fallback)
      const name = fullName || email.split("@")[0];
      await db.insert(users).values({ email, fullName: name, hasCompletedProfile: false });
      console.log("Created new user record");
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      // Generate JWT and set as cookie
      const token = generateUserJWT({ id: user.id, email: user.email });
      const response = NextResponse.json({
        success: true,
        message: "Signup complete. User created and verified.",
        user,
        token,
      });
      response.cookies.set("auth_token", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      return response;
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Signup API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
