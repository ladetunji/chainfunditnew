import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema/users';
import { eq } from 'drizzle-orm';
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

// POST /api/account/verify - Verify account details using Paystack
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

    // Get user
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userId = user[0].id;

    // Check if account is already locked (can't be changed)
    if (user[0].accountLocked) {
      return NextResponse.json(
        { success: false, error: 'Account details are locked. Contact admin to make changes.' },
        { status: 400 }
      );
    }

    // Verify account with Paystack
    const verificationResult = await verifyAccountWithPaystack(accountNumber, bankCode);
    
    if (!verificationResult.success) {
      return NextResponse.json(
        { success: false, error: verificationResult.error || 'Account verification failed' },
        { status: 400 }
      );
    }

    // Update user account details
    await db
      .update(users)
      .set({
        accountNumber,
        bankCode,
        bankName: verificationResult.data!.bank_name,
        accountName: verificationResult.data!.account_name,
        accountVerified: true,
        accountVerificationDate: new Date(),
        accountLocked: true, // Lock the account after successful verification
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: 'Account verified and saved successfully',
      data: {
        accountNumber,
        bankCode,
        bankName: verificationResult.data!.bank_name,
        accountName: verificationResult.data!.account_name,
        verified: true,
      },
    });
  } catch (error) {
    console.error('Account verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/account/verify - Get current account details
export async function GET(request: NextRequest) {
  try {
    const email = await getUserFromRequest(request);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Get user
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userData = user[0];


    return NextResponse.json({
      success: true,
      data: {
        accountNumber: userData.accountNumber,
        bankCode: userData.bankCode,
        bankName: userData.bankName,
        accountName: userData.accountName,
        accountVerified: userData.accountVerified,
        accountVerificationDate: userData.accountVerificationDate,
        accountLocked: userData.accountLocked,
        accountChangeRequested: userData.accountChangeRequested,
        accountChangeReason: userData.accountChangeReason,
      },
    });
  } catch (error) {
    console.error('Get account details error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/account/verify/request-change - Request account change
export async function PUT(request: NextRequest) {
  try {
    const email = await getUserFromRequest(request);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Please provide a detailed reason for the account change (minimum 10 characters)' },
        { status: 400 }
      );
    }

    // Get user
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Update user to request account change
    await db
      .update(users)
      .set({
        accountChangeRequested: true,
        accountChangeReason: reason.trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.email, email));

    return NextResponse.json({
      success: true,
      message: 'Account change request submitted successfully. Our admin team will review your request.',
    });
  } catch (error) {
    console.error('Request account change error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to verify account with Paystack
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
