import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { campaigns, donations, users, chainers, campaignPayouts } from '@/lib/schema';
import { eq, and, sum, count, inArray, isNotNull } from 'drizzle-orm';
import { getPayoutProvider, getPayoutConfig, isPayoutSupported } from '@/lib/payments/payout-config';
import { getCurrencyCode } from '@/lib/utils/currency';
import { convertToNaira } from '@/lib/utils/currency-conversion';
import { sendPayoutConfirmationEmail } from '@/lib/payments/payout-email';
import { notifyPayoutRequest } from '@/lib/notifications/payout-request-alerts';

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

    // Get chainer donations for user's campaigns (donations that came through chainers to user's campaigns)
    const campaignIds = userCampaigns.map(c => c.id);
    const userChainerDonations = campaignIds.length > 0 ? await db
      .select({
        id: donations.id,
        amount: donations.amount,
        currency: donations.currency,
        paymentStatus: donations.paymentStatus,
        campaignId: donations.campaignId,
        campaignTitle: campaigns.title,
        campaignCurrency: campaigns.currency,
        createdAt: donations.createdAt,
        chainerId: donations.chainerId,
        chainerCommissionEarned: chainers.commissionEarned,
      })
      .from(donations)
      .leftJoin(campaigns, eq(donations.campaignId, campaigns.id))
      .leftJoin(chainers, eq(donations.chainerId, chainers.id))
      .where(and(
        inArray(donations.campaignId, campaignIds),
        eq(donations.paymentStatus, 'completed'),
        isNotNull(donations.chainerId) // Only donations that came through chainers
      )) : [];

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

    // Calculate chainer donations summary
    const chainerDonationsTotal = userChainerDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const chainerDonationsInNGN = userChainerDonations.reduce((sum, d) => {
      const currencyCode = getCurrencyCode(d.currency);
      return sum + convertToNaira(parseFloat(d.amount), currencyCode);
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        campaigns: campaignsWithPayouts,
        chainerDonations: userChainerDonations,
        totalAvailableForPayout,
        totalAvailableForPayoutInNGN, // Total available in Naira
        totalRaisedInNGN, // Total raised in Naira
        chainerDonationsTotal,
        chainerDonationsInNGN, // Chainer donations in Naira
        currencyBreakdown, // Breakdown by original currency
        summary: {
          totalCampaigns: campaignsWithPayouts.length,
          campaignsWithPayouts: campaignsWithPayouts.filter(c => c.availableForPayout).length,
          totalRaised: campaignsWithPayouts.reduce((sum, c) => sum + c.totalRaised, 0),
          totalRaisedInNGN, // Total raised in Naira
          chainerDonationsCount: userChainerDonations.length,
          chainerDonationsTotal,
          chainerDonationsInNGN,
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
        bankCode: users.bankCode,
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
    const reference = `CP-${Date.now()}-${campaign[0].id.substring(0, 8)}`;
    
    console.log('Processing payout request:', {
      userId: user[0].id,
      campaignId: campaign[0].id,
      amount,
      currency: currencyCode,
      payoutProvider
    });
    
    // Get bank name - use stored value or fallback
    let bankName = user[0].bankName || '';
    if (!bankName && user[0].bankCode) {
      bankName = 'Bank (Code: ' + user[0].bankCode + ')';
    }

    // Save payout request to database FIRST (before sending notifications)
    let savedPayout;
    try {
      const [payout] = await db
        .insert(campaignPayouts)
        .values({
          userId: user[0].id,
          campaignId: campaign[0].id,
          requestedAmount: amount.toString(),
          grossAmount: amount.toString(),
          fees: fees.totalFees.toString(),
          netAmount: fees.netAmount.toString(),
          currency: currencyCode,
          status: 'pending',
          payoutProvider,
          reference,
          bankName: user[0].bankName || null,
          accountNumber: user[0].accountNumber || null,
          accountName: user[0].accountName || null,
          bankCode: user[0].bankCode || null,
        })
        .returning();

      savedPayout = payout;
      console.log('✅ Payout request saved to database:', savedPayout.id);
    } catch (dbError) {
      console.error('❌ Failed to save payout request to database:', dbError);
      return NextResponse.json(
        { error: 'Failed to save payout request' },
        { status: 500 }
      );
    }
    
    // Send confirmation email 
    try {
      const emailPromise = sendPayoutConfirmationEmail({
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
          bankName: bankName
        } : undefined
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email timeout')), 10000)
      );

      await Promise.race([emailPromise, timeoutPromise]);
    } catch (emailError) {
      console.error('Failed to send payout confirmation email:', emailError);
    }

    // Send admin notification 
    try {
      console.log('Sending admin notification for payout request...');
      
      const notificationPromise = notifyPayoutRequest({
        userId: user[0].id,
        userEmail: user[0].email,
        userName: user[0].fullName,
        campaignId: campaign[0].id,
        campaignTitle: campaign[0].title,
        amount,
        currency: currencyCode,
        payoutId: savedPayout.id, // Use database ID instead of timestamp-based ID
        requestDate: new Date(),
        bankDetails: user[0].accountVerified ? {
          accountName: user[0].accountName || '',
          accountNumber: user[0].accountNumber || '',
          bankName: bankName
        } : undefined
      });

      // Increased timeout to 15 seconds for notification processing
      const notificationTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Notification timeout after 15 seconds')), 15000)
      );

      await Promise.race([notificationPromise, notificationTimeoutPromise]);
      console.log('✅ Admin notification sent successfully');
    } catch (notificationError) {
      console.error('❌ Failed to send admin notification:', notificationError);
      // Log detailed error information
      if (notificationError instanceof Error) {
        console.error('Notification error details:', {
          message: notificationError.message,
          stack: notificationError.stack
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        payoutId: savedPayout.id,
        payoutReference: savedPayout.reference,
        amount,
        currency: currencyCode,
        provider: payoutProvider,
        status: savedPayout.status,
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
