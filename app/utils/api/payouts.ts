"use client"

export interface CampaignPayout {
  id: string;
  title: string;
  currency: string;
  currencyCode: string;
  targetAmount: number;
  currentAmount: number;
  totalRaised: number;
  totalRaisedInNGN: number;
  status: string;
  createdAt: string;
  payoutSupported: boolean;
  payoutProvider: string | null;
  payoutConfig: any;
  goalProgress: number;
  hasReached50Percent: boolean;
  availableForPayout: boolean;
  donationsByStatus?: Array<{
    status: string;
    total: string;
    count: string;
  }>;
}

export interface ChainerDonation {
  id: string;
  amount: string;
  currency: string;
  paymentStatus: string;
  campaignId: string;
  campaignTitle: string;
  campaignCurrency: string;
  createdAt: string;
}

export interface PayoutData {
  campaigns: CampaignPayout[];
  chainerDonations: ChainerDonation[];
  totalAvailableForPayout: number;
  totalAvailableForPayoutInNGN: number;
  totalRaisedInNGN: number;
  chainerDonationsTotal: number;
  chainerDonationsInNGN: number;
  currencyBreakdown: { [key: string]: number };
  summary: {
    totalCampaigns: number;
    campaignsWithPayouts: number;
    totalRaised: number;
    totalRaisedInNGN: number;
    chainerDonationsCount: number;
    chainerDonationsTotal: number;
    chainerDonationsInNGN: number;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  [key: string]: any;
}

export interface CampaignDetails {
  id: string;
  chainerCommissionRate: number;
  [key: string]: any;
}

export interface RequestPayoutParams {
  campaignId: string;
  amount: number;
  currency: string;
  payoutProvider: string;
}

export interface RequestPayoutResponse {
  success: boolean;
  data?: {
    message: string;
    [key: string]: any;
  };
  error?: string;
  existingPayout?: {
    status: string;
    requestedAmount: string;
    createdAt: string;
    [key: string]: any;
  };
}

// fetch user data
export async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    const response = await fetch("/api/user/profile");
    const result = await response.json();
    if (result.success) {
      return result.user;
    }
    return null;
  } catch (err) {
    console.error("Failed to fetch user profile:", err);
    return null;
  }
}

// fetch payout data
export async function fetchPayoutData(): Promise<{
  data: PayoutData | null;
  error: string | null;
}> {
  try {
    const response = await fetch("/api/payouts");
    const result = await response.json();

    if (result.success) {
      const campaigns = Array.isArray(result.data)
        ? result.data
        : result.data.campaigns || [];
      const chainerDonations = result.data.chainerDonations || [];

      const totalRaisedInNGN = campaigns.reduce(
        (sum: number, c: CampaignPayout) => sum + (c.totalRaisedInNGN || 0),
        0
      );
      const totalAvailableForPayout = campaigns.reduce(
        (sum: number, c: CampaignPayout) => {
          return sum + (c.availableForPayout ? c.totalRaised : 0);
        },
        0
      );
      const totalAvailableForPayoutInNGN = campaigns.reduce(
        (sum: number, c: CampaignPayout) => {
          return sum + (c.availableForPayout ? c.totalRaisedInNGN || 0 : 0);
        },
        0
      );

      const chainerDonationsTotal = chainerDonations.reduce(
        (sum: number, d: ChainerDonation) => sum + parseFloat(d.amount || "0"),
        0
      );
      const chainerDonationsInNGN = chainerDonations.reduce(
        (sum: number, d: ChainerDonation) => {
          const amount = parseFloat(d.amount || "0");
          return sum + (d.currency === "NGN" ? amount : amount * 0.001); // Rough conversion
        },
        0
      );

      const currencyBreakdown: { [key: string]: number } = {};
      campaigns.forEach((campaign: CampaignPayout) => {
        const currency = campaign.currencyCode || campaign.currency || "USD";
        currencyBreakdown[currency] =
          (currencyBreakdown[currency] || 0) + (campaign.totalRaised || 0);
      });

      const campaignsWithPayouts = campaigns.filter(
        (c: CampaignPayout) => c.availableForPayout && c.totalRaised > 0
      ).length;

      const transformedData: PayoutData = {
        campaigns,
        chainerDonations,
        totalAvailableForPayout,
        totalAvailableForPayoutInNGN,
        totalRaisedInNGN,
        chainerDonationsTotal,
        chainerDonationsInNGN,
        currencyBreakdown,
        summary: {
          totalCampaigns: campaigns.length,
          campaignsWithPayouts,
          totalRaised: campaigns.reduce(
            (sum: number, c: CampaignPayout) => sum + (c.totalRaised || 0),
            0
          ),
          totalRaisedInNGN,
          chainerDonationsCount: chainerDonations.length,
          chainerDonationsTotal,
          chainerDonationsInNGN,
        },
      };

      return { data: transformedData, error: null };
    } else {
      return {
        data: null,
        error: result.error || "Failed to fetch payout data",
      };
    }
  } catch (err) {
    return { data: null, error: "Failed to fetch payout data" };
  }
}

// fetch campaign details
export async function fetchCampaignDetails(
  campaignId: string
): Promise<CampaignDetails | null> {
  try {
    const response = await fetch(`/api/campaigns/${campaignId}`);
    const campaignData = await response.json();
    if (campaignData.success) {
      return campaignData.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching campaign details:", error);
    return null;
  }
}

// request a payout
const REQUEST_PAYOUT_TIMEOUT_MS = 30000;

export async function requestPayout(
  params: RequestPayoutParams
): Promise<RequestPayoutResponse> {
  const { campaignId, amount, currency, payoutProvider } = params;

  try {
    const abortController = new AbortController();
    const timeoutId = setTimeout(
      () => abortController.abort(),
      REQUEST_PAYOUT_TIMEOUT_MS
    );

    try {
      const response = await fetch("/api/payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId,
          amount,
          currency,
          payoutProvider,
        }),
        signal: abortController.signal,
      });

      // Handle non-OK responses
      if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to process payout" }));
      
      if (response.status === 409 && errorData.existingPayout) {
        return {
          success: false,
          error: errorData.error,
          existingPayout: errorData.existingPayout,
        };
      }

      return {
        success: false,
        error: errorData.error || `Server error: ${response.status}`,
      };
    }

      // Parse successful response
      const result = await response.json();

      if (result.success) {
      return {
        success: true,
        data: result.data,
      };
      } else {
        console.error("Payout failed:", result.error);
        return {
          success: false,
          error: result.error || "Failed to process payout",
        };
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error("Payout error caught:", error);
    
    // Handle timeout errors
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        error: "Request timeout. The server took too long to respond.",
      };
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        success: false,
        error: "Network error. Please check your connection.",
      };
    }

    // Generic error handler
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process payout";
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}
