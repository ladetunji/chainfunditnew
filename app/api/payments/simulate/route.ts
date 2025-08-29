import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { donationId, success = true } = body;

    if (!donationId) {
      return NextResponse.json(
        { success: false, error: 'Missing donation ID' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const userPayload = await auth.api.getSession({ headers: request.headers });
    if (!userPayload?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get donation
    const donation = await db
      .select()
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);

    if (!donation.length) {
      return NextResponse.json(
        { success: false, error: 'Donation not found' },
        { status: 404 }
      );
    }

    // Update donation status based on simulation result
    const newStatus = success ? 'completed' : 'failed';
    const processedAt = success ? new Date() : null;

    await db
      .update(donations)
      .set({ 
        paymentStatus: newStatus,
        processedAt,
      })
      .where(eq(donations.id, donationId));

    return NextResponse.json({
      success: true,
      donationId,
      status: newStatus,
      message: success ? 'Payment simulated successfully' : 'Payment simulation failed',
    });

  } catch (error) {
    console.error('Error simulating payment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
