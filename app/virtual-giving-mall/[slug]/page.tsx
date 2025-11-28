'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle,
  ArrowLeft,
  Share2,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { useGeolocationCurrency } from '@/hooks/use-geolocation-currency';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import { track } from '@/lib/analytics';

interface Charity {
  id: string;
  name: string;
  slug: string;
  description: string;
  mission: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  category: string;
  focusAreas: string[];
  logo: string;
  coverImage: string;
  isVerified: boolean;
  totalReceived: string;
  registrationNumber: string;
}

interface CharityStats {
  totalDonations: number;
  totalAmount: number;
  successfulDonations: number;
}

export default function CharityDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [charity, setCharity] = useState<Charity | null>(null);
  const [stats, setStats] = useState<CharityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);

  // Geolocation and currency detection
  const { locationInfo, loading: locationLoading, getPresetAmounts, formatAmount } = useGeolocationCurrency();

  // Donation form state
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  // Get preset amounts based on user's currency
  const presetAmounts = locationInfo ? getPresetAmounts(locationInfo.currency.code) : ['25', '50', '100', '250', '500', '1000'];

  useEffect(() => {
    if (slug) {
      fetchCharity();
    }
  }, [slug]);

  const fetchCharity = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/charities/${slug}`);
      if (!response.ok) {
        throw new Error('Charity not found');
      }
      const data = await response.json();
      setCharity(data.charity);
      setStats(data.stats);
      
      // Track charity view
      if (data.charity) {
        track("charity_viewed", {
          charity_id: data.charity.id,
          charity_name: data.charity.name,
          charity_slug: data.charity.slug,
        });
      }
    } catch (error) {
      console.error('Error fetching charity:', error);
      toast.error('Failed to load charity information');
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const donationAmount = amount === 'custom' ? customAmount : amount;
    
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    if (!donorEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setDonating(true);

    try {
      const currency = locationInfo?.currency.code || 'USD';
      
      // Track charity donation started
      track("charity_donation_started", {
        charity_id: charity?.id?.toString(),
        charity_name: charity?.name,
        charity_slug: charity?.slug,
        donation_amount: parseFloat(donationAmount),
        donation_currency: currency,
        is_anonymous: isAnonymous,
      });
      
      // Create payment intent
      const response = await fetch(`/api/charities/${charity?.id}/payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: donationAmount,
          currency,
          donorName: isAnonymous ? 'Anonymous' : donorName,
          donorEmail,
          message,
          isAnonymous,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      // Handle payment based on method
      if (data.paymentMethod === 'paystack') {
        // Redirect to Paystack payment page
        toast.success('Redirecting to payment...');
        window.location.href = data.authorizationUrl;
      } else if (data.paymentMethod === 'stripe') {
        // Store client secret for Stripe Elements
        toast.success('Redirecting to payment...');
        
        // Redirect to Stripe payment page with client secret
        const stripeUrl = `/virtual-giving-mall/${charity?.slug}/checkout?client_secret=${data.clientSecret}&donation_id=${data.donationId}`;
        window.location.href = stripeUrl;
      }

    } catch (error: any) {
      console.error('Error creating donation:', error);
      toast.error(error.message || 'Failed to process donation');
      setDonating(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-12 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!charity) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Charity Not Found</h1>
          <Button asChild>
            <Link href="/virtual-giving-mall">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to the Mall
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto mt-20 md:px-10 px-4">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/virtual-giving-mall">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to the Mall
          </Link>
        </Button>

        {/* Cover Image */}
        {charity.coverImage && (
          <div className="h-64 bg-gray-200 rounded-lg mb-6 overflow-hidden">
            <Image 
              src={charity.coverImage} 
              alt={charity.name} 
              className="w-full h-full object-cover"
              width={1000}
              height={1000}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start gap-4 mb-4">
                {charity.logo && (
                  <Image 
                    src={charity.logo} 
                    alt={charity.name} 
                    className="h-20 w-20 rounded-lg object-cover"
                    width={1000}
                    height={1000}
                  />
                )}
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    {charity.name}
                    {charity.isVerified && (
                      <Badge className="bg-blue-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </h1>
                  {charity.category && (
                    <Badge variant="outline" className="text-sm">
                      {charity.category}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg border">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatAmount(stats.totalAmount.toString(), locationInfo?.currency.code || 'USD')}
                    </p>
                    <p className="text-sm text-gray-500">Total Raised</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.totalDonations}</p>
                    <p className="text-sm text-gray-500">Donations</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{stats.successfulDonations}</p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                </div>
              )}
            </div>

            {/* Mission & Description */}
            <Card>
              <CardHeader>
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {charity.mission && (
                  <p className="text-lg text-gray-700">{charity.mission}</p>
                )}
                {charity.description && (
                  <p className="text-gray-600">{charity.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Focus Areas */}
            {charity.focusAreas && charity.focusAreas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Focus Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {charity.focusAreas.map((area, index) => (
                      <Badge key={index} variant="secondary">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {charity.email && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="h-5 w-5" />
                    <a href={`mailto:${charity.email}`} className="hover:text-blue-600">
                      {charity.email}
                    </a>
                  </div>
                )}
                {charity.phone && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="h-5 w-5" />
                    <a href={`tel:${charity.phone}`} className="hover:text-blue-600">
                      {charity.phone}
                    </a>
                  </div>
                )}
                {charity.website && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Globe className="h-5 w-5" />
                    <a 
                      href={charity.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-blue-600"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
                {(charity.address || charity.city || charity.country) && (
                  <div className="flex items-start gap-3 text-gray-600">
                    <MapPin className="h-5 w-5 mt-0.5" />
                    <div>
                      {charity.address && <p>{charity.address}</p>}
                      <p>
                        {[charity.city, charity.state, charity.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Donation Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Make a Donation
                </CardTitle>
                <CardDescription>
                  Your support helps {charity.name} continue their important work
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDonate} className="space-y-4">
                  {/* Amount Selection */}
                  <div className="space-y-2">
                    <Label>
                      Select Amount ({locationInfo?.currency.code || 'USD'})
                      {/* {locationInfo && (
                        <span className="text-sm text-gray-500 ml-2">
                          ({locationInfo.country})
                        </span>
                      )} */}
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {presetAmounts.map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          variant={amount === preset ? 'default' : 'outline'}
                          onClick={() => setAmount(preset)}
                          className="w-full"
                        >
                          {formatAmount(preset, locationInfo?.currency.code || 'USD')}
                        </Button>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant={amount === 'custom' ? 'default' : 'outline'}
                      onClick={() => setAmount('custom')}
                      className="w-full"
                    >
                      Custom Amount
                    </Button>
                    {amount === 'custom' && (
                      <Input
                        type="number"
                        placeholder={`Enter amount in ${locationInfo?.currency.code || 'USD'}`}
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        min="1"
                        step={locationInfo?.currency.code === 'NGN' ? '1' : '0.01'}
                      />
                    )}
                  </div>

                  {/* Donor Information */}
                  <div className="space-y-2">
                    <Label htmlFor="donorName">Your Name (Optional)</Label>
                    <Input
                      id="donorName"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="John Doe"
                      disabled={isAnonymous}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="donorEmail">Email Address *</Label>
                    <Input
                      id="donorEmail"
                      type="email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Leave a message of support..."
                      rows={3}
                    />
                  </div>

                  {/* Anonymous Donation */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="anonymous" className="cursor-pointer">
                      Donate anonymously
                    </Label>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="stripe" id="stripe" />
                        <Label htmlFor="stripe" className="cursor-pointer">
                          Credit/Debit Card (Stripe)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="paystack" id="paystack" />
                        <Label htmlFor="paystack" className="cursor-pointer">
                          Paystack
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Security Badge */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                    <Shield className="h-4 w-4" />
                    <span>Secure and encrypted payment</span>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={donating || !amount}
                  >
                    {donating ? 'Processing...' : `Donate ${amount && amount !== 'custom' ? formatAmount(amount, locationInfo?.currency.code || 'USD') : customAmount ? formatAmount(customAmount, locationInfo?.currency.code || 'USD') : ''}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

