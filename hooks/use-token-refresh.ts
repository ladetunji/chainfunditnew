"use client";

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from './use-auth';
import { SessionExpiredModal } from '@/components/auth/SessionExpiredModal';

/**
 * Hook to automatically refresh access tokens before they expire
 * This provides a seamless user experience by keeping users logged in
 * as long as their refresh token is valid.
 */
export function useTokenRefresh() {
  const { user, logout } = useAuth();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);

  const refreshToken = useCallback(async () => {
    // Prevent concurrent refresh attempts
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        console.error('Token refresh failed:', response.statusText);
        
        // Show session expired modal instead of immediate logout
        setShowSessionExpiredModal(true);
        return false;
      }

      const data = await response.json();
      
      if (data.success) {
        // console.log('Token refreshed successfully');
        return true;
      } else {
        console.error('Token refresh failed:', data.error);
        
        // Show session expired modal instead of immediate logout
        setShowSessionExpiredModal(true);
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [logout]);

  useEffect(() => {
    // Only set up auto-refresh if user is logged in
    if (!user) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    // Refresh token every 25 minutes (before 30-minute expiry)
    // This ensures the token is always fresh
    const REFRESH_INTERVAL = 25 * 60 * 1000; // 25 minutes in milliseconds

    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Set up new interval
    refreshIntervalRef.current = setInterval(() => {
      refreshToken();
    }, REFRESH_INTERVAL);

    // Refresh immediately on mount if user is logged in
    // This handles cases where the page was loaded with an expired token
    refreshToken();

    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [user, refreshToken]);

  const closeSessionExpiredModal = useCallback(() => {
    setShowSessionExpiredModal(false);
  }, []);

  const handleSessionExpiredLogin = useCallback(async () => {
    setShowSessionExpiredModal(false);
    if (logout) {
      await logout();
    }
  }, [logout]);

  return {
    refreshToken,
    showSessionExpiredModal,
    closeSessionExpiredModal,
    handleSessionExpiredLogin,
  };
}

/**
 * Higher-order component to wrap your app with automatic token refresh
 * Usage: wrap your app layout or providers with this component
 */
export function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  const { 
    showSessionExpiredModal, 
    closeSessionExpiredModal, 
    handleSessionExpiredLogin 
  } = useTokenRefresh();

  return React.createElement(React.Fragment, null, [
    children,
    React.createElement('div', { key: 'session-modal' }, 
      React.createElement(SessionExpiredModal, {
        isOpen: showSessionExpiredModal,
        onClose: closeSessionExpiredModal,
      })
    )
  ]);
}


