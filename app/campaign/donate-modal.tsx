"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Send,
  HandCoins,
  XCircle,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useDonations, DonationResult } from "@/hooks/use-donations";
import { getSupportedProviders, getIntelligentProviders, PROVIDER_DESCRIPTIONS, PaymentProvider } from "@/lib/payments/config";
import { getCurrencyCode } from "@/lib/utils/currency";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import StripePaymentForm from "@/components/payments/StripePaymentForm";
import Image from "next/image";

interface Campaign {
  id: string;
  slug: string;
  title: string;
  shortUrl?: string;
  currency: string;
  minimumDonation: string;
}

interface DonateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign;
  referralChainer?: {
    id: string;
    referralCode: string;
  } | null;
}

const DonateModal: React.FC<DonateModalProps> = ({
  open,
  onOpenChange,
  campaign,
  referralChainer,
}) => {
  const [step, setStep] = useState<"donate" | "payment" | "stripe-payment" | "thankyou">("donate");
  const [period, setPeriod] = useState("one-time");
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [comments, setComments] = useState("");
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>("stripe");
  const [supportedProviders, setSupportedProviders] = useState<PaymentProvider[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [stripePaymentData, setStripePaymentData] = useState<{
    clientSecret: string;
    donationId: string;
    amount: number;
    currency: string;
  } | null>(null);
  
  const { loading: donationLoading, error: donationError, initializeDonation } = useDonations();

  useEffect(() => {
    if (campaign && open) {
      // Check if this is a thank you modal from Paystack callback
      const showThankYouModal = sessionStorage.getItem('showThankYouModal');
      if (showThankYouModal === 'true') {
        setStep("thankyou");
        sessionStorage.removeItem('showThankYouModal');
        return;
      }

      // Set initial currency to campaign currency
      setSelectedCurrency(campaign.currency || "₦");
      
      const currencyCode = getCurrencyCode(campaign.currency);
      const { primary, alternatives } = getIntelligentProviders(currencyCode);
      
      // Set supported providers (primary first, then alternatives)
      const allProviders = primary ? [primary, ...alternatives] : alternatives;
      setSupportedProviders(allProviders);
      
      // Set default payment provider to the intelligent choice
      if (primary) {
        setPaymentProvider(primary);
      } else if (alternatives.length > 0) {
        setPaymentProvider(alternatives[0]);
      }
    }
  }, [campaign, open]);

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    
    // Update providers based on new currency
    const currencyCode = getCurrencyCode(currency);
    const { primary, alternatives } = getIntelligentProviders(currencyCode);
    
    // Set supported providers (primary first, then alternatives)
    const allProviders = primary ? [primary, ...alternatives] : alternatives;
    setSupportedProviders(allProviders);
    
    // Set default payment provider to the intelligent choice
    if (primary) {
      setPaymentProvider(primary);
    } else if (alternatives.length > 0) {
      setPaymentProvider(alternatives[0]);
    }
  };

  const handleDonate = () => {
    setStep("payment");
  };

  const handlePayment = async () => {
    if (!campaign || !amount) return;

    const amountNum = parseFloat(amount);
    const minAmount = parseFloat(campaign.minimumDonation);

    if (amountNum < minAmount) {
      alert(`Minimum donation amount is ${selectedCurrency} ${minAmount}`);
      return;
    }

    try {
      const currencyCode = getCurrencyCode(selectedCurrency);
      
      const donationData = {
        campaignId: campaign.id,
        amount: amountNum,
        currency: currencyCode,
        paymentProvider,
        message: comments,
        isAnonymous: anonymous,
        chainerId: referralChainer?.id || null,
      };

      // Initialize donation and redirect to payment gateway
      const result = await initializeDonation(donationData, false);

      if (result && result.success) {
        if (result.provider === 'paystack' && result.authorization_url) {
          // Redirect to Paystack payment page
          window.location.href = result.authorization_url;
        } else if (result.provider === 'stripe' && result.clientSecret && result.donationId) {
          // Store Stripe payment data and show payment form
          setStripePaymentData({
            clientSecret: result.clientSecret,
            donationId: result.donationId,
            amount: amountNum,
            currency: selectedCurrency,
          });
          setStep("stripe-payment");
        }
      } else if (result && !result.success) {
        toast.error(result.error || "Donation failed. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred while processing your donation. Please try again.");
    }
  };



  const handleStripePaymentSuccess = () => {
    setStep("thankyou");
  };

  const handleStripePaymentError = (error: string) => {
    toast.error(error);
    setStep("payment");
    setStripePaymentData(null);
  };

  const handleStripePaymentCancel = () => {
    setStep("payment");
    setStripePaymentData(null);
  };

  const handleClose = () => {
    setStep("donate");
    setAmount("");
    setSelectedCurrency("");
    setFullName("");
    setEmail("");
    setPhone("");
    setAnonymous(false);
    setComments("");
    setLinkCopied(false);
    setStripePaymentData(null);
    onOpenChange(false);
  };

  const handleViewDashboard = () => {
    // Navigate to user's dashboard
    window.open('/dashboard', '_blank');
  };

  const handleCopyLink = async () => {
    if (!campaign) return;
    
    const campaignUrl = campaign.shortUrl 
      ? `https://chainfundit.com/c/${campaign.shortUrl}`
      : `https://chainfundit.com/campaign/${campaign.slug}`;
    
    try {
      await navigator.clipboard.writeText(campaignUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = campaignUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const generateShareUrl = (platform: string) => {
    if (!campaign) return '#';
    
    const campaignUrl = campaign.shortUrl 
      ? `https://chainfundit.com/c/${campaign.shortUrl}`
      : `https://chainfundit.com/campaign/${campaign.slug}`;
    
    const shareText = `I just donated ${selectedCurrency} ${amount} to "${campaign.title}"! Help support this cause: `;
    
    const encodedUrl = encodeURIComponent(campaignUrl);
    const encodedText = encodeURIComponent(shareText);
    
    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
      case 'twitter':
        // Use new X.com endpoint
        return `https://x.com/intent/post?text=${encodedText}&url=${encodedUrl}`;
      case 'linkedin':
        // Add summary parameter for encoded text
        return `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&summary=${encodedText}`;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we'll copy the text
        return '#';
      default:
        return '#';
    }
  };

  const handleInstagramShare = () => {
    if (!campaign) return;
    
    const campaignUrl = campaign.shortUrl 
      ? `https://chainfundit.com/c/${campaign.shortUrl}`
      : `https://chainfundit.com/campaign/${campaign.slug}`;
    
    const shareText = `I just donated ${selectedCurrency} ${amount} to "${campaign.title}"! Help support this cause: ${campaignUrl}`;
    
    // Copy text for Instagram (since Instagram doesn't support direct URL sharing)
    navigator.clipboard.writeText(shareText).then(() => {
      alert('Share text copied! Paste it in your Instagram story or post.');
    }).catch(() => {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Share text copied! Paste it in your Instagram story or post.');
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#E5ECDE] rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b">
          <div>
            <h2 className="text-3xl font-medium text-[#5F8555]">
              {step === "donate" && "Make a donation"}
              {step === "payment" && "Choose Payment Method"}
              {step === "stripe-payment" && "Complete Payment"}
              {step === "thankyou" && "Thank you for your donation!"}
            </h2>
            <p className="text-base font-normal text-[#5F8555] mt-1">
              {step === "donate" &&
                "Select a period and a payment channel to complete your donation."}
              {step === "payment" &&
                "Select your preferred payment provider to complete the donation."}
              {step === "stripe-payment" &&
                "Enter your card details to complete the donation securely."}
              {step === "thankyou" &&
                "We are glad you supported this campaign."}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="hover:bg-none"
          >
            <XCircle size={24} color="#5F8555" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "donate" && (
            <div className="space-y-6">
              {/* Select Period */}
              <div>
                <Label className="text-base font-medium text-[#5F8555] mb-3 block">
                  Select period
                </Label>
                <div className="grid grid-cols-4 gap-2 bg-[#F5F5F5] rounded-2xl p-2">
                  {["One-time", "Monthly", "Quarterly", "Yearly"].map(
                    (option) => (
                      <Button
                        key={option}
                        variant={
                          period === option.toLowerCase().replace(" ", "-")
                            ? "default"
                            : "outline"
                        }
                        className={`p-5 text-[#5F8555] text-xl ${
                          period === option.toLowerCase().replace(" ", "-")
                            ? "bg-whitesmoke rounded-lg border border-[#C0BFC4] hover:bg-whitesmoke hover:text-[#5F8555] shadow-none"
                            : "border-none bg-transparent shadow-none hover:bg-transparent hover:text-[#5F8555]"
                        }`}
                        onClick={() =>
                          setPeriod(option.toLowerCase().replace(" ", "-"))
                        }
                      >
                        {option}
                      </Button>
                    )
                  )}
                </div>
              </div>

              {/* Amount */}
              <div>
                <Label
                  htmlFor="amount"
                  className="text-base font-normal text-[#5F8555]"
                >
                  Amount
                </Label>
                <div className="flex gap-3 mt-2">
                  {/* Currency Selector */}
                  <div className="relative">
                    <Select
                      value={selectedCurrency}
                      onValueChange={handleCurrencyChange}
                    >
                      <SelectTrigger className="h-11 bg-whitesmoke rounded-lg border border-[#C0BFC4] text-[#5F8555] text-xl shadow-none appearance-none cursor-pointer hover:border-[#104901] transition-colors">
                        <SelectValue placeholder="$" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="₦">₦</SelectItem>
                        <SelectItem value="$">$</SelectItem>
                        <SelectItem value="£">£</SelectItem>
                        <SelectItem value="€">€</SelectItem>
                        <SelectItem value="C$">C$</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Amount Input */}
                  <div className="relative flex-1">
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="type in an amount"
                      className="w-full h-11 bg-whitesmoke rounded-lg border border-[#C0BFC4] text-[#5F8555] text-xl shadow-none"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div>
                <h3 className="font-normal text-base text-[#5F8555]">
                  Contact details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="fullName"
                      className="text-sm font-medium text-gray-700"
                    >
                      Full name
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      placeholder="Full name"
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-2 h-11 bg-whitesmoke rounded-lg border border-[#C0BFC4] text-[#5F8555] placeholder:text-xl placeholder:text-[#5F8555] text-xl shadow-none"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      placeholder="Email"
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2 h-11 bg-whitesmoke rounded-lg border border-[#C0BFC4] text-[#5F8555] placeholder:text-xl placeholder:text-[#5F8555] text-xl shadow-none"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="phone"
                      className="text-sm font-medium text-gray-700"
                    >
                      Phone number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      placeholder="Phone number"
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-2 h-11 bg-whitesmoke rounded-lg border border-[#C0BFC4] text-[#5F8555] placeholder:text-xl placeholder:text-[#5F8555] text-xl shadow-none"
                    />
                  </div>
                </div>
              </div>

              {/* Anonymous Donation */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="anonymous"
                  checked={anonymous}
                  onCheckedChange={(checked: boolean) => setAnonymous(checked)}
                />
                <div className="">
                  <Label
                    htmlFor="anonymous"
                    className="text-base font-normal text-[#5F8555]"
                  >
                    Donate anonymously
                  </Label>
                  <p className="font-light text-xs text-[#5F8555]">
                    Your name will not be displayed on the campaign page, but a
                    record of your donation will be stored in our database.
                  </p>
                </div>
              </div>

              {/* Comments */}
              <div>
                <Label
                  htmlFor="comments"
                  className="text-base font-normal text-[#5F8555]"
                >
                  Comments
                </Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Support the fundraiser with nice words."
                  className="mt-2 min-h-[100px] bg-whitesmoke border border-[#C0BFC4] text-sm text-[#5F8555] placeholder:text-sm placeholder:text-[#5F8555]"
                />
              </div>

              {/* Payment Instruction */}
              <div className="">
                <p className="text-xl font-medium text-[#104901]">
                  Complete by payment by clicking below and paying through
                  Stripe or Paystack. (Charges may apply)
                </p>
              </div>


              {/* Donate Button */}
              <Button
                onClick={handleDonate}
                variant="default"
                className="w-[220px] h-16 bg-[#104901] text-2xl text-white flex justify-between items-center "
              >
                Continue <ArrowRight size={24} />
              </Button>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-6">
              {/* Donation Summary */}
              <div className="bg-whitesmoke rounded-lg p-4 border border-[#C0BFC4]">
                <h3 className="font-semibold text-lg text-[#104901] mb-2">Donation Summary</h3>
                <div className="space-y-1">
                  <p className="text-[#5F8555]">Amount: <span className="font-semibold">{selectedCurrency} {amount}</span></p>
                  <p className="text-[#5F8555]">Period: <span className="font-semibold">{period}</span></p>
                  {!anonymous && <p className="text-[#5F8555]">Name: <span className="font-semibold">{fullName}</span></p>}
                  {anonymous && <p className="text-[#5F8555]">Anonymous donation</p>}
                </div>
              </div>

              {/* Payment Provider Selection */}
              <div>
                <Label className="text-base font-medium text-[#5F8555] mb-3 block">
                  Select Payment Provider
                </Label>
                <div className="grid grid-cols-1 gap-3">
                  {supportedProviders.length > 0 ? (
                    supportedProviders.map((provider, index) => {
                      const currencyCode = getCurrencyCode(selectedCurrency);
                      const { primary } = getIntelligentProviders(currencyCode);
                      const isRecommended = provider === primary;
                      
                      return (
                        <Button
                          key={provider}
                          variant={paymentProvider === provider ? "default" : "outline"}
                          className={`p-4 h-auto text-left flex items-center gap-3 relative ${
                            paymentProvider === provider
                              ? "bg-whitesmoke border border-[#C0BFC4] hover:bg-whitesmoke text-[#5F8555]"
                              : "border border-[#C0BFC4] bg-transparent hover:bg-whitesmoke text-[#5F8555]"
                          }`}
                          onClick={() => setPaymentProvider(provider)}
                        >
                          {provider === "stripe" && <Image src='/icons/stripe.png' alt='Stripe' width={16} height={16}/>}
                          {provider === "paystack" && <Image src='/icons/paystack.png' alt='Paystack' width={16} height={16}/>}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold capitalize">{provider}</div>
                              {isRecommended && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <div className="text-sm opacity-70">
                              {PROVIDER_DESCRIPTIONS[provider]}
                            </div>
                          </div>
                        </Button>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-[#5F8555]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#104901] mx-auto mb-3"></div>
                      <p>Loading payment providers...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Display */}
              {donationError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {donationError}
                </div>
              )}

              {/* Payment Button */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setStep("donate")}
                  variant="outline"
                  className="flex-1 h-12 border-2 border-[#5F8555] text-[#5F8555] hover:bg-[#5F8555] hover:text-white"
                >
                  Back
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={donationLoading}
                  variant="default"
                  className="flex-1 h-12 bg-[#104901] text-white hover:bg-[#104901] hover:text-white flex items-center justify-center gap-2"
                >
                  {donationLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      Pay Now <HandCoins size={20} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === "stripe-payment" && stripePaymentData && (
            <div className="space-y-6">
              <StripePaymentForm
                clientSecret={stripePaymentData.clientSecret}
                amount={stripePaymentData.amount}
                currency={stripePaymentData.currency}
                donationId={stripePaymentData.donationId}
                onSuccess={handleStripePaymentSuccess}
                onError={handleStripePaymentError}
                onCancel={handleStripePaymentCancel}
              />
            </div>
          )}

          {step === "thankyou" && (
            <div className="space-y-6">
              {/* View on Dashboard */}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-medium text-[#104901]">
                  View on your Dashboard
                </span>
                <Button 
                  onClick={handleViewDashboard}
                  className="w-[185px] h-16 flex justify-between items-center font-medium text-2xl bg-[#104901] text-white hover:bg-[#0d3d01] hover:text-white"
                >
                  View <Send className="ml-2" size={16} />
                </Button>
              </div>

              {/* Copy Campaign Link */}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-medium text-[#104901]">
                  Copy Campaign Link
                </span>
                <Button 
                  onClick={handleCopyLink}
                  className="w-[185px] h-16 flex justify-between items-center font-medium text-2xl bg-[#5F8555] text-white hover:bg-[#4a6b42] hover:text-white"
                >
                  {linkCopied ? (
                    <>
                      <Check className="mr-2" size={16} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2" size={16} />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>

              {/* Share your donation */}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-medium text-[#104901]">
                  Share your donation!
                </span>
                <div className="flex space-x-3">
                  <Link
                    href={generateShareUrl('facebook')}
                    target="_blank"
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Facebook strokeWidth={1.5} size={32} className="text-[#104901]" />
                  </Link>
                  <button
                    onClick={handleInstagramShare}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Instagram strokeWidth={1.5} size={32} className="text-[#104901]" />
                  </button>
                  <Link
                    href={generateShareUrl('twitter')}
                    target="_blank"
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Twitter strokeWidth={1.5} size={32} className="text-[#104901]" />
                  </Link>
                  <Link
                    href={generateShareUrl('linkedin')}
                    target="_blank"
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Linkedin strokeWidth={1.5} size={32} className="text-[#104901]" />
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

export default DonateModal;
