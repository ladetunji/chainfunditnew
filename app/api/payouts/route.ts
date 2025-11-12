import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { db, withRetry } from "@/lib/db";
import {
  campaigns,
  donations,
  users,
  chainers,
  campaignPayouts,
} from "@/lib/schema";
import { eq, and, inArray, isNotNull } from "drizzle-orm";
import {
  getPayoutProvider,
  getPayoutConfig,
  isPayoutSupported,
} from "@/lib/payments/payout-config";
import { getCurrencyCode } from "@/lib/utils/currency";
import {
  convertToNaira,
  convertFromNaira,
} from "@/lib/utils/currency-conversion";
import { notifyPayoutRequest } from "@/lib/notifications/payout-request-alerts";

// Fetch payout dashboard data for user
export async function GET(request: NextRequest) {
  try {
    const userEmail = await getUserFromRequest(request);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userCampaigns = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        currency: campaigns.currency,
        goalAmount: campaigns.goalAmount,
        currentAmount: campaigns.currentAmount,
        status: campaigns.status,
        createdAt: campaigns.createdAt,
      })
      .from(campaigns)
      .where(eq(campaigns.creatorId, user.id));

    if (!userCampaigns.length) {
      return NextResponse.json({
        success: true,
        data: { campaigns: [], totalAvailableForPayout: 0 },
      });
    }

    const campaignIds = userCampaigns.map((c) => c.id);

    const userDonations =
      campaignIds.length > 0
        ? await db
            .select({
              id: donations.id,
              amount: donations.amount,
              currency: donations.currency,
              paymentStatus: donations.paymentStatus,
              campaignId: donations.campaignId,
              chainerId: donations.chainerId,
              createdAt: donations.createdAt,
            })
            .from(donations)
            .where(
              and(
                inArray(donations.campaignId, campaignIds),
                eq(donations.paymentStatus, "completed"),
                isNotNull(donations.chainerId)
              )
            )
        : [];

    const campaignsWithPayouts = await Promise.all(
      userCampaigns.map(async (campaign) => {
        const donationsForCampaign = await db
          .select({
            amount: donations.amount,
            currency: donations.currency,
            paymentStatus: donations.paymentStatus,
          })
          .from(donations)
          .where(eq(donations.campaignId, campaign.id));

        const currencyCode = getCurrencyCode(campaign.currency);
        let totalRaised = 0;
        let totalRaisedInNGN = 0;

        donationsForCampaign.forEach((donation) => {
          const amount = parseFloat(donation.amount || "0");
          const donationCurrency = getCurrencyCode(donation.currency || "USD");
          const amountInNGN = convertToNaira(amount, donationCurrency);
          totalRaisedInNGN += amountInNGN;

          if (donationCurrency === currencyCode) {
            totalRaised += amount;
          } else {
            totalRaised += convertFromNaira(amountInNGN, currencyCode);
          }
        });

        const payoutSupported = isPayoutSupported(currencyCode);
        const payoutProvider = payoutSupported
          ? getPayoutProvider(currencyCode)
          : null;
        const payoutConfig = payoutProvider
          ? getPayoutConfig(payoutProvider)
          : null;

        // Convert goalAmount to number (Drizzle decimal returns string)
        // Use the same pattern as other API routes
        const targetAmount = Number(campaign.goalAmount);
        const goalProgress =
          targetAmount > 0 && !isNaN(targetAmount) && isFinite(targetAmount) 
            ? (totalRaised / targetAmount) * 100 
            : 0;

        const [activePayout] = await db
          .select({
            id: campaignPayouts.id,
            status: campaignPayouts.status,
            requestedAmount: campaignPayouts.requestedAmount,
            createdAt: campaignPayouts.createdAt,
          })
          .from(campaignPayouts)
          .where(
            and(
              eq(campaignPayouts.campaignId, campaign.id),
              inArray(campaignPayouts.status, [
                "pending",
                "approved",
                "processing",
              ])
            )
          )
          .limit(1);

        return {
          ...campaign,
          currencyCode,
          targetAmount,
          totalRaised,
          totalRaisedInNGN,
          goalProgress,
          payoutSupported,
          payoutProvider,
          payoutConfig,
          availableForPayout:
            payoutSupported && totalRaised > 0 && !activePayout,
          activePayout,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: campaignsWithPayouts,
    });
  } catch (error) {
    console.error("[GET] Error fetching payout data:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout data" },
      { status: 500 }
    );
  }
}

// Create a payout request
export async function POST(request: NextRequest) {
  const routeStartTime = Date.now();

  try {
    // Authenticate user
    const userEmail = await getUserFromRequest(request);
    if (!userEmail)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch user details
    const userLookupStart = Date.now();
    const [user] = await withRetry(() =>
      db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          accountNumber: users.accountNumber,
          bankCode: users.bankCode,
          bankName: users.bankName,
          accountName: users.accountName,
          accountVerified: users.accountVerified,
          stripeAccountId: users.stripeAccountId,
          stripeAccountReady: users.stripeAccountReady,
          // International bank account fields
          internationalBankAccountNumber: users.internationalBankAccountNumber,
          internationalBankRoutingNumber: users.internationalBankRoutingNumber,
          internationalBankSwiftBic: users.internationalBankSwiftBic,
          internationalBankCountry: users.internationalBankCountry,
          internationalBankName: users.internationalBankName,
          internationalAccountName: users.internationalAccountName,
          internationalAccountVerified: users.internationalAccountVerified,
        })
        .from(users)
        .where(eq(users.email, userEmail))
        .limit(1)
    );

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Parse request body safely
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.warn("⚠️ [POST] Failed to parse payout request body:", parseError);
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { campaignId, amount: rawAmount, currency, payoutProvider } =
      body ?? {};

    // Validate required fields
    if (
      !campaignId ||
      rawAmount === undefined ||
      rawAmount === null ||
      !currency ||
      !payoutProvider
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Parse and validate amount
    const amount =
      typeof rawAmount === "string" ? parseFloat(rawAmount) : Number(rawAmount);
    if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
      console.error("❌ Invalid amount:", rawAmount);
      return NextResponse.json(
        { error: "Invalid amount. Must be a positive number." },
        { status: 400 }
      );
    }

    // Validate campaign ownership
    const campaignLookupStart = Date.now();
    const [campaign] = await withRetry(() =>
      db
        .select()
        .from(campaigns)
        .where(
          and(eq(campaigns.id, campaignId), eq(campaigns.creatorId, user.id))
        )
        .limit(1)
    );

    if (!campaign)
      return NextResponse.json(
        { error: "Campaign not found or unauthorized" },
        { status: 404 }
      );

    const donationsForCampaign = await db
      .select({
        amount: donations.amount,
        currency: donations.currency,
        paymentStatus: donations.paymentStatus,
      })
      .from(donations)
      .where(
        and(
          eq(donations.campaignId, campaignId),
          eq(donations.paymentStatus, "completed")
        )
      );

    const currencyCode = getCurrencyCode(currency);
    let totalRaised = 0;
    let totalRaisedInNGN = 0;

    donationsForCampaign.forEach((donation) => {
      const donationAmount = parseFloat(donation.amount || "0");
      const donationCurrency = getCurrencyCode(donation.currency || "USD");
      const amountInNGN = convertToNaira(donationAmount, donationCurrency);
      totalRaisedInNGN += amountInNGN;

      if (donationCurrency === currencyCode) {
        totalRaised += donationAmount;
      } else {
        totalRaised += convertFromNaira(amountInNGN, currencyCode);
      }
    });

    // Validate account or bank account requirements based on currency
    const isForeignCurrency = currency !== "NGN";
    
    if (payoutProvider === "paystack") {
      // Paystack is for NGN (Nigerian accounts)
      if (!user.accountVerified) {
        console.error("❌ Bank account not verified for Paystack payout");
        return NextResponse.json(
          { error: "Bank account not verified" },
          { status: 400 }
        );
      }
      if (!user.accountNumber || !user.bankCode) {
        console.error("❌ Bank details incomplete:", { accountNumber: !!user.accountNumber, bankCode: !!user.bankCode });
        return NextResponse.json(
          { error: "Bank details incomplete" },
          { status: 400 }
        );
      }
    }

    if (payoutProvider === "stripe") {
      // For foreign currencies, validate international bank account details
      if (isForeignCurrency) {
        if (!user.internationalAccountVerified) {
          console.error("❌ International bank account not verified for Stripe payout");
          return NextResponse.json(
            { error: "International bank account not verified. Please add and verify your bank account details." },
            { status: 400 }
          );
        }
        if (!user.internationalBankAccountNumber || !user.internationalBankCountry) {
          console.error("❌ International bank account details incomplete:", { 
            accountNumber: !!user.internationalBankAccountNumber, 
            country: !!user.internationalBankCountry 
          });
          return NextResponse.json(
            { error: "International bank account details incomplete" },
            { status: 400 }
          );
        }
      } else {
        // For NGN with Stripe (shouldn't happen, but kept for backward compatibility)
        if (!user.stripeAccountId || !user.stripeAccountReady) {
          console.error("❌ Stripe Connect account not linked or incomplete");
          return NextResponse.json(
            { error: "Stripe Connect account not linked or incomplete" },
            { status: 400 }
          );
        }
      }
    }

    // check if an active payout already exists for this campaign
    const existingPayoutLookupStart = Date.now();
    const existingPayout = await withRetry(() =>
      db
        .select({
          id: campaignPayouts.id,
          status: campaignPayouts.status,
          requestedAmount: campaignPayouts.requestedAmount,
          createdAt: campaignPayouts.createdAt,
        })
        .from(campaignPayouts)
        .where(
          and(
            eq(campaignPayouts.campaignId, campaignId),
            inArray(campaignPayouts.status, ["pending", "approved", "processing"])
          )
        )
        .limit(1)
    );
   
    if (existingPayout.length) {
      return NextResponse.json(
        {
          success: false,
          error: "An active payout already exists for this campaign",
          existingPayout: existingPayout[0],
        },
        { status: 409 }
      );
    }

    
    if (totalRaised <= 0) {
      console.error("❌ No donations available for payout:", { totalRaised, campaignId });
      return NextResponse.json(
        { error: "No donations available for payout" },
        { status: 400 }
      );
    }
    if (amount > totalRaised) {
      console.error("❌ Requested amount exceeds available funds:", { requested: amount, totalRaised, campaignId });
      return NextResponse.json(
        { error: `Requested amount (${amount}) exceeds available funds (${totalRaised})` },
        { status: 400 }
      );
    }

    // Calculate payout fees
    const feeRate =
      payoutProvider === "stripe"
        ? 0.025
        : payoutProvider === "paystack"
        ? 0.015
        : 0.02;
    const fixedFee = payoutProvider === "stripe" ? 0.3 : 0;
    const fees = amount * feeRate + fixedFee;
    const netAmount = amount - fees;

    const insertStart = Date.now();
    const [saved] = await withRetry(() =>
      db
        .insert(campaignPayouts)
        .values({
          userId: user.id,
          campaignId,
          requestedAmount: amount.toString(),
          grossAmount: amount.toString(),
          fees: fees.toString(),
          netAmount: netAmount.toString(),
          currency: getCurrencyCode(currency),
          status: "pending",
          payoutProvider,
          reference: `CP-${Date.now()}-${campaignId.substring(0, 8)}`,
          // Store bank details based on currency
          bankName: isForeignCurrency ? (user.internationalBankName || null) : (user.bankName || null),
          accountNumber: isForeignCurrency ? (user.internationalBankAccountNumber || null) : (user.accountNumber || null),
          accountName: isForeignCurrency ? (user.internationalAccountName || null) : (user.accountName || null),
          bankCode: isForeignCurrency ? null : (user.bankCode || null),
        })
        .returning()
    );

    // Prepare response data
    const responseData = {
      success: true,
      data: {
        payoutId: String(saved.id),
        amount,
        currency,
        provider: payoutProvider,
        status: "pending",
        netAmount,
        fees,
        estimatedDelivery:
          payoutProvider === "stripe"
            ? "2-7 business days"
            : "1-3 business days",
        message: `Payout of ${currency} ${amount} initiated via ${payoutProvider}`,
      },
    };

    // Notify admins about the payout request (fire and forget - don't block response)
    notifyPayoutRequest({
      userId: user.id,
      userEmail: user.email || "",
      userName: user.fullName || user.email || "Unknown User",
      campaignId: campaign.id,
      campaignTitle: campaign.title || "Unknown Campaign",
      amount: parseFloat(amount.toString()),
      currency: getCurrencyCode(currency),
      payoutId: String(saved.id),
      requestDate: new Date(),
      bankDetails: {
        accountName: isForeignCurrency 
          ? (user.internationalAccountName || "") 
          : (user.accountName || ""),
        accountNumber: isForeignCurrency 
          ? (user.internationalBankAccountNumber || "") 
          : (user.accountNumber || ""),
        bankName: isForeignCurrency 
          ? (user.internationalBankName || "") 
          : (user.bankName || ""),
      },
    }).catch((notificationError) => {
      console.error("❌ Error sending admin notifications:", notificationError);
      // Don't fail the request if notifications fail
    });

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("❌ [POST] Error processing payout:", error);
    
    return NextResponse.json(
      { error: "Failed to process payout" },
      { status: 500 }
    );
  }
}
