import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import twilio from 'twilio';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, phone } = body;

    console.log('Signup request:', { action, email, phone });

    if (action === 'request_email_otp') {
      if (!email) {
        return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
      }
      const otp = generateOtp();
      // Send OTP email using Resend
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'no-reply@yourdomain.com',
          to: email,
          subject: 'Your Chainfundit OTP Code',
          text: `Your OTP code is: ${otp}`,
        });
      } catch (err) {
        return NextResponse.json({ success: false, error: 'Failed to send OTP email' }, { status: 500 });
      }
      // For testing, return the OTP (do not do this in production)
      return NextResponse.json({ success: true, message: 'Email OTP sent', otp });
    }

    if (action === 'request_phone_otp') {
      console.log('Processing phone OTP request');
      
      if (!phone) {
        return NextResponse.json({ success: false, error: 'Phone is required' }, { status: 400 });
      }
      
      // Check if Twilio environment variables are present
      console.log('Checking Twilio env vars:', {
        hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
        hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN
      });
      
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.log('Twilio environment variables missing');
        return NextResponse.json({ 
          success: false, 
          error: 'WhatsApp service not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.' 
        }, { status: 500 });
      }

      console.log('Initializing Twilio client');
      // Initialize Twilio client only when needed
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

      const otp = generateOtp();
      try {
        // Send WhatsApp message using Twilio
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM, // e.g., 'whatsapp:+14155238886'
          to: `whatsapp:${phone}`, // Add whatsapp: prefix to the phone number
          body: `Your Chainfundit OTP code is: ${otp}`,
        });
      } catch (err) {
        console.error('WhatsApp OTP error:', err);
        return NextResponse.json({ success: false, error: 'Failed to send WhatsApp OTP' }, { status: 500 });
      }
      // For testing, return the OTP (do not do this in production)
      return NextResponse.json({ success: true, message: 'WhatsApp OTP sent', otp });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 