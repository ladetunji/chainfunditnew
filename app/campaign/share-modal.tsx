"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Facebook, Instagram, Twitter, Linkedin, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useShortenLink } from "@/hooks/use-shorten-link";
import Link from "next/link";

interface Campaign {
  id: string;
  title: string;
  shortUrl?: string;
}

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign;
}

const ShareModal: React.FC<ShareModalProps> = ({ open, onOpenChange, campaign }) => {
  const [copied, setCopied] = useState(false);
  const [campaignUrl, setCampaignUrl] = useState("");
  const { shortenLink, isLoading } = useShortenLink();

  useEffect(() => {
    if (campaign && open) {
      const longUrl = `${window.location.origin}/campaign/${campaign.id}`;
      
      // If campaign already has a short URL, use it
      if (campaign.shortUrl) {
        setCampaignUrl(campaign.shortUrl);
      } else {
        // Otherwise, try to shorten the URL
        shortenLink(longUrl).then((shortUrl) => {
          setCampaignUrl(shortUrl || longUrl);
        });
      }
    }
  }, [campaign, open, shortenLink]);

  const handleCopyLink = () => {
    if (campaignUrl) {
      navigator.clipboard.writeText(campaignUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = (platform: string) => {
    if (!campaignUrl || !campaign) return;

    const shareText = `Check out this campaign: ${campaign.title}`;
    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(campaignUrl)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(campaignUrl)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(campaignUrl)}`;
        break;
      case "instagram":
        // Instagram doesn't support direct sharing via URL, copy to clipboard
        navigator.clipboard.writeText(`${shareText} ${campaignUrl}`);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-[600px] bg-[#E5ECDE] rounded-lg shadow-lg max-w-xl">
        {/* Header */}
        <div className="flex justify-between items-start p-6">
          <div>
            <h2 className="text-3xl font-medium text-[#5F8555]">
              Campaigns do better when you share
            </h2>
            <p className="text-base text-[#5F8555] mt-1">
              Share this campaign on your favourite socials networks.
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
        <div className="p-6 space-y-6">
          {/* Campaign Link */}
          <div>
            <div className="flex items-center space-x-2">
              <Input
                value={campaignUrl}
                readOnly
                className="flex-1 text-2xl text-[#104901] font-medium bg-[#E5ECDE] border-none shadow-none"
              />
              <Button
                onClick={handleCopyLink}
                disabled={!campaignUrl}
                className="bg-[#104901] text-white"
              >
                <Copy size={16} className="mr-1" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Share Campaign */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-2xl font-medium text-[#104901]">
                Share campaign
              </h3>
              <div className="flex space-x-5">
                <Link href="https://www.facebook.com/sharer/sharer.php?u=https://www.google.com" target="_blank">
                  <Facebook strokeWidth={1.5} color="#104901" size={32} />
                </Link>
                <Link href="https://www.instagram.com/sharer/sharer.php?u=https://www.google.com" target="_blank">
                  <Instagram strokeWidth={1.5} color="#104901" size={32} />
                </Link>
                    <Link href="https://www.twitter.com/sharer/sharer.php?u=https://www.google.com" target="_blank">
                  <Twitter strokeWidth={1.5} color="#104901" size={32} />
                </Link>
                <Link href="https://www.linkedin.com/sharer/sharer.php?u=https://www.google.com" target="_blank">
                  <Linkedin strokeWidth={1.5} color="#104901" size={32} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal; 