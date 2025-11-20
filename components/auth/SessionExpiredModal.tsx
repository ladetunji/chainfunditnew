"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SessionExpiredModal({ isOpen, onClose }: SessionExpiredModalProps) {
  const router = useRouter();

  const handleLoginRedirect = () => {
    onClose();
    router.push('/signin'); // Your signin page path
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            Session Expired
          </h2>
        </div>
        
        <p className="text-gray-600 mb-6">
          Your session has expired for security reasons. Please log in again to continue using the application.
        </p>
        
        <div className="flex gap-3 justify-end">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="px-4 py-2 cursor-pointer"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleLoginRedirect}
            className="px-4 py-2 cursor-pointer"
          >
            Log In
          </Button>
        </div>
      </div>
    </div>
  );
}
