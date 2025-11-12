import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to verify payout API is working
 * GET /api/payouts/test
 */
export async function GET(request: NextRequest) {
  try {
    
    // Test basic functionality
    const testData = {
      message: 'Payout API is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      resendConfigured: !!process.env.RESEND_API_KEY,
    };

    return NextResponse.json({
      success: true,
      data: testData
    });
  } catch (error) {
    console.error('Payout test error:', error);
    return NextResponse.json(
      { success: false, error: 'Test failed' },
      { status: 500 }
    );
  }
}

