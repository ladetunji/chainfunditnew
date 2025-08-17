import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import twilio from 'twilio';
import { db } from '@/lib/db';
import { emailOtps } from '@/lib/schema/email-otps';
import { eq, and, desc, gt } from 'drizzle-orm';
import { users } from '@/lib/schema/users';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In-memory storage for phone OTPs (for now)
const otpStore = new Map<string, { otp: string; expires: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, phone, otp } = body;

    // Handle OTP requests
    if (action === 'request_email_otp') {
      if (!email) {
        return NextResponse.json({ success: false, error: 'Please enter your email address to continue.' }, { status: 400 });
      }
      // Check if user exists
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!existingUser || existingUser.length === 0) {
        return NextResponse.json({ success: false, error: 'No account found with this email. Please sign up first or check your email address.' }, { status: 404 });
      }
      const generatedOtp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      // Store OTP in DB
      console.log('Inserting email OTP into DB:', { email, otp: generatedOtp, expiresAt });
      await db.insert(emailOtps).values({ email, otp: generatedOtp, expiresAt });
      console.log('Inserted email OTP into DB');
      // Send OTP email using Resend
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
          to: email,
          subject: 'Sign in OTP - ChainFundIt',
          html: `
            <h2>Your Sign in OTP</h2>
            <p>Your verification code is: <strong>${generatedOtp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          `,
        });
        return NextResponse.json({ success: true, message: 'Email OTP sent successfully' });
      } catch (error) {
        console.error('Resend error:', error);
        return NextResponse.json({ success: false, error: 'Unable to send verification code to your email. Please check your email address and try again.' }, { status: 500 });
      }
    }

    if (action === 'request_phone_otp') {
      if (!phone) {
        return NextResponse.json({ success: false, error: 'Please enter your phone number to continue.' }, { status: 400 });
      }
      // Check if user exists by phone
      const existingUser = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
      if (!existingUser || existingUser.length === 0) {
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
        console.log('Attempting WhatsApp OTP:', { phone, otp: generatedOtp });
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM,
          to: `whatsapp:${phone}`,
          body: `Your ChainFundIt sign in verification code is: ${generatedOtp}. This code will expire in 10 minutes.`
        });
        
        // WhatsApp succeeded
        return NextResponse.json({ 
          success: true, 
          message: 'WhatsApp OTP sent successfully',
          method: 'whatsapp'
        });
        
      } catch (whatsappError) {
        console.error('WhatsApp failed, attempting SMS fallback:', whatsappError);
        
        // WhatsApp failed, try SMS as fallback
        try {
          // Check if we have a regular Twilio phone number for SMS
          if (!process.env.TWILIO_PHONE_NUMBER) {
            throw new Error('SMS fallback not configured');
          }
          
          // Send via SMS
          await twilioClient.messages.create({
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone,
            body: `Your ChainFundIt sign in verification code is: ${generatedOtp}. This code will expire in 10 minutes.`
          });
          
          // SMS succeeded
          return NextResponse.json({ 
            success: true, 
            message: 'SMS OTP sent successfully (WhatsApp unavailable)',
            method: 'sms',
            fallback: true
          });
          
        } catch (smsError) {
          console.error('Both WhatsApp and SMS failed:', { whatsappError, smsError });
          
          // Both methods failed
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
      // Find the most recent, unexpired OTP for this email
      const now = new Date();
      console.log('Selecting email OTP from DB:', { email, otp });
      const [record] = await db.select().from(emailOtps)
        .where(and(eq(emailOtps.email, email), eq(emailOtps.otp, otp), gt(emailOtps.expiresAt, now)))
        .orderBy(desc(emailOtps.createdAt))
        .limit(1);
      console.log('Selected email OTP record:', record);
      if (!record) {
        return NextResponse.json({ success: false, error: 'Verification code has expired or is invalid. Please request a new code.' }, { status: 400 });
      }
      // Optionally, delete or invalidate the OTP after use
      console.log('Deleting email OTP from DB:', record.id);
      await db.delete(emailOtps).where(eq(emailOtps.id, record.id));
      console.log('Deleted email OTP from DB');
      // TODO: Create user session/token here
      return NextResponse.json({ success: true, message: 'Email OTP verified successfully' });
    }

    if (action === 'verify_phone_otp') {
      if (!phone || !otp || !email) {
        return NextResponse.json({ success: false, error: 'Please enter the 6-digit verification code.' }, { status: 400 });
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
      console.log('Updating user phone in DB:', { email, phone });
      const updateResult = await db.update(users).set({ phone }).where(eq(users.email, email));
      console.log('User phone update result:', updateResult);
      // TODO: Create user session/token here if needed
      return NextResponse.json({ success: true, message: 'Phone OTP verified and user phone updated successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Sign in API error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
} 