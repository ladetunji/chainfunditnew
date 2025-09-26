import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'cookie';
import { verifyUserJWT } from '@/lib/auth';

async function getUserFromRequest(request: NextRequest) {
  const cookie = request.headers.get('cookie') || '';
  const cookies = parse(cookie);
  const token = cookies['auth_token'];
  if (!token) return null;
  const userPayload = verifyUserJWT(token);
  if (!userPayload || !userPayload.email) return null;
  return userPayload.email;
}

// Helper function to verify account with Paystack (preview only)
async function verifyAccountWithPaystack(accountNumber: string, bankCode: string) {
  try {
    const url = new URL('https://api.paystack.co/bank/resolve');
    url.searchParams.append('account_number', accountNumber);
    url.searchParams.append('bank_code', bankCode);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Account verification failed',
      };
    }

    return {
      success: true,
      data: {
        account_number: data.data.account_number,
        account_name: data.data.account_name,
        bank_id: data.data.bank_id,
        bank_name: data.data.bank_name,
      },
    };
  } catch (error) {
    console.error('Paystack verification error:', error);
    return {
      success: false,
      error: 'Failed to verify account with bank',
    };
  }
}

// POST /api/account/verify/preview - Preview account verification without saving
export async function POST(request: NextRequest) {
  try {
    const email = await getUserFromRequest(request);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { accountNumber, bankCode } = body;

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { success: false, error: 'Account number and bank code are required' },
        { status: 400 }
      );
    }

    // Verify account with Paystack (preview only - don't save)
    const verificationResult = await verifyAccountWithPaystack(accountNumber, bankCode);
    
    if (!verificationResult.success) {
      return NextResponse.json(
        { success: false, error: verificationResult.error || 'Account verification failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account details verified successfully',
      data: {
        account_number: verificationResult.data!.account_number,
        account_name: verificationResult.data!.account_name,
        bank_id: verificationResult.data!.bank_id,
        bank_name: verificationResult.data!.bank_name,
      },
    });
  } catch (error) {
    console.error('Account preview verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}