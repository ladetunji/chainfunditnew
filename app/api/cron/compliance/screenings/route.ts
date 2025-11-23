import { NextRequest, NextResponse } from 'next/server';
import { processPendingScreenings } from '@/lib/compliance/screening-service';

function isAuthorized(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json().catch(() => ({}));
    const limit = Number(payload?.limit ?? 5);

    const result = await processPendingScreenings(limit);

    return NextResponse.json({
      success: true,
      processed: result.completed,
      failed: result.failed,
      claimed: result.claimed,
      results: result.results,
    });
  } catch (error) {
    console.error('[cron] compliance screening failed', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process compliance screenings',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    message: 'Compliance screening cron alive',
    note: 'Invoke POST to process queued screenings',
  });
}

