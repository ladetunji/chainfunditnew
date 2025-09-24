"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/currency";
import { useFileUpload } from "@/hooks/use-upload";

interface CampaignFormData {
  title: string;
  subtitle: string;
  description: string;
  reason: string;
  fundraisingFor: string;
  duration: string;
  videoUrl: string;
  coverImageUrl: string;
  goalAmount: number;
  currency: string;
  minimumDonation: number;
  chainerCommissionRate: number;
}

interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  reason: string;
  fundraisingFor: string;
  duration: string;
  videoUrl: string;
  coverImageUrl: string;
  galleryImages: string[];
  documents: string[];
  goalAmount: number;
  currency: string;
  minimumDonation: number;
  chainerCommissionRate: number;
  currentAmount: number;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  stats?: {
    totalDonations: number;
    totalAmount: number;
    uniqueDonors: number;
    progressPercentage: number;
  };
}

export default function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const [campaignId, setCampaignId] = useState<string>("");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState<CampaignFormData>({
    title: "",
    subtitle: "",
    description: "",
    reason: "",
    fundraisingFor: "",
    duration: "",
    videoUrl: "",
    coverImageUrl: "",
    goalAmount: 0,
    currency: "NGN",
    minimumDonation: 0,
    chainerCommissionRate: 0,
  });

  const [newCoverImage, setNewCoverImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { uploadFile, isUploading: isUploadingImage, uploadError: imageUploadError } = useFileUpload();

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const { id } = await params;
        setCampaignId(id);
        
        const response = await fetch(`/api/campaigns/${id}`);
        const result = await response.json();
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Campaign not found");
          } else if (response.status === 403) {
            setUnauthorized(true);
          } else {
            setError(result.error || "Failed to load campaign");
          }
          return;
        }
        
        if (!result.success) {
          setError(result.error || "Failed to load campaign");
          return;
        }
        
        const campaignData = result.data;
        setCampaign(campaignData);
        
        // Check if user is the creator
        const userResponse = await fetch("/api/user/profile");
        const userResult = await userResponse.json();
        
        if (!userResponse.ok || !userResult.success || userResult.user.id !== campaignData.creatorId) {
          setUnauthorized(true);
          return;
        }
        
        // Populate form data
        setFormData({
          title: campaignData.title || "",
          subtitle: campaignData.subtitle || "",
          description: campaignData.description || "",
          reason: campaignData.reason || "",
          fundraisingFor: campaignData.fundraisingFor || "",
          duration: campaignData.duration || "",
          videoUrl: campaignData.videoUrl || "",
          coverImageUrl: campaignData.coverImageUrl || "",
          goalAmount: campaignData.goalAmount || 0,
          currency: campaignData.currency || "NGN",
          minimumDonation: campaignData.minimumDonation || 0,
          chainerCommissionRate: campaignData.chainerCommissionRate || 0,
        });
        
      } catch (err) {
        console.error("Error loading campaign:", err);
        setError("Failed to load campaign");
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [params]);

  const handleInputChange = (field: keyof CampaignFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (file: File) => {
    try {
      const result = await uploadFile(file, 'imageUpload');
      
      setFormData(prev => ({
        ...prev,
        coverImageUrl: result.url
      }));
      setNewCoverImage(file);
      setPreviewImage(URL.createObjectURL(file));
      
    } catch (error) {
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const removeImage = () => {
    setNewCoverImage(null);
    setPreviewImage(null);
    setFormData(prev => ({
      ...prev,
      coverImageUrl: campaign?.coverImageUrl || ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update campaign");
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to update campaign");
      }

      // Redirect to campaign page
      router.push(`/campaign/${campaignId}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update campaign");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full 2xl:container 2xl:mx-auto p-6 bg-gradient-to-br from-green-50 via-white to-green-50 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#104901] mx-auto mb-4" />
            <p className="text-lg text-[#757575]">Loading campaign...</p>
          </div>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="w-full 2xl:container 2xl:mx-auto p-6 bg-gradient-to-br from-green-50 via-white to-green-50 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-semibold text-black mb-2">Access Denied</h2>
            <p className="text-lg text-[#757575] mb-4">
              You can only edit campaigns that you created.
            </p>
            <Button 
              onClick={() => router.back()} 
              className="bg-[#104901] text-white px-6 py-3 rounded-lg hover:bg-[#0d3a01] transition-colors"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="w-full 2xl:container 2xl:mx-auto p-6 bg-gradient-to-br from-green-50 via-white to-green-50 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-2xl font-semibold text-black mb-2">Something went wrong</h2>
            <p className="text-lg text-[#757575] mb-4">
              {error || "We couldn't load the campaign. Please try again later."}
            </p>
            <Button 
              onClick={() => router.back()} 
              className="bg-[#104901] text-white px-6 py-3 rounded-lg transition-colors"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full 2xl:container 2xl:mx-auto p-6 bg-gradient-to-br from-green-50 via-white to-green-50 min-h-screen">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-[#104901] rounded-3xl blur opacity-10"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="text-[#104901] border-[#104901] hover:bg-[#104901] hover:text-white rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-[#104901]">Edit Campaign</h1>
          </div>

          {/* Campaign Preview */}
          <div className="mb-8 p-6 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-4 mb-4">
              {campaign.coverImageUrl && (
                <Image
                  src={campaign.coverImageUrl}
                  alt={campaign.title}
                  width={80}
                  height={80}
                  className="rounded-xl object-cover"
                />
              )}
              <div>
                <h3 className="font-semibold text-lg text-[#104901]">{campaign.title}</h3>
                <p className="text-sm text-gray-600">Current Status: {campaign.status}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Raised:</span>
                <p className="font-semibold">{formatCurrency(campaign.currentAmount || 0, campaign.currency)}</p>
              </div>
              <div>
                <span className="text-gray-600">Goal:</span>
                <p className="font-semibold">{formatCurrency(campaign.goalAmount || 0, campaign.currency)}</p>
              </div>
              <div>
                <span className="text-gray-600">Donors:</span>
                <p className="font-semibold">{campaign.stats?.uniqueDonors || 0}</p>
              </div>
              <div>
                <span className="text-gray-600">Progress:</span>
                <p className="font-semibold">{campaign.stats?.progressPercentage || 0}%</p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cover Image Upload */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <label className="block text-sm font-medium text-[#104901] mb-4">
                Campaign Cover Image
              </label>
              
              <div className="flex items-start gap-6">
                {/* Current/Preview Image */}
                <div className="relative">
                  {(previewImage || formData.coverImageUrl) && (
                    <div className="relative group">
                      <Image
                        src={previewImage || formData.coverImageUrl}
                        alt="Campaign cover"
                        width={120}
                        height={120}
                        className="rounded-xl object-cover border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1">
                  <div className="space-y-4">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="cover-image-upload"
                      />
                      <label
                        htmlFor="cover-image-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#104901] text-white rounded-xl cursor-pointer hover:bg-[#0a3d00] transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        {isUploadingImage ? "Uploading..." : "Choose New Image"}
                      </label>
                    </div>
                    
                    {imageUploadError && (
                      <p className="text-red-600 text-sm">{imageUploadError}</p>
                    )}
                    
                    <p className="text-sm text-gray-600">
                      Recommended size: 800x600px. Max file size: 5MB. Supported formats: JPG, PNG, WebP.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#104901] mb-2">
                  Campaign Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter campaign title"
                  className="rounded-xl border-gray-300 focus:border-[#104901] focus:ring-[#104901]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#104901] mb-2">
                  Subtitle
                </label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => handleInputChange("subtitle", e.target.value)}
                  placeholder="Enter campaign subtitle"
                  className="rounded-xl border-gray-300 focus:border-[#104901] focus:ring-[#104901]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#104901] mb-2">
                  Category
                </label>
                <div className="px-3 py-1 text-[#104901] shadow-sm rounded-xl border border-gray-300 focus:border-[#104901] focus:ring-[#104901]">
                  {formData.reason || "Not specified"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#104901] mb-2">
                  Fundraising For
                </label>
                <div className="px-3 py-1 text-[#104901] shadow-sm rounded-xl border border-gray-300 focus:border-[#104901] focus:ring-[#104901]">
                  {formData.fundraisingFor || "Not specified"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#104901] mb-2">
                  Duration
                </label>
                <Input
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  placeholder="e.g., 30 days, 3 months"
                  className="rounded-xl border-gray-300 focus:border-[#104901] focus:ring-[#104901]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#104901] mb-2">
                  Video URL
                </label>
                <Input
                  value={formData.videoUrl}
                  onChange={(e) => handleInputChange("videoUrl", e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="rounded-xl border-gray-300 focus:border-[#104901] focus:ring-[#104901]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#104901] mb-2">
                  Goal Amount *
                </label>
                <Input
                  type="number"
                  value={formData.goalAmount}
                  onChange={(e) => handleInputChange("goalAmount", parseFloat(e.target.value) || 0)}
                  placeholder="Enter goal amount"
                  className="rounded-xl border-gray-300 focus:border-[#104901] focus:ring-[#104901]"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#104901] mb-2">
                  Currency *
                </label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleInputChange("currency", value)}
                >
                  <SelectTrigger className="rounded-xl border-gray-300 focus:border-[#104901] focus:ring-[#104901]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN (Naira)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    <SelectItem value="CAD">CAD (Canadian Dollar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#104901] mb-2">
                  Minimum Donation
                </label>
                <Input
                  type="number"
                  value={formData.minimumDonation}
                  onChange={(e) => handleInputChange("minimumDonation", parseFloat(e.target.value) || 0)}
                  placeholder="Enter minimum donation"
                  className="rounded-xl border-gray-300 focus:border-[#104901] focus:ring-[#104901]"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#104901] mb-2">
                  Chainer Commission Rate (%)
                </label>
                <Input
                  type="number"
                  value={formData.chainerCommissionRate}
                  onChange={(e) => handleInputChange("chainerCommissionRate", parseFloat(e.target.value) || 0)}
                  placeholder="Enter commission rate"
                  className="rounded-xl border-gray-300 focus:border-[#104901] focus:ring-[#104901]"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#104901] mb-2">
                Description *
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Tell your story and why people should support your campaign..."
                rows={6}
                className="rounded-xl border-gray-300 focus:border-[#104901] focus:ring-[#104901]"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="text-[#104901] border-[#104901] hover:bg-[#104901] hover:text-white rounded-xl px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-green-600 to-[#104901] text-white hover:text-white rounded-xl px-8 py-2 hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
