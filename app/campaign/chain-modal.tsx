"use client";

import React, { useState, useEffect } from "react";
import { Link as LinkIcon, Copy, Facebook, Instagram, Twitter, Linkedin, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { useChain } from "@/hooks/use-chain";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface Campaign {
  id: string;
  title: string;
  shortUrl?: string;
  chainerCommissionRate?: number;
}

interface ChainModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign | null;
  onChainCreated?: () => void;
}

const ChainModal: React.FC<ChainModalProps> = ({ open, onOpenChange, campaign, onChainCreated }) => {
  const [step, setStep] = useState<"form" | "success">("form");
  const [whyChainOption, setWhyChainOption] = useState("");
  const [whyChainCustom, setWhyChainCustom] = useState("");
  const [proceedsOption, setProceedsOption] = useState("give-back");
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  
  const { user } = useAuth();
  const { createChain, loading, error } = useChain();
  
  // Import analytics for tracking
  const trackChainer = async (eventName: "chain_created" | "referral_link_copied", data: any) => {
    if (typeof window !== "undefined") {
      const { trackChainer: track } = await import("@/lib/analytics");
      track(eventName, data);
    }
  };

  const handleChainCampaign = async () => {
    if (!user) {
      toast.error('Please sign in to chain this campaign');
      return;
    }
    
    if (!campaign) {
      toast.error('Campaign information is missing');
      return;
    }

    const finalWhyChain = whyChainOption === "other" ? whyChainCustom : whyChainOption;
    if (!finalWhyChain.trim()) {
      toast.error('Please explain why you want to chain this campaign');
      return;
    }

    // Map the proceeds option to the API format
    const commissionDestinationMap = {
      'give-back': 'donate_back' as const,
      'receive-payout': 'keep' as const,
      'donate-charity': 'donate_other' as const,
    };

    const chainData = {
      userId: user.id,
      campaignId: campaign.id,
      commissionDestination: commissionDestinationMap[proceedsOption as keyof typeof commissionDestinationMap],
      charityChoiceId: proceedsOption === 'donate-charity' ? undefined : undefined, // TODO: Add charity selection
      whyChain: finalWhyChain,
    };
    try {
      const result = await createChain(chainData);
      
      if (result.success && result.data) {
        setReferralCode(result.data.referralCode);
        setStep("success");
        toast.success('Campaign chained successfully!');
        
        // Track chain creation
        trackChainer("chain_created", {
          chainer_id: String(user.id),
          referral_code: result.data.referralCode,
          campaign_id: String(campaign.id),
          commission_rate: campaign.chainerCommissionRate,
        });
        
        // Call the callback to refresh chain count
        if (onChainCreated) {
          onChainCreated();
        }
      } else {
        toast.error(`Failed to chain campaign: ${result.error}`);
      }
    } catch (error) {
      toast.error('An unexpected error occurred while chaining the campaign');
    }
  };

  const handleCopyLink = () => {
    const chainLink = `${window.location.origin}/c/${referralCode}`;
    navigator.clipboard.writeText(chainLink);
    setCopied(true);
    
    // Track referral link copy
    trackChainer("referral_link_copied", {
      chainer_id: user?.id?.toString(),
      referral_code: referralCode,
      campaign_id: campaign?.id?.toString(),
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep("form");
    setWhyChainOption("");
    setWhyChainCustom("");
    setProceedsOption("give-back");
    setReferralCode("");
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#E5ECDE] rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-medium text-[#5F8555]">
              {step === "form" ? "Chain this campaign" : "Congratulations!"}
            </h2>
            <p className="text-base text-[#5F8555] mt-1">
              {step === "form" 
                ? "Get your very own custom link you can share with your personal network."
                : "You can now share this campaign with your personal network, using your own custom link."
              }
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={handleClose}
          >
            <XCircle size={24} color="#5F8555" />
          </Button>
        </div>

        {/* Content */}
        <div className="mt-3">
          {step === "form" ? (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-normal text-[#5F8555]">
                  Why do you want to chain?
                </Label>
                <RadioGroup
                  value={whyChainOption}
                  onValueChange={setWhyChainOption}
                  className="mt-3 space-y-3"
                >
                  <div className="flex items-center space-x-2 w-fit h-12 p-5 bg-whitesmoke border border-[#C0BFC4] rounded-lg">
                    <RadioGroupItem value="support-cause" id="support-cause" />
                    <Label htmlFor="support-cause" className="text-xl font-normal text-[#5F8555]">
                      I want to support this cause
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 w-fit h-12 p-5 bg-whitesmoke border border-[#C0BFC4] rounded-lg">
                    <RadioGroupItem value="share-with-network" id="share-with-network" />
                    <Label htmlFor="share-with-network" className="text-xl font-normal text-[#5F8555]">
                      I want to share this with my network
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 w-fit h-12 p-5 bg-whitesmoke border border-[#C0BFC4] rounded-lg">
                    <RadioGroupItem value="make-impact" id="make-impact" />
                    <Label htmlFor="make-impact" className="text-xl font-normal text-[#5F8555]">
                      I want to make a positive impact
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 w-fit h-12 p-5 bg-whitesmoke border border-[#C0BFC4] rounded-lg">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="text-xl font-normal text-[#5F8555]">
                      Other
                    </Label>
                  </div>
                </RadioGroup>
                
                {whyChainOption === "other" && (
                  <div className="mt-3">
                    <Input
                      value={whyChainCustom}
                      onChange={(e) => setWhyChainCustom(e.target.value)}
                      placeholder="Please tell us why you want to chain this campaign..."
                      className="h-12 p-5 bg-whitesmoke border border-[#C0BFC4] rounded-lg shadow-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label className="text-base font-normal text-[#5F8555]">
                  What will you do with the proceeds earned from this campaign?
                </Label>
                <RadioGroup
                  value={proceedsOption}
                  onValueChange={setProceedsOption}
                  className="mt-3 space-y-3"
                >
                  <div className="flex items-center space-x-2 w-fit h-12 p-5 bg-whitesmoke border border-[#C0BFC4] rounded-lg">
                    <RadioGroupItem value="give-back" id="give-back" />
                    <Label htmlFor="give-back" className="text-xl font-normal text-[#5F8555]">
                      Give back to fundraiser
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 w-fit h-12 p-5 bg-whitesmoke border border-[#C0BFC4] rounded-lg">
                    <RadioGroupItem value="receive-payout" id="receive-payout" />
                    <Label htmlFor="receive-payout" className="text-xl font-normal text-[#5F8555]">
                      Receive as payout
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 w-fit h-12 p-5 bg-whitesmoke border border-[#C0BFC4] rounded-lg">
                    <RadioGroupItem value="donate-charity" id="donate-charity" />
                    <Label htmlFor="donate-charity" className="text-xl font-normal text-[#5F8555]">
                      Donate to a charity of your choice
                    </Label>
                  </div>
                </RadioGroup>
              </div>

                <p className="text-xl font-medium text-[#104901]">
                  Please Note: The campaign creator has approved only a {campaign?.chainerCommissionRate}% commission on this campaign.
                </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Button
                  onClick={handleChainCampaign}
                  disabled={loading || !whyChainOption.trim() || (whyChainOption === "other" && !whyChainCustom.trim())}
                  className="w-[300px] h-16 font-medium text-2xl flex justify-between items-center"
                  type="button"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      Creating chain...
                    </>
                  ) : (
                    <>
                      Chain campaign <LinkIcon size={24} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-medium text-[#104901] break-all">
                    {referralCode ? `${window.location.origin}/c/${referralCode}` : 'Generating link...'}
                  </span>
                  <Button
                    onClick={handleCopyLink}
                    disabled={!referralCode}
                    className="flex justify-between items-center text-2xl w-[150px] h-16"
                  >
                    {copied ? "Copied!" : "Copy"}
                    <Copy size={24} />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Label className="text-2xl font-medium text-[#104901]">
                  Share campaign
                </Label>
                <div className="flex space-x-5">
                  <Link 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/c/${referralCode}`)}`} 
                    target="_blank" 
                    className="text-[#5F8555]"
                    onClick={(e) => !referralCode && e.preventDefault()}
                  >
                    <Facebook size={32} color="#104901" strokeWidth={1.5} />
                  </Link>
                  <Link 
                    href={`https://www.instagram.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/c/${referralCode}`)}`} 
                    target="_blank" 
                    className="text-[#104901]"
                    onClick={(e) => !referralCode && e.preventDefault()}
                  >
                    <Instagram size={32} color="#104901" strokeWidth={1.5} />
                  </Link>
                  <Link 
                    href={`https://www.twitter.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/c/${referralCode}`)}`} 
                    target="_blank" 
                    className="text-[#104901]"
                    onClick={(e) => !referralCode && e.preventDefault()}
                  >
                    <Twitter size={32} color="#104901" strokeWidth={1.5} />
                  </Link>
                  <Link 
                    href={`https://www.linkedin.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/c/${referralCode}`)}`} 
                    target="_blank" 
                    className="text-[#104901]"
                    onClick={(e) => !referralCode && e.preventDefault()}
                  >
                    <Linkedin size={32} color="#104901" strokeWidth={1.5} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChainModal; 