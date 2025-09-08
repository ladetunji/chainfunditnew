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
import { formatCurrency } from "@/lib/utils/currency";
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
  primaryCurrency: string;
  recentDonations: Array<{
    id: string;
    amount: number;
    currency: string;
    message: string;
    donorName: string;
    donorAvatar: string | null;
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
        } else {
          console.error("Stats API error:", statsData.error);
        }

        // Load user campaigns
        const campaignsRes = await fetch("/api/dashboard/campaigns");
        const campaignsData = await campaignsRes.json();
        if (campaignsData.success) {
          setCampaigns(campaignsData.campaigns);
        } else {
          console.error("Campaigns API error:", campaignsData.error);
        }
              } catch (error) {
         
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="w-full 2xl:container 2xl:mx-auto p-6 h-fit bg-gradient-to-br from-green-50 via-white to-green-50 min-h-screen">
      {/* Welcome Modal */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className='w-[80%] max-w-md md:max-w-xl bg-[url("/images/heart.jpg")] bg-cover h-[400px] md:h-[600px] px-4 md:px-10 bg-no-repeat rounded-none outline-none font-source'>
          <DialogHeader>
            <div className="h-[3px] w-full bg-[#2C2C2C] rounded-none overflow-hidden mb-4">
              <div
                className="h-full bg-white animate-grow"
                style={{
                  animation: "grow 3s linear forwards",
                }}
              ></div>
            </div>
            <DialogTitle className="flex gap-2 justify-center items-center">
              <Image
                src="/images/logo-white.png"
                alt=""
                width={24}
                height={24}
                className="md:w-8 md:h-8"
              />
              <p className="font-semibold text-2xl md:text-4xl text-white text-center">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-[#104901] rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#104901] opacity-80">
                      Total Campaigns
                    </p>
                    <p className="text-2xl font-bold text-[#104901]">
                      {stats.totalCampaigns}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-600 to-[#104901] rounded-xl">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#104901] opacity-80">
                      Active Campaigns
                    </p>
                    <p className="text-2xl font-bold text-[#104901]">
                      {stats.activeCampaigns}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#104901] to-green-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#104901] opacity-80">
                      Total Donations
                    </p>
                    <p className="text-sm font-bold text-[#104901]">
                      {formatCurrency(stats.totalDonations, stats.primaryCurrency)}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-[#104901] to-green-500 rounded-xl">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-[#104901] rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#104901] opacity-80">
                      Total Donors
                    </p>
                    <p className="text-2xl font-bold text-[#104901]">
                      {stats.totalDonors}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-600 to-[#104901] rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Campaigns */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl blur opacity-10"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20">
            <div className="p-8 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#104901]">
                  Recent Campaigns
                </h2>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/campaigns")}
                  className="text-[#104901] border-[#104901] hover:bg-[#104901] hover:text-white rounded-xl px-6 py-2"
                >
                  View All
                </Button>
              </div>
            </div>
            <div className="p-8">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#104901] mx-auto mb-4"></div>
                    <p className="text-lg text-[#757575]">Loading campaigns...</p>
                  </div>
                </div>
              ) : campaigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {campaigns.slice(0, 6).map((campaign) => (
                    <div
                      key={campaign.id}
                      className="group relative overflow-hidden rounded-2xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                      <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                          {campaign.coverImageUrl && (
                            <Image
                              src={campaign.coverImageUrl}
                              alt={campaign.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                        <div className="p-6">
                          <h3 className="font-bold text-[#104901] mb-3 text-lg">
                            {campaign.title}
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-[#104901] opacity-80">Raised</span>
                              <span className="font-semibold">
                                {formatCurrency(
                                  campaign.currentAmount,
                                  campaign.currency
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-[#104901] opacity-80">Goal</span>
                              <span className="font-semibold">
                                {formatCurrency(
                                  campaign.goalAmount,
                                  campaign.currency
                                )}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-[#104901] to-green-500 h-3 rounded-full transition-all duration-500"
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
                            className="w-full mt-6 text-[#104901] border-[#104901] hover:bg-[#104901] hover:text-white rounded-xl py-3 transition-all duration-300"
                            onClick={() => router.push(`/campaign/${campaign.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Campaign
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="relative inline-block">
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-full blur opacity-20"></div>
                    <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-full">
                      <Share2 className="h-16 w-16 text-[#104901] mx-auto" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#104901] mb-3 mt-6">
                    No campaigns yet
                  </h3>
                  <p className="text-[#104901] mb-6 opacity-80">
                    Start your first fundraising campaign to make a difference.
                  </p>
                  <Button
                    onClick={() => router.push("/create-campaign")}
                    className="bg-gradient-to-r from-green-600 to-[#104901] text-white rounded-xl px-8 py-3 hover:shadow-lg hover:from-green-600 hover:to-[#104901] hover:text-white transition-all duration-300"
                  >
                    Create Campaign
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Donations */}
        {stats && stats.recentDonations.length > 0 && (
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-[#104901] rounded-3xl blur opacity-10"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20">
              <div className="p-8 border-b border-white/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#104901]">
                    Recent Donations
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/donations")}
                    className="text-[#104901] border-[#104901] hover:bg-[#104901] hover:text-white rounded-xl px-6 py-2"
                  >
                    View All
                  </Button>
                </div>
              </div>
              <div className="p-8">
                <div className="space-y-6">
                  {stats.recentDonations.map((donation) => (
                    <div
                      key={donation.id}
                      className="group relative overflow-hidden rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-[#104901] rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-300"></div>
                      <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-[#104901] rounded-full blur opacity-20"></div>
                              <div className="relative w-12 h-12 rounded-full overflow-hidden">
                                {donation.donorAvatar ? (
                                  <Image
                                    src={donation.donorAvatar}
                                    alt={donation.donorName}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-r from-green-600 to-[#104901] flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">
                                      {donation.donorName.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="font-bold text-[#104901] text-lg">
                                {donation.donorName}
                              </p>
                              <p className="text-sm text-[#104901] opacity-80">
                                {donation.campaignTitle}
                              </p>
                              {donation.message && (
                                <p className="text-sm text-gray-600 mt-2 italic">
                                  &quot;{donation.message}&quot;
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#104901] text-lg">
                              {formatCurrency(donation.amount, donation.currency)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(donation.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
