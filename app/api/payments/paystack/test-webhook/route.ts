import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { eq } from 'drizzle-orm';
import { toast } from 'sonner';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract donation ID from metadata
    const donationId = body.metadata?.donationId;
    const reference = body.reference;
    
    if (!donationId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No donation ID in metadata' 
      }, { status: 400 });
    }

    // Check if donation exists
    const donation = await db
      .select()
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);

    if (!donation.length) {
      return NextResponse.json({ 
        success: false, 
        error: 'Donation not found' 
      }, { status: 404 });
    }

    // Update donation status
    const updateResult = await db
      .update(donations)
      .set({
        paymentStatus: 'completed',
        processedAt: new Date(),
        lastStatusUpdate: new Date(),
        providerStatus: 'success',
        providerError: null,
        paymentIntentId: reference,
      })
      .where(eq(donations.id, donationId))
      .returning();

    return NextResponse.json({ 
      success: true, 
      donation: updateResult[0],
      message: 'Test webhook processed successfully' 
    });

  } catch (error) {
    toast.error('Test webhook error: ' + error);
    return NextResponse.json(
      { success: false, error: 'Test webhook failed: ' + error },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Paystack test webhook endpoint',
    usage: 'POST with webhook payload to test donation processing'
  });
}
