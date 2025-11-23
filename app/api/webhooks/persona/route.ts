import { NextRequest, NextResponse } from 'next/server';
import { handlePersonaWebhook } from '@/lib/kyc/service';

const PERSONA_WEBHOOK_SECRET = process.env.PERSONA_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (PERSONA_WEBHOOK_SECRET) {
    const signature = request.headers.get('persona-signature');
    if (signature !== PERSONA_WEBHOOK_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const payload = await request.json();
    const status = await handlePersonaWebhook(payload);

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('[webhook] Persona error', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process webhook',
      },
      { status: 500 }
    );
  }
}

