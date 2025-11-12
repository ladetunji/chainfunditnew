'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Share2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface Donation {
  id: string;
  amount: string;
  currency: string;
  donorName: string;
  donorEmail: string;
  charityId: string;
  paymentStatus: string;
  createdAt: string;
}

interface Charity {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const [donation, setDonation] = useState<Donation | null>(null);
  const [charity, setCharity] = useState<Charity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent');
    const donationId = searchParams.get('donation_id');

    if (paymentIntentId || donationId) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Fetch donation details
      fetchDonationDetails(donationId);
    }
  }, [searchParams]);

  const fetchDonationDetails = async (donationId: string | null) => {
    try {
      if (!donationId) return;

      // Fetch donation
      const donationRes = await fetch(`/api/charities/donations/${donationId}`);
      const donationData = await donationRes.json();
      setDonation(donationData);

      // Fetch charity
      const charityRes = await fetch(`/api/charities/${donationData.charityId}`);
      const charityData = await charityRes.json();
      
      // Handle both direct charity object or wrapped in 'charity' key
      const charity = charityData.charity || charityData;
      setCharity(charity);
    } catch (error) {
      console.error('Error fetching donation details:', error);
      toast.error('Could not load donation details');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share && charity) {
      navigator.share({
        title: `I just donated to ${charity.name}`,
        text: `I just made a donation to support ${charity.name}. Join me in making a difference!`,
        url: window.location.origin + `/virtual-giving-mall/${charity.slug}`,
      });
    } else {
      toast.success('Link copied to clipboard!');
      navigator.clipboard.writeText(window.location.origin + `/virtual-giving-mall/${charity?.slug}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl text-green-600">
              Thank You for Your Generosity!
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Your donation has been successfully processed
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Donation Details */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Donation Amount</span>
                <span className="text-2xl font-bold text-green-600">
                  {donation?.currency === 'NGN' ? '₦' : 
                   donation?.currency === 'GBP' ? '£' : 
                   donation?.currency === 'EUR' ? '€' : '$'}
                  {parseFloat(donation?.amount || '0').toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Recipient</span>
                <span className="font-medium text-gray-900">{charity?.name}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Donation ID</span>
                <span className="font-mono text-sm text-gray-600">
                  {donation?.id.slice(0, 8)}...
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Completed
                </span>
              </div>
            </div>

            {/* Email Confirmation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                📧 A confirmation email has been sent to{' '}
                <span className="font-medium">{donation?.donorEmail}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.print()}
              >
                <Download className="h-4 w-4 mr-2" />
                Receipt
              </Button>
            </div>

            {/* Navigation */}
            <div className="pt-4 space-y-3">
              <Button asChild className="w-full" size="lg">
                <Link href={`/virtual-giving-mall/${charity?.slug}`}>
                  Back to {charity?.name}
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/virtual-giving-mall">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Browse More Charities
                </Link>
              </Button>
            </div>

            {/* Impact Message */}
            <div className="text-center pt-6 border-t">
              <p className="text-gray-600 italic">
                Your contribution helps {charity?.name} continue their important work.
                Together, we&apos;re making a difference! 🌟
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

