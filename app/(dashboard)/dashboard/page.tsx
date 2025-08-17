"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CompleteProfile from "../complete-profile";
import Image from "next/image";
import {
  ArrowRight,
  TrendingUp,
  Users,
  DollarSign,
  Share2,
  Calendar,
  Eye,
} from "lucide-react";

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalDonations: number;
  totalDonors: number;
  totalChained: number;
  totalEarnings: number;
  recentDonations: Array<{
    id: string;
    amount: number;
    currency: string;
    message: string;
    donorName: string;
    campaignTitle: string;
    createdAt: string;
  }>;
}

interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  goalAmount: number;
  currentAmount: number;
  currency: string;
  status: string;
  isActive: boolean;
  coverImageUrl: string;
  progressPercentage: number;
  donationCount: number;
  createdAt: string;
}

export default function DashboardPage() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(
    null
  ) as React.RefObject<HTMLFormElement>;

  useEffect(() => {
    async function checkProfile() {
      try {
        const res = await fetch("/api/user/profile", { method: "GET" });
        const data = await res.json();
        if (
          data.success &&
          data.user &&
          !data.user.hasCompletedProfile &&
          !data.user.hasSeenWelcomeModal
        ) {
          setShowWelcome(true);
        }
      } catch {
        // fallback: show modal if error
        setShowWelcome(true);
      } finally {
        setProfileChecked(true);
      }
    }
    checkProfile();
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      if (!profileChecked) return;

      try {
        setLoading(true);

        // Load dashboard stats
        const statsRes = await fetch("/api/dashboard/stats");
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }

        // Load user campaigns
        const campaignsRes = await fetch("/api/dashboard/campaigns");
        const campaignsData = await campaignsRes.json();
        if (campaignsData.success) {
          setCampaigns(campaignsData.campaigns);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [profileChecked]);

  // When closing the welcome modal, mark as seen in backend
  const handleCloseWelcome = async () => {
    setShowWelcome(false);
    setShowCompleteProfile(true);
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasSeenWelcomeModal: true }),
      });
    } catch {}
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencyMap: Record<string, string> = {
      // ISO Codes
      USD: "USD",
      GBP: "GBP",
      NGN: "NGN",
      EUR: "EUR",
      CAD: "CAD",

      // Names
      "BRITISH POUND": "GBP",
      "US DOLLAR": "USD",
      NAIRA: "NGN",
      EURO: "EUR",
      "CANADIAN DOLLAR": "CAD",
      POUND: "GBP",

      // Symbols
      "£": "GBP",
      $: "USD",
      "₦": "NGN",
      "€": "EUR",
      C$: "CAD",
    };

    const normalizedCurrency = (currency || "").trim().toUpperCase();

    const code = currencyMap[normalizedCurrency] || "USD";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="w-full 2xl:container 2xl:mx-auto p-6 h-fit">
      {/* Welcome Modal */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className='w-[80%] max-w-md md:max-w-xl bg-[url("/images/piggy-bank.png")] bg-cover h-[400px] md:h-[600px] px-4 md:px-10 bg-no-repeat rounded-none outline-none font-source'>
          <DialogHeader>
            <div className="h-[3px] w-full bg-[#2C2C2C] rounded-none overflow-hidden mb-4">
              <div
                className="h-full bg-white animate-grow"
                style={{
                  animation: "grow 3s linear forwards",
                }}
              ></div>
            </div>
            <DialogTitle className="flex gap-2 items-center">
              <Image
                src="/images/logo.svg"
                alt=""
                width={24}
                height={24}
                className="md:w-8 md:h-8"
              />
              <p className="font-semibold text-2xl md:text-4xl text-[#104901]">
                Welcome to Chainfundit
              </p>
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex items-end">
            <Button
              className="w-full h-14 md:h-[72px] font-sans font-semibold text-lg md:text-2xl flex justify-between items-center"
              onClick={handleCloseWelcome}
            >
              Complete your profile
              <ArrowRight />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Profile Modal */}
      <Dialog open={showCompleteProfile} onOpenChange={setShowCompleteProfile}>
        <DialogContent className="bg-[#F5F5F5] max-w-md md:max-w-xl rounded-none font-source">
          <DialogHeader>
            <DialogTitle className="font-source font-semibold text-left text-2xl md:text-4xl text-[#104901]">
              Complete Your Profile
            </DialogTitle>
            <p className="font-normal text-base md:text-xl text-[#104901] text-left text-wrap">
              Enter your name and choose an avatar so your friends can recognise
              you.
            </p>
          </DialogHeader>
          <div className="py-4 md:py-5">
            <CompleteProfile formRef={formRef} />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                formRef.current?.requestSubmit();
              }}
              className="w-full h-14 md:h-[72px] flex justify-between items-center font-semibold text-lg md:text-2xl"
            >
              Here we go! <ArrowRight size={20} className="md:w-6 md:h-6" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dashboard Content */}
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#104901] mb-2">Dashboard</h1>
          <p className="text-[#104901]">
            Welcome back! Here&apos;s what&apos;s happening with your campaigns.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#104901]">
                    Total Campaigns
                  </p>
                  <p className="text-2xl font-bold text-[#104901]">
                    {stats.totalCampaigns}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#104901]">
                    Active Campaigns
                  </p>
                  <p className="text-2xl font-bold text-[#104901]">
                    {stats.activeCampaigns}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#104901]">
                    Total Donations
                  </p>
                  <p className="text-2xl font-bold text-[#104901]">
                    {formatCurrency(stats.totalDonations, "USD")}
                  </p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#104901]">
                    Total Donors
                  </p>
                  <p className="text-2xl font-bold text-[#104901]">
                    {stats.totalDonors}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Campaigns */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#104901]">
                Recent Campaigns
              </h2>
              <Button
                variant="outline"
                onClick={() => router.push("/campaigns")}
                className="text-[#104901] border-[#104901] hover:bg-[#104901] hover:text-white"
              >
                View All
              </Button>
            </div>
          </div>
          <div className="p-6">
            {campaigns.length > 0 ? (
              <div className="space-y-6">
                {campaigns.slice(0, 6).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-48 bg-gray-200">
                      {campaign.coverImageUrl && (
                        <Image
                          src={campaign.coverImageUrl}
                          alt={campaign.title}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-[#104901] mb-2">
                        {campaign.title}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#104901]">Raised</span>
                          <span className="font-medium">
                            {formatCurrency(
                              campaign.currentAmount,
                              campaign.currency
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#104901]">Goal</span>
                          <span className="font-medium">
                            {formatCurrency(
                              campaign.goalAmount,
                              campaign.currency
                            )}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#104901] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${campaign.progressPercentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{campaign.progressPercentage}% complete</span>
                          <span>{campaign.donationCount} donors</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full mt-4 text-[#104901] border-[#104901] hover:bg-[#104901] hover:text-white"
                        onClick={() => router.push(`/campaign/${campaign.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Campaign
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#104901] mb-2">
                  No campaigns yet
                </h3>
                <p className="text-[#104901] mb-4">
                  Start your first fundraising campaign to make a difference.
                </p>
                <Button
                  onClick={() => router.push("/create-campaign")}
                  className="bg-[#104901] text-white"
                >
                  Create Campaign
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Donations */}
        {stats && stats.recentDonations.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#104901]">
                  Recent Donations
                </h2>
                <Button
                  variant="outline"
                  onClick={() => router.push("/donations")}
                  className="text-[#104901] border-[#104901] hover:bg-[#104901] hover:text-white"
                >
                  View All
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.recentDonations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-[#104901] rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {donation.donorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-[#104901]">
                          {donation.donorName}
                        </p>
                        <p className="text-sm text-[#104901]">
                          {donation.campaignTitle}
                        </p>
                        {donation.message && (
                          <p className="text-sm text-gray-500 mt-1">
                            &quot;{donation.message}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#104901]">
                        {formatCurrency(donation.amount, donation.currency)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(donation.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
