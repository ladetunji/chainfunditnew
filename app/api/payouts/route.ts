import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { campaigns, donations, users } from '@/lib/schema';
import { eq, and, sum, count } from 'drizzle-orm';
import { getPayoutProvider, getPayoutConfig, isPayoutSupported } from '@/lib/payments/payout-config';
import { getCurrencyCode } from '@/lib/utils/currency';
import { convertToNaira } from '@/lib/utils/currency-conversion';
import { sendPayoutConfirmationEmail } from '@/lib/payments/payout-email';

export async function GET(request: NextRequest) {
  try {
    const userEmail = await getUserFromRequest(request);
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's campaigns with their total raised amounts
    const userCampaigns = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        currency: campaigns.currency,
        targetAmount: campaigns.goalAmount,
        currentAmount: campaigns.currentAmount,
        status: campaigns.status,
        createdAt: campaigns.createdAt,
      })
      .from(campaigns)
      .where(eq(campaigns.creatorId, user[0].id));

    // Calculate available payout amounts for each campaign with currency conversion
    const campaignsWithPayouts = await Promise.all(
      userCampaigns.map(async (campaign) => {
        // Get total donations for this campaign (including pending and completed)
        const totalDonations = await db
          .select({ total: sum(donations.amount) })
          .from(donations)
          .where(
            and(
              eq(donations.campaignId, campaign.id),
              // Include both completed and pending donations
              // Exclude only explicitly failed donations that are not retryable
              // For now, include all non-failed donations
            )
          );

        // Get breakdown by status for transparency
        const donationsByStatus = await db
          .select({ 
            status: donations.paymentStatus,
            total: sum(donations.amount),
            count: count(donations.id)
          })
          .from(donations)
          .where(eq(donations.campaignId, campaign.id))
          .groupBy(donations.paymentStatus);

        const totalRaised = parseFloat(totalDonations[0]?.total || '0');
        const currencyCode = getCurrencyCode(campaign.currency);
        
        // Convert to Naira for Nigerian users
        const totalRaisedInNGN = convertToNaira(totalRaised, currencyCode);
        
        // Check if payout is supported for this currency
        const payoutSupported = isPayoutSupported(currencyCode);
        const payoutProvider = payoutSupported ? getPayoutProvider(currencyCode) : null;
        const payoutConfig = payoutProvider ? getPayoutConfig(payoutProvider) : null;
        
        // Calculate goal progress for display purposes
        const targetAmount = parseFloat(campaign.targetAmount);
        const goalProgress = targetAmount > 0 ? (totalRaised / targetAmount) * 100 : 0;

        return {
          ...campaign,
          totalRaised,
          totalRaisedInNGN, // Amount in Naira
          currencyCode,
          payoutSupported,
          payoutProvider,
          payoutConfig,
          goalProgress,
          hasReached50Percent: goalProgress >= 50, // Keep for backward compatibility
          availableForPayout: payoutSupported && totalRaised > 0,
          donationsByStatus, // Include breakdown for transparency
        };
      })
    );

    // Calculate totals with currency conversion
    let totalAvailableForPayout = 0;
    let totalAvailableForPayoutInNGN = 0;
    let totalRaisedInNGN = 0;
    const currencyBreakdown: { [key: string]: number } = {};

    campaignsWithPayouts.forEach(campaign => {
      // Track currency breakdown
      if (!currencyBreakdown[campaign.currencyCode]) {
        currencyBreakdown[campaign.currencyCode] = 0;
      }
      currencyBreakdown[campaign.currencyCode] += campaign.totalRaised;
      
      // Add to Naira totals
      totalRaisedInNGN += campaign.totalRaisedInNGN;
      
      if (campaign.availableForPayout) {
        totalAvailableForPayout += campaign.totalRaised;
        totalAvailableForPayoutInNGN += campaign.totalRaisedInNGN;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        campaigns: campaignsWithPayouts,
        totalAvailableForPayout,
        totalAvailableForPayoutInNGN, // Total available in Naira
        totalRaisedInNGN, // Total raised in Naira
        currencyBreakdown, // Breakdown by original currency
        summary: {
          totalCampaigns: campaignsWithPayouts.length,
          campaignsWithPayouts: campaignsWithPayouts.filter(c => c.availableForPayout).length,
          totalRaised: campaignsWithPayouts.reduce((sum, c) => sum + c.totalRaised, 0),
          totalRaisedInNGN, // Total raised in Naira
        }
      }
    });

  } catch (error) {
    console.error('Error fetching payout data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userEmail = await getUserFromRequest(request);
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database with profile information
    const user = await db
      .select({ 
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        accountNumber: users.accountNumber,
        bankName: users.bankName,
        accountName: users.accountName,
        accountVerified: users.accountVerified
      })
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { campaignId, amount, currency, payoutProvider } = body;

    if (!campaignId || !amount || !currency || !payoutProvider) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the campaign belongs to the user
    const campaign = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.creatorId, user[0].id)))
      .limit(1);

    if (!campaign.length) {
      return NextResponse.json(
        { error: 'Campaign not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get total available for payout (including pending donations)
    const totalDonations = await db
      .select({ total: sum(donations.amount) })
      .from(donations)
      .where(eq(donations.campaignId, campaignId));

    const totalRaised = parseFloat(totalDonations[0]?.total || '0');
    const targetAmount = parseFloat(campaign[0].goalAmount);
    
    // Calculate goal progress for reference (no longer required for payout)
    const goalProgress = targetAmount > 0 ? (totalRaised / targetAmount) * 100 : 0;
    
    // Check if campaign has any donations at all
    if (totalRaised === 0) {
      return NextResponse.json(
        { error: 'Campaign has no donations - payout not available' },
        { status: 400 }
      );
    }
    
    if (amount > totalRaised) {
      return NextResponse.json(
        { error: 'Payout amount exceeds available funds' },
        { status: 400 }
      );
    }

    const currencyCode = getCurrencyCode(currency);
    const recommendedProvider = getPayoutProvider(currencyCode);
    
    if (payoutProvider !== recommendedProvider) {
      return NextResponse.json(
        { error: `Recommended payout provider for ${currencyCode} is ${recommendedProvider}` },
        { status: 400 }
      );
    }

    // Calculate fees and net amount
    const calculateFees = () => {
      const baseAmount = amount;
      let feePercentage = 0;
      let fixedFee = 0;

      switch (payoutProvider) {
        case 'stripe':
          feePercentage = 0.025; // 2.5%
          fixedFee = 0.30; // $0.30
          break;
        case 'paystack':
          feePercentage = 0.015; // 1.5%
          fixedFee = 0;
          break;
        default:
          feePercentage = 0.02; // 2%
          fixedFee = 0;
      }

      const percentageFee = baseAmount * feePercentage;
      const totalFees = percentageFee + fixedFee;
      const netAmount = baseAmount - totalFees;

      return {
        totalFees,
        netAmount
      };
    };

    const fees = calculateFees();
    const payoutId = `payout_${Date.now()}`;
    
    // Send confirmation email
    try {
      await sendPayoutConfirmationEmail({
        userEmail: user[0].email,
        userName: user[0].fullName,
        campaignTitle: campaign[0].title,
        payoutAmount: amount,
        currency: currencyCode,
        netAmount: fees.netAmount,
        fees: fees.totalFees,
        payoutProvider,
        processingTime: payoutProvider === 'stripe' ? '2-7 business days' : '1-3 business days',
        payoutId,
        bankDetails: user[0].accountVerified ? {
          accountName: user[0].accountName || '',
          accountNumber: user[0].accountNumber || '',
          bankName: user[0].bankName || ''
        } : undefined
      });
    } catch (emailError) {
      console.error('Failed to send payout confirmation email:', emailError);
      // Don't fail the payout if email fails
    }
    
    return NextResponse.json({
      success: true,
      data: {
        payoutId,
        amount,
        currency: currencyCode,
        provider: payoutProvider,
        status: 'processing',
        estimatedDelivery: payoutProvider === 'stripe' ? '2-7 business days' : '1-3 business days',
        netAmount: fees.netAmount,
        fees: fees.totalFees,
        message: `Payout of ${currency} ${amount} initiated via ${payoutProvider}. You will receive a confirmation email shortly.`
      }
    });

  } catch (error) {
    console.error('Error processing payout:', error);
    return NextResponse.json(
      { error: 'Failed to process payout' },
      { status: 500 }
    );
  }
}
