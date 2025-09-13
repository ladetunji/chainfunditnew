import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/schema';

export async function GET() {
  try {
    // Try to count campaigns
    const result = await db.select({ count: campaigns.id }).from(campaigns);
    const count = result.length;
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      campaignsCount: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
