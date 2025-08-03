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
        return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
      }
      // Check if user exists
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!existingUser || existingUser.length === 0) {
        return NextResponse.json({ success: false, error: 'No account found with this email. Please sign up first.' }, { status: 404 });
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
        return NextResponse.json({ success: false, error: 'Failed to send email OTP' }, { status: 500 });
      }
    }

    if (action === 'request_phone_otp') {
      if (!phone) {
        return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
      }
      // Check if user exists by phone
      const existingUser = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
      if (!existingUser || existingUser.length === 0) {
        return NextResponse.json({ success: false, error: 'No account found with this phone number. Please sign up first.' }, { status: 404 });
      }
      // Check if Twilio environment variables are set
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_FROM) {
        return NextResponse.json({ 
          success: false, 
          error: 'WhatsApp OTP service not configured. Please contact support.' 
        }, { status: 503 });
      }
      const generatedOtp = generateOtp();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
      otpStore.set(phone, { otp: generatedOtp, expires });
      // Send OTP via WhatsApp using Twilio
      try {
        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM,
          to: `whatsapp:${phone}`,
          body: `Your ChainFundIt sign in verification code is: ${generatedOtp}. This code will expire in 10 minutes.`
        });
        return NextResponse.json({ success: true, message: 'WhatsApp OTP sent successfully' });
      } catch (error) {
        console.error('Twilio error:', error);
        return NextResponse.json({ success: false, error: 'Failed to send WhatsApp OTP' }, { status: 500 });
      }
    }

    // Handle OTP verification
    if (action === 'verify_email_otp') {
      if (!email || !otp) {
        return NextResponse.json({ success: false, error: 'Email and OTP are required' }, { status: 400 });
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
        return NextResponse.json({ success: false, error: 'No OTP found for this email or OTP expired/invalid' }, { status: 400 });
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
        return NextResponse.json({ success: false, error: 'Phone number, email, and OTP are required' }, { status: 400 });
      }
      const storedData = otpStore.get(phone);
      if (!storedData) {
        return NextResponse.json({ success: false, error: 'No OTP found for this phone number' }, { status: 400 });
      }
      if (Date.now() > storedData.expires) {
        otpStore.delete(phone);
        return NextResponse.json({ success: false, error: 'OTP has expired' }, { status: 400 });
      }
      if (storedData.otp !== otp) {
        return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });
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
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 