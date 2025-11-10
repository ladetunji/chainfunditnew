import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAccessToken } from '@/lib/auth';

async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const userPayload = verifyAccessToken(token);
    if (!userPayload) return null;

    return userPayload.email;
  } catch {
    return null;
  }
}

// GET /api/account/international - Get international bank account details
export async function GET(request: NextRequest) {
  try {
    const email = await getUserFromRequest(request);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const [user] = await db
      .select({
        internationalBankAccountNumber: users.internationalBankAccountNumber,
        internationalBankRoutingNumber: users.internationalBankRoutingNumber,
        internationalBankSwiftBic: users.internationalBankSwiftBic,
        internationalBankCountry: users.internationalBankCountry,
        internationalBankName: users.internationalBankName,
        internationalAccountName: users.internationalAccountName,
        internationalAccountVerified: users.internationalAccountVerified,
        internationalAccountVerificationDate: users.internationalAccountVerificationDate,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching international bank account:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/account/international - Add/update international bank account details
export async function POST(request: NextRequest) {
  try {
    const email = await getUserFromRequest(request);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const {
      accountNumber,
      routingNumber,
      sortCode,
      iban,
      swiftBic,
      country,
      bankName,
      accountName,
    } = body;

    // Validate required fields
    if (!accountNumber || !country || !accountName) {
      return NextResponse.json(
        { success: false, error: 'Account number, country, and account name are required' },
        { status: 400 }
      );
    }

    // Validate country-specific requirements
    if (country === 'US' && !routingNumber) {
      return NextResponse.json(
        { success: false, error: 'Routing number is required for US accounts' },
        { status: 400 }
      );
    }

    if (country === 'GB' && !sortCode) {
      return NextResponse.json(
        { success: false, error: 'Sort code is required for UK accounts' },
        { status: 400 }
      );
    }

    // Get user
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Update international bank account details
    // Note: In production, you might want to verify the bank account with Stripe or another service
    await db
      .update(users)
      .set({
        internationalBankAccountNumber: accountNumber,
        internationalBankRoutingNumber: routingNumber || null,
        internationalBankSwiftBic: swiftBic || null,
        internationalBankCountry: country,
        internationalBankName: bankName || null,
        internationalAccountName: accountName,
        // Mark as verified (in production, you'd verify with Stripe first)
        internationalAccountVerified: true,
        internationalAccountVerificationDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: 'International bank account details saved successfully',
      data: {
        accountNumber,
        routingNumber: routingNumber || null,
        sortCode: sortCode || null,
        iban: iban || null,
        swiftBic: swiftBic || null,
        country,
        bankName: bankName || null,
        accountName,
        verified: true,
      },
    });
  } catch (error) {
    console.error('Error saving international bank account:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

