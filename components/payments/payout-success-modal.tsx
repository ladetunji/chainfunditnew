"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

export interface PayoutSuccessData {
  payoutId?: string;
  amount: number;
  currency: string;
  provider: string;
  status?: string;
  netAmount?: number;
  fees?: number;
  estimatedDelivery?: string;
  message?: string;
  campaignTitle?: string;
}

interface PayoutSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: PayoutSuccessData | null;
}

export function PayoutSuccessModal({
  isOpen,
  onClose,
  data,
}: PayoutSuccessModalProps) {
  const providerLabel = data?.provider
    ? data.provider.charAt(0).toUpperCase() + data.provider.slice(1)
    : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && isOpen) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <DialogTitle className="text-center text-xl text-[#104901]">
            Payout Request Submitted!
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {data?.message ??
              "We’ve received your payout request and started processing it. You’ll get an email when the transfer is complete."}
          </DialogDescription>
        </DialogHeader>

        {data && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Campaign</p>
              <p className="font-medium text-gray-900">
                {data.campaignTitle ?? "Campaign payout"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-100 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <DollarSign className="h-4 w-4 text-[#104901]" />
                  Amount
                </div>
                <p className="mt-1 text-lg font-semibold text-[#104901]">
                  {formatCurrency(data.amount, data.currency)}
                </p>
                {typeof data.netAmount === "number" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Net: {formatCurrency(data.netAmount, data.currency)}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4 text-[#104901]" />
                  Estimated arrival
                </div>
                <p className="mt-1 text-lg font-semibold text-[#104901]">
                  {data.estimatedDelivery ?? "1-3 business days"}
                </p>
                {providerLabel && (
                  <p className="text-xs text-gray-500 mt-1">
                    Provider: {providerLabel}
                  </p>
                )}
              </div>
            </div>

            {data.payoutId && (
              <div className="rounded-lg border border-gray-100 p-4 text-sm text-gray-600">
                <p className="font-medium text-gray-700 mb-1">Reference</p>
                <p className="font-mono text-xs break-all">{data.payoutId}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            onClick={onClose}
            className="bg-[#104901] text-white px-8"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

