import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  campaigns,
  donations,
  users,
  chainers,
  campaignPayouts,
} from "@/lib/schema";
import { eq, and, sum, inArray, isNotNull } from "drizzle-orm";
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

// Fetch payout dashboard data for user
export async function GET(request: NextRequest) {
  console.log("➡️ [GET] Fetching payout dashboard data...");

  try {
    const userEmail = await getUserFromRequest(request);
    if (!userEmail) {
      console.log("🚫 Unauthorized request: no user email found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ Authenticated user:", userEmail);

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    console.log("📊 Fetching user campaigns...");
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
      console.log("No campaigns found for user.");
      return NextResponse.json({
        success: true,
        data: { campaigns: [], totalAvailableForPayout: 0 },
      });
    }

    const campaignIds = userCampaigns.map((c) => c.id);

    console.log("Fetching donations for user's campaigns...");
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

    console.log(
      `Found ${userDonations.length} donations across ${userCampaigns.length} campaigns.`
    );

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

    console.log("Sending campaigns with payout data...");
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
  console.log("➡️ [POST] Payout request started");

  try {
    // Authenticate user
    const userEmail = await getUserFromRequest(request);
    if (!userEmail)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.log("✅ User authenticated:", userEmail);

    // Fetch user details
    const [user] = await db
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
      .limit(1);

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Parse request body
    const body = await request.json();
    const { campaignId, amount, currency, payoutProvider } = body;
    if (!campaignId || !amount || !currency || !payoutProvider)
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );

    console.log("📦 Payout request payload:", {
      campaignId,
      amount,
      currency,
      payoutProvider,
    });

    // Validate campaign ownership
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(
        and(eq(campaigns.id, campaignId), eq(campaigns.creatorId, user.id))
      )
      .limit(1);

    if (!campaign)
      return NextResponse.json(
        { error: "Campaign not found or unauthorized" },
        { status: 404 }
      );
    console.log("✅ Campaign verified:", campaignId);

    // Validate account or bank account requirements based on currency
    const isForeignCurrency = currency !== "NGN";
    
    if (payoutProvider === "paystack") {
      // Paystack is for NGN (Nigerian accounts)
      if (!user.accountVerified)
        return NextResponse.json(
          { error: "Bank account not verified" },
          { status: 400 }
        );
      if (!user.accountNumber || !user.bankCode)
        return NextResponse.json(
          { error: "Bank details incomplete" },
          { status: 400 }
        );
    }

    if (payoutProvider === "stripe") {
      // For foreign currencies, validate international bank account details
      if (isForeignCurrency) {
        if (!user.internationalAccountVerified) {
          return NextResponse.json(
            { error: "International bank account not verified. Please add and verify your bank account details." },
            { status: 400 }
          );
        }
        if (!user.internationalBankAccountNumber || !user.internationalBankCountry) {
          return NextResponse.json(
            { error: "International bank account details incomplete" },
            { status: 400 }
          );
        }
      } else {
        // For NGN with Stripe (shouldn't happen, but kept for backward compatibility)
        if (!user.stripeAccountId || !user.stripeAccountReady)
          return NextResponse.json(
            { error: "Stripe Connect account not linked or incomplete" },
            { status: 400 }
          );
      }
    }

    // Check existing payouts
    // console.log("🔍 Checking existing payouts...");
    // const existingPayouts = await db
    //   .select({ id: campaignPayouts.id, status: campaignPayouts.status })
    //   .from(campaignPayouts)
    //   .where(
    //     and(
    //       eq(campaignPayouts.campaignId, campaignId),
    //       inArray(campaignPayouts.status, ["pending", "approved", "processing"])
    //     )
    //   )
    //   .limit(1);

    // if (existingPayouts.length)
    //   return NextResponse.json(
    //     { error: "An active payout already exists for this campaign" },
    //     { status: 409 }
    //   );
    // console.log("✅ No active payout found.");

    // Validate amount against donations
    const [{ total }] = await db
      .select({ total: sum(donations.amount) })
      .from(donations)
      .where(eq(donations.campaignId, campaignId));

    const totalRaised = parseFloat(total || "0");
    if (totalRaised <= 0)
      return NextResponse.json(
        { error: "No donations available for payout" },
        { status: 400 }
      );
    if (amount > totalRaised)
      return NextResponse.json(
        { error: "Requested amount exceeds available funds" },
        {status: 400 }
      );

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
    console.log("💰 Calculated fees:", { feeRate, fixedFee, fees, netAmount });

    // Save payout to DB
    console.log("📦 Saving payout record...");
    const [saved] = await db
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
      .returning();

    console.log("✅ Payout saved:", saved?.id);

    // Return response immediately (do not block on email/notifications)
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

    console.log("📤 Sending response to client...");
    console.log(responseData);
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("❌ [POST] Error processing payout:", error);
    
    return NextResponse.json(
      { error: "Failed to process payout" },
      { status: 500 }
    );
  }
}
