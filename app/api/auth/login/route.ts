import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import twilio from 'twilio';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In-memory storage for OTPs (replace with database in production)
const otpStore = new Map<string, { otp: string; expires: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, phone, otp } = body;

    console.log('Login request:', { action, email, phone, otp: otp ? '***' : undefined });

    // Handle OTP requests
    if (action === 'request_email_otp') {
      if (!email) {
        return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
      }
      const generatedOtp = generateOtp();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
      otpStore.set(email, { otp: generatedOtp, expires });

      // Send OTP email using Resend
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
          to: email,
          subject: 'Login OTP - ChainFundIt',
          html: `
            <h2>Your Login OTP</h2>
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
          body: `Your ChainFundIt login verification code is: ${generatedOtp}. This code will expire in 10 minutes.`
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
      
      const storedData = otpStore.get(email);
      if (!storedData) {
        return NextResponse.json({ success: false, error: 'No OTP found for this email' }, { status: 400 });
      }
      
      if (Date.now() > storedData.expires) {
        otpStore.delete(email);
        return NextResponse.json({ success: false, error: 'OTP has expired' }, { status: 400 });
      }
      
      if (storedData.otp !== otp) {
        return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });
      }
      
      // OTP is valid - remove it from store
      otpStore.delete(email);
      
      // TODO: Create user session/token here
      return NextResponse.json({ success: true, message: 'Email OTP verified successfully' });
    }

    if (action === 'verify_phone_otp') {
      if (!phone || !otp) {
        return NextResponse.json({ success: false, error: 'Phone number and OTP are required' }, { status: 400 });
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
      
      // OTP is valid - remove it from store
      otpStore.delete(phone);
      
      // TODO: Create user session/token here
      return NextResponse.json({ success: true, message: 'Phone OTP verified successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 