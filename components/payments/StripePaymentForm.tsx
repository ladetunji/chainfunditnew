"use client";

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { HandCoins, CheckCircle, XCircle } from 'lucide-react';

// Initialize Stripe
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
console.log('Stripe publishable key:', stripePublishableKey ? 'Set' : 'Missing');
const stripePromise = loadStripe(stripePublishableKey!);

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  donationId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  donationId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  clientSecret,
  amount,
  currency,
  donationId,
  onSuccess,
  onError,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // Debug Stripe loading
  useEffect(() => {
    console.log('Stripe loaded:', !!stripe);
    console.log('Elements loaded:', !!elements);
  }, [stripe, elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe has not loaded yet. Please try again.');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found. Please try again.');
      setIsProcessing(false);
      setPaymentStatus('error');
      return;
    }

    try {
      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        console.error('Payment failed:', error);
        onError(error.message || 'Payment failed. Please try again.');
        setPaymentStatus('error');
        toast.error(error.message || 'Payment failed. Please try again.');
      } else if (paymentIntent.status === 'succeeded') {
        // Call our callback endpoint to update the donation status
        try {
          const callbackResponse = await fetch('/api/payments/stripe/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              donationId,
              paymentIntentId: paymentIntent.id,
              status: paymentIntent.status,
            }),
          });

          if (callbackResponse.ok) {
            const callbackResult = await callbackResponse.json();
            console.log('Donation status updated:', callbackResult);
            setPaymentStatus('success');
            toast.success('Payment successful! Thank you for your donation.');
            onSuccess();
          } else {
            const errorData = await callbackResponse.json();
            console.error('Failed to update donation status:', errorData);
            onError('Payment succeeded but failed to update donation status. Please contact support.');
            setPaymentStatus('error');
          }
        } catch (callbackError) {
          console.error('Callback error:', callbackError);
          onError('Payment succeeded but failed to update donation status. Please contact support.');
          setPaymentStatus('error');
        }
      } else {
        onError('Payment was not completed. Please try again.');
        setPaymentStatus('error');
        toast.error('Payment was not completed. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      onError(errorMessage);
      setPaymentStatus('error');
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#5F8555',
        fontFamily: 'system-ui, sans-serif',
        '::placeholder': {
          color: '#9CA3AF',
        },
        padding: '12px',
      },
      invalid: {
        color: '#EF4444',
        iconColor: '#EF4444',
      },
    },
    hidePostalCode: false,
  };

  if (paymentStatus === 'success') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-[#104901] mb-2">Payment Successful!</h3>
        <p className="text-[#5F8555] mb-4">Thank you for your generous donation.</p>
        <Button
          onClick={onSuccess}
          className="bg-[#104901] text-white hover:bg-[#0d3d01]"
        >
          Continue
        </Button>
      </div>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <div className="text-center py-8">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-600 mb-2">Payment Failed</h3>
        <p className="text-[#5F8555] mb-4">There was an issue processing your payment.</p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-[#5F8555] text-[#5F8555] hover:bg-[#5F8555] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={() => setPaymentStatus('idle')}
            className="bg-[#104901] text-white hover:bg-[#0d3d01]"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state if Stripe isn't ready
  if (!stripe || !elements) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#104901] mx-auto mb-4"></div>
        <p className="text-[#5F8555]">Loading payment form...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Amount Display */}
      <div className="bg-[#F2F1E9] rounded-lg p-4 border border-[#C0BFC4]">
        <h3 className="font-semibold text-lg text-[#104901] mb-2">Payment Details</h3>
        <div className="space-y-1">
          <p className="text-[#5F8555]">Amount: <span className="font-semibold">{currency} {amount}</span></p>
          <p className="text-[#5F8555]">Payment Method: <span className="font-semibold">Credit/Debit Card</span></p>
        </div>
      </div>

      {/* Card Element */}
      <div>
        <label className="text-base font-medium text-[#5F8555] mb-3 block">
          Card Information
        </label>
        <div className="bg-white border border-[#C0BFC4] rounded-lg p-4">
          <CardElement options={cardElementOptions} />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Your payment information is secure and encrypted.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1 h-12 border-2 border-[#5F8555] text-[#5F8555] hover:bg-[#5F8555] hover:text-white"
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 h-12 bg-[#104901] text-white hover:bg-[#104901] hover:text-white flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <>
              Pay {currency} {amount} <HandCoins size={20} />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default StripePaymentForm;
