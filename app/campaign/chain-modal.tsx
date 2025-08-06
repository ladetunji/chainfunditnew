"use client";

import React, { useState } from "react";
import { X, Link, Copy, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Campaign {
  id: string;
  title: string;
  shortUrl?: string;
}

interface ChainModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign | null;
}

const ChainModal: React.FC<ChainModalProps> = ({ open, onOpenChange, campaign }) => {
  const [step, setStep] = useState<"form" | "success">("form");
  const [whyChain, setWhyChain] = useState("");
  const [proceedsOption, setProceedsOption] = useState("give-back");
  const [copied, setCopied] = useState(false);

  const handleChainCampaign = () => {
    setStep("success");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText("chainfund.it/d1R3lly?ref=t3mfl1k");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep("form");
    setWhyChain("");
    setProceedsOption("give-back");
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-[#104901]">
              {step === "form" ? "Chain this campaign" : "Congratulations!"}
            </h2>
            <p className="text-gray-600 mt-1">
              {step === "form" 
                ? "Get your very own custom link you can share with your personal network."
                : "You can now share this campaign with your personal network, using your own custom link."
              }
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "form" ? (
            <div className="space-y-6">
              <div>
                <Label htmlFor="why-chain" className="text-sm font-medium text-gray-700">
                  Why do you want to chain?
                </Label>
                <Input
                  id="why-chain"
                  value={whyChain}
                  onChange={(e) => setWhyChain(e.target.value)}
                  placeholder="Tell us why you want to chain this campaign..."
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  What will you do with the proceeds earned from this campaign?
                </Label>
                <RadioGroup
                  value={proceedsOption}
                  onValueChange={setProceedsOption}
                  className="mt-3 space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="give-back" id="give-back" />
                    <Label htmlFor="give-back" className="text-sm">
                      Give back to fundraiser
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="receive-payout" id="receive-payout" />
                    <Label htmlFor="receive-payout" className="text-sm">
                      Receive as payout
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="donate-charity" id="donate-charity" />
                    <Label htmlFor="donate-charity" className="text-sm">
                      Donate to a charity of your choice
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Please Note:</strong> The campaign creator has approved only a 5% commission on this campaign.
                </p>
              </div>

              <Button
                onClick={handleChainCampaign}
                className="w-full bg-[#104901] text-white hover:bg-[#0a3a0a] h-12"
              >
                Chain campaign <Link className="ml-2" size={20} />
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[#104901] font-medium">
                    chainfund.it/d1R3lly?ref=t3mfl1k
                  </span>
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="sm"
                    className="text-[#104901] border-[#104901] hover:bg-[#104901] hover:text-white"
                  >
                    <Copy size={16} className="mr-1" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Share campaign
                </Label>
                <div className="flex space-x-3">
                  <Button variant="outline" size="sm" className="text-gray-600 hover:text-blue-600">
                    <Facebook size={20} />
                  </Button>
                  <Button variant="outline" size="sm" className="text-gray-600 hover:text-pink-600">
                    <Instagram size={20} />
                  </Button>
                  <Button variant="outline" size="sm" className="text-gray-600 hover:text-blue-400">
                    <Twitter size={20} />
                  </Button>
                  <Button variant="outline" size="sm" className="text-gray-600 hover:text-blue-700">
                    <Linkedin size={20} />
                  </Button>
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