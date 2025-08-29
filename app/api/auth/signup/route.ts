import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { emailOtps } from "@/lib/schema/email-otps";
import { users } from "@/lib/schema/users";
import { eq, and, desc, gt, lt } from "drizzle-orm";
import { generateUserJWT } from "@/lib/auth";

const resend = new Resend(process.env.RESEND_API_KEY);

// Cache for rate limiting
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Rate limiting function
function checkRateLimit(identifier: string, limit: number = 3, windowMs: number = 60000): boolean {
  const now = Date.now();
  const cached = rateLimitCache.get(identifier);
  
  if (!cached || now > cached.resetTime) {
    rateLimitCache.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (cached.count >= limit) {
    return false;
  }
  
  cached.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, otp, fullName } = body;

    if (action === "request_email_otp") {
      if (!email) {
        return NextResponse.json(
          { success: false, error: "Please enter your email address to continue." },
          { status: 400 }
        );
      }

      // Rate limiting
      if (!checkRateLimit(`signup_${email}`)) {
        return NextResponse.json(
          { success: false, error: "Too many requests. Please wait a minute before trying again." },
          { status: 429 }
        );
      }

      const generatedOtp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Clean up expired OTPs first
      await db.delete(emailOtps).where(lt(emailOtps.expiresAt, new Date()));
      
      // Insert new OTP
      await db.insert(emailOtps).values({ email, otp: generatedOtp, expiresAt });

      // Send email asynchronously (don't wait for it)
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "noreply@example.com",
        to: email,
        subject: "Signup OTP - ChainFundIt",
        html: `
          <h2>Your Signup OTP</h2>
          <p>Your verification code is: <strong>${generatedOtp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `,
      }).catch(error => {
        console.error("Resend error:", error);
        // Don't fail the request if email fails
      });

      return NextResponse.json({
        success: true,
        message: "Email OTP sent successfully",
      });
    }

    if (action === "verify_email_otp") {
      if (!email || !otp) {
        return NextResponse.json(
          { success: false, error: "Please enter the 6-digit verification code." },
          { status: 400 }
        );
      }

      // Rate limiting for verification
      if (!checkRateLimit(`verify_${email}`, 5, 300000)) { // 5 attempts per 5 minutes
        return NextResponse.json(
          { success: false, error: "Too many verification attempts. Please wait 5 minutes before trying again." },
          { status: 429 }
        );
      }

      const now = new Date();
      
      // Find and delete OTP in one operation
      const [record] = await db
        .delete(emailOtps)
        .where(
          and(
            eq(emailOtps.email, email),
            eq(emailOtps.otp, otp),
            gt(emailOtps.expiresAt, now)
          )
        )
        .returning();

      if (!record) {
        return NextResponse.json(
          {
            success: false,
            error: "Verification code has expired or is invalid. Please request a new code.",
          },
          { status: 400 }
        );
      }

      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists. Please sign in instead." },
          { status: 409 }
        );
      }

      // Create user
      const name = fullName || email.split("@")[0];
      const [newUser] = await db
        .insert(users)
        .values({ email, fullName: name, hasCompletedProfile: false })
        .returning();

      const result = { user: newUser };

      if (!result) {
        return NextResponse.json(
          {
            success: false,
            error: "Verification code has expired or is invalid. Please request a new code.",
          },
          { status: 400 }
        );
      }

      // Generate JWT and set as cookie
      const token = generateUserJWT({ id: result.user.id, email: result.user.email });
      const response = NextResponse.json({
        success: true,
        message: "Signup complete. User created and verified.",
        user: result.user,
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
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
