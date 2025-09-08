"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Share2, Eye, Calendar, User, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrencyWithConversion } from '@/lib/utils/currency';
import { GeolocationData } from '@/lib/utils/geolocation';

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
  closedAt: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  stats?: {
    totalDonations: number;
    totalAmount: number;
    uniqueDonors: number;
    progressPercentage: number;
  };
}

interface CampaignCardProps {
  campaign: Campaign;
  viewMode: 'grid' | 'list';
  geolocation?: GeolocationData | null;
  convertedAmounts?: {
    currentAmount: { amount: number; currency: string; originalAmount?: number; originalCurrency?: string };
    goalAmount: { amount: number; currency: string; originalAmount?: number; originalCurrency?: string };
  } | null;
}

export function CampaignCard({ campaign, viewMode, geolocation, convertedAmounts }: CampaignCardProps) {
  const progressPercentage = campaign.stats?.progressPercentage || 
    Math.min(100, Math.round((campaign.currentAmount / campaign.goalAmount) * 100));

  // Use converted amounts if available, otherwise use original amounts
  const displayCurrentAmount = convertedAmounts?.currentAmount || { amount: campaign.currentAmount, currency: campaign.currency };
  const displayGoalAmount = convertedAmounts?.goalAmount || { amount: campaign.goalAmount, currency: campaign.currency };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="md:w-1/3 relative">
            <Image
              src={campaign.coverImageUrl || '/images/card-img1.png'}
              alt={campaign.title}
              width={400}
              height={300}
              className="w-full h-48 md:h-full object-cover"
            />
            <div className="absolute top-3 left-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="md:w-2/3 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {campaign.title}
                  </h3>
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {campaign.description}
                  </p>
                </div>
              </div>

              {/* Creator Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{campaign.creatorName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{formatDate(campaign.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{campaign.reason}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>{formatCurrencyWithConversion(displayCurrentAmount.amount, displayCurrentAmount.currency, displayCurrentAmount.originalAmount, displayCurrentAmount.originalCurrency)} raised</span>
                  <span>Goal: {formatCurrencyWithConversion(displayGoalAmount.amount, displayGoalAmount.currency, displayGoalAmount.originalAmount, displayGoalAmount.originalCurrency)}</span>
                </div>
              </div>

              {/* Stats */}
              {campaign.stats && (
                <div className="flex gap-6 text-sm text-gray-600 mb-4">
                  <span>{campaign.stats.totalDonations} donations</span>
                  <span>{campaign.stats.uniqueDonors} donors</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Heart className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
              <Link href={`/campaign/${campaign.id}`}>
                <Button className="">
                  <Eye className="h-4 w-4 mr-2" />
                  View Campaign
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Image */}
      <div className="relative">
        <Image
          src={campaign.coverImageUrl || '/images/card-img1.png'}
          alt={campaign.title}
          width={400}
          height={300}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/80 hover:bg-white">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
            {campaign.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {campaign.description}
          </p>
        </div>

        {/* Creator */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-3 w-3 text-gray-500" />
          </div>
          <span className="text-sm text-gray-600">{campaign.creatorName}</span>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>{formatCurrencyWithConversion(displayCurrentAmount.amount, displayCurrentAmount.currency, displayCurrentAmount.originalAmount, displayCurrentAmount.originalCurrency)}</span>
            <span>{formatCurrencyWithConversion(displayGoalAmount.amount, displayGoalAmount.currency, displayGoalAmount.originalAmount, displayGoalAmount.originalCurrency)}</span>
          </div>
        </div>

        {/* Category and Date */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>{campaign.reason}</span>
          <span>{formatDate(campaign.createdAt)}</span>
        </div>

        {/* Action Button */}
        <Link href={`/campaign/${campaign.id}`} className="block">
          <Button className="w-full">
            View Campaign
          </Button>
        </Link>
      </div>
    </div>
  );
}

