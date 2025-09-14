import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import twilio from 'twilio';
import { db } from '@/lib/db';
import { emailOtps } from '@/lib/schema/email-otps';
import { eq, and, desc, gt, lt } from 'drizzle-orm';
import { users } from '@/lib/schema/users';
import { generateUserJWT } from '@/lib/auth';

const resend = new Resend(process.env.RESEND_API_KEY);

// Cache for rate limiting and phone OTPs
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();
const otpStore = new Map<string, { otp: string; expires: number }>();

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
    const { action, email, phone, otp } = body;

    // Handle OTP requests
    if (action === 'request_email_otp') {
      if (!email) {
        return NextResponse.json({ success: false, error: 'Please enter your email address to continue.' }, { status: 400 });
      }

      // Rate limiting
      if (!checkRateLimit(`signin_email_${email}`)) {
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please wait a minute before trying again.' },
          { status: 429 }
        );
      }

      // Check if user exists with a single query
      const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (!existingUser.length) {
        return NextResponse.json({ success: false, error: 'No account found with this email. Please sign up first or check your email address.' }, { status: 404 });
      }

      const generatedOtp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Clean up expired OTPs first
      await db.delete(emailOtps).where(lt(emailOtps.expiresAt, new Date()));
      
      // Insert new OTP
      await db.insert(emailOtps).values({ email, otp: generatedOtp, expiresAt });

      // Send email asynchronously
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
        to: email,
        subject: 'Sign in OTP - ChainFundIt',
        html: `
          <h2>Your Sign in OTP</h2>
          <p>Your verification code is: <strong>${generatedOtp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `,
      }).catch(error => {
        console.error('Resend error:', error);
        // Don't fail the request if email fails
      });

      return NextResponse.json({ success: true, message: 'Email OTP sent successfully' });
    }

    if (action === 'request_phone_otp') {
      if (!phone) {
        return NextResponse.json({ success: false, error: 'Please enter your phone number to continue.' }, { status: 400 });
      }

      // Rate limiting
      if (!checkRateLimit(`signin_phone_${phone}`)) {
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please wait a minute before trying again.' },
          { status: 429 }
        );
      }

      // Check if user exists with a single query
      const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.phone, phone)).limit(1);
      if (!existingUser.length) {
        return NextResponse.json({ success: false, error: 'No account found with this phone number. Please sign up first or try a different number.' }, { status: 404 });
      }

      // Check if Twilio environment variables are set
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_FROM) {
        return NextResponse.json({ 
          success: false, 
          error: 'Phone verification is temporarily unavailable. Please use email instead or contact support.' 
        }, { status: 503 });
      }
      
      const generatedOtp = generateOtp();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
      otpStore.set(phone, { otp: generatedOtp, expires });
      
      // Try WhatsApp first, then fallback to SMS
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      try {
        // First attempt: Send via WhatsApp
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM,
          to: `whatsapp:${phone}`,
          body: `Your ChainFundIt sign in verification code is: ${generatedOtp}. This code will expire in 10 minutes.`
        });
        
        return NextResponse.json({ 
          success: true, 
          message: 'WhatsApp OTP sent successfully',
          method: 'whatsapp'
        });
        
      } catch (whatsappError) {
        console.error('WhatsApp failed, attempting SMS fallback:', whatsappError);
        
        try {
          if (!process.env.TWILIO_PHONE_NUMBER) {
            throw new Error('SMS fallback not configured');
          }
          
          await twilioClient.messages.create({
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone,
            body: `Your ChainFundIt sign in verification code is: ${generatedOtp}. This code will expire in 10 minutes.`
          });
          
          return NextResponse.json({ 
            success: true, 
            message: 'SMS OTP sent successfully (WhatsApp unavailable)',
            method: 'sms',
            fallback: true
          });
          
        } catch (smsError) {
          console.error('Both WhatsApp and SMS failed:', { whatsappError, smsError });
          otpStore.delete(phone);
          return NextResponse.json({ 
            success: false, 
            error: 'Unable to send verification code to your phone. Please check the number and try again.' 
          }, { status: 500 });
        }
      }
    }

    // Handle OTP verification
    if (action === 'verify_email_otp') {
      if (!email || !otp) {
        return NextResponse.json({ success: false, error: 'Please enter the 6-digit verification code.' }, { status: 400 });
      }

      // Rate limiting for verification
      if (!checkRateLimit(`verify_email_${email}`, 5, 300000)) {
        return NextResponse.json(
          { success: false, error: 'Too many verification attempts. Please wait 5 minutes before trying again.' },
          { status: 429 }
        );
      }

      const now = new Date();
      
      // Find and delete OTP in one operation
      const [record] = await db
        .delete(emailOtps)
        .where(and(eq(emailOtps.email, email), eq(emailOtps.otp, otp), gt(emailOtps.expiresAt, now)))
        .returning();

      const result = record;

      if (!result) {
        return NextResponse.json({ success: false, error: 'Verification code has expired or is invalid. Please request a new code.' }, { status: 400 });
      }

      // Get user details and create JWT token
      const [user] = await db
        .select({ id: users.id, email: users.email, fullName: users.fullName })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      // Generate JWT token
      const token = generateUserJWT({ id: user.id, email: user.email });

      // Create response with success message
      const response = NextResponse.json({ 
        success: true, 
        message: 'Email OTP verified successfully',
        user: { id: user.id, email: user.email, fullName: user.fullName }
      });

      // Set auth cookie
      response.cookies.set("auth_token", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 2, // 2 days
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      return response;
    }

    if (action === 'verify_phone_otp') {
      if (!phone || !otp || !email) {
        return NextResponse.json({ success: false, error: 'Please enter the 6-digit verification code.' }, { status: 400 });
      }

      // Rate limiting for verification
      if (!checkRateLimit(`verify_phone_${phone}`, 5, 300000)) {
        return NextResponse.json(
          { success: false, error: 'Too many verification attempts. Please wait 5 minutes before trying again.' },
          { status: 429 }
        );
      }

      const storedData = otpStore.get(phone);
      if (!storedData) {
        return NextResponse.json({ success: false, error: 'Verification code has expired or is invalid. Please request a new code.' }, { status: 400 });
      }
      if (Date.now() > storedData.expires) {
        otpStore.delete(phone);
        return NextResponse.json({ success: false, error: 'Verification code has expired. Please request a new code.' }, { status: 400 });
      }
      if (storedData.otp !== otp) {
        return NextResponse.json({ success: false, error: 'Incorrect verification code. Please check the code and try again.' }, { status: 400 });
      }
      otpStore.delete(phone);
      
      // Update user's phone in the database
      await db.update(users).set({ phone }).where(eq(users.email, email));
      
      // Get user details and create JWT token
      const [user] = await db
        .select({ id: users.id, email: users.email, fullName: users.fullName })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      // Generate JWT token
      const token = generateUserJWT({ id: user.id, email: user.email });

      // Create response with success message
      const response = NextResponse.json({ 
        success: true, 
        message: 'Phone OTP verified and user phone updated successfully',
        user: { id: user.id, email: user.email, fullName: user.fullName }
      });

      // Set auth cookie
      response.cookies.set("auth_token", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 2, // 2 days
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Sign in API error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
} 