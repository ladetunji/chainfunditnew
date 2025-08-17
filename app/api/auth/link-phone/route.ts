import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { db } from '@/lib/db';
import { users } from '@/lib/schema/users';
import { phoneOtps } from '@/lib/schema';
import { eq, and, desc, gt } from 'drizzle-orm';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phone, otp, email } = body;

    if (action === 'request_link_otp') {
      if (!phone) {
        return NextResponse.json({ success: false, error: 'Please enter your phone number to continue.' }, { status: 400 });
      }
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_FROM) {
        return NextResponse.json({ success: false, error: 'Phone verification is temporarily unavailable. Please contact support or try again later.' }, { status: 503 });
      }
      const generatedOtp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      // Store OTP in DB
      await db.insert(phoneOtps).values({ phone, otp: generatedOtp, expiresAt });
      try {
        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        // Log parameters for debugging
        console.log('Sending WhatsApp OTP:', {
          from: process.env.TWILIO_WHATSAPP_FROM,
          to: `whatsapp:${phone}`,
          body: `Your OTP code is: ${generatedOtp}`
        });
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM,
          to: `whatsapp:${phone}`,
          body: `Your OTP code is: ${generatedOtp}`
        });
        return NextResponse.json({ success: true, message: 'OTP sent to phone' });
      } catch (error) {
        console.error('Twilio error:', error);
        return NextResponse.json({ success: false, error: 'Unable to send verification code to your phone. Please check the number and try again.' }, { status: 500 });
      }
    }

    if (action === 'verify_link_otp') {
      if (!phone || !otp || !email) {
        return NextResponse.json({ success: false, error: 'Please enter the 6-digit verification code.' }, { status: 400 });
      }
      // Find the most recent, unexpired OTP for this phone
      const now = new Date();
      const [record] = await db.select().from(phoneOtps)
        .where(and(eq(phoneOtps.phone, phone), eq(phoneOtps.otp, otp), gt(phoneOtps.expiresAt, now)))
        .orderBy(desc(phoneOtps.createdAt))
        .limit(1);
      if (!record) {
        return NextResponse.json({ success: false, error: 'Verification code has expired or is invalid. Please request a new code.' }, { status: 400 });
      }
      // Invalidate OTP after use
      await db.delete(phoneOtps).where(eq(phoneOtps.id, record.id));
      // OTP is valid - link phone to user
      const result = await db.update(users)
        .set({ phone })
        .where(eq(users.email, email));
      if (result.rowCount === 0) {
        return NextResponse.json({ success: false, error: 'Account not found. Please sign in again.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Phone linked successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Link phone API error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
} 