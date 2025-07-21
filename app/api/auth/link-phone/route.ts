import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { db } from '@/lib/db';
import { users } from '@/lib/schema/users';
import { eq } from 'drizzle-orm';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In-memory OTP store (replace with persistent store in production)
const otpStore = new Map<string, { otp: string; expires: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phone, otp, email } = body;

    if (action === 'request_link_otp') {
      if (!phone) {
        return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
      }
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_FROM) {
        return NextResponse.json({ success: false, error: 'WhatsApp OTP service not configured.' }, { status: 503 });
      }
      const generatedOtp = generateOtp();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
      otpStore.set(phone, { otp: generatedOtp, expires });
      try {
        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM,
          to: `whatsapp:${phone}`,
          contentSid: 'HX229f5a04fd0510ce1b071852155d3e75',
          contentVariables: JSON.stringify({ '1': generatedOtp })
        });
        return NextResponse.json({ success: true, message: 'OTP sent to phone' });
      } catch (error) {
        console.error('Twilio error:', error);
        return NextResponse.json({ success: false, error: 'Failed to send WhatsApp OTP' }, { status: 500 });
      }
    }

    if (action === 'verify_link_otp') {
      if (!phone || !otp || !email) {
        return NextResponse.json({ success: false, error: 'Phone, OTP, and email are required' }, { status: 400 });
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
      // OTP is valid - link phone to user
      otpStore.delete(phone);
      const result = await db.update(users)
        .set({ phone })
        .where(eq(users.email, email));
      if (result.rowCount === 0) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Phone linked successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Link phone API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 