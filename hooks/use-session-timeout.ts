"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface SessionTimeoutConfig {
  timeoutMinutes?: number; // Default: 120 minutes (2 hours)
  warningMinutes?: number; // Default: 15 minutes before expiry
  checkInterval?: number; // Default: 1 minute
  enabled?: boolean; // Default: true - set to false to disable session timeout
  user?: any; // User object from auth
  logout?: () => Promise<void>; // Logout function from auth
}

export const useSessionTimeout = (config: SessionTimeoutConfig = {}) => {
  
  const {
    timeoutMinutes = 120, // Default: 120 minutes (2 hours)
    warningMinutes = 15, // Default: 15 minutes before expiry
    checkInterval = 60000, // 1 minute in milliseconds
    enabled = true, // Default: true - set to false to disable session timeout
    user = null,
    logout = () => Promise.resolve(),
  } = config;

  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  const lastActivityRef = useRef<number>(Date.now());
  const sessionStartRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);


  // Reset session timer on user activity - simplified for React 19 compatibility
  const resetSessionTimer = useCallback(() => {
    if (user) {
      lastActivityRef.current = Date.now();
      sessionStartRef.current = Date.now();
      setTimeRemaining(null);
      
      // Clear existing timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      
      // Set new timers
      const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000;
      const timeoutTime = timeoutMinutes * 60 * 1000;
      
      // Show warning modal
      warningRef.current = setTimeout(() => {
        if (user) {
          setShowWarningModal(true);
          setTimeRemaining(warningMinutes * 60);
        }
      }, warningTime);
      
      // Show timeout modal
      timeoutRef.current = setTimeout(() => {
        if (user) {
          setShowTimeoutModal(true);
          setShowWarningModal(false);
        }
      }, timeoutTime);
    }
  }, [user, timeoutMinutes, warningMinutes]);

  // Handle user activity events
  const handleUserActivity = useCallback(() => {
    if (user) {
      resetSessionTimer();
    }
  }, [user, resetSessionTimer]);

  // Logout and redirect to login
  const handleSessionExpired = useCallback(async () => {
    try {
      if (logout && typeof logout === 'function') {
        await logout();
      } else {
        // Fallback: clear local state and redirect
        window.location.href = '/signin';
      }
      setShowTimeoutModal(false);
      setShowWarningModal(false);
    } catch (error) {
      console.error('Error during logout:', error);
      setShowTimeoutModal(false);
      setShowWarningModal(false);
      // Fallback redirect
      window.location.href = '/signin';
    }
  }, [logout]);

  // Extend session
  const extendSession = useCallback(() => {
    if (user) {
      resetSessionTimer();
      setShowWarningModal(false);
      setShowTimeoutModal(false);
    }
  }, [user, resetSessionTimer]);

  // Close modals
  const closeTimeoutModal = useCallback(() => {
    setShowTimeoutModal(false);
    setShowWarningModal(false);
  }, []);


  // Set up activity listeners
  useEffect(() => {
    if (!user || !enabled) {
      // Clear timers if no user or if session timeout is disabled
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      setShowTimeoutModal(false);
      setShowWarningModal(false);
      return;
    }

    // Initialize session timer
    resetSessionTimer();

    // Activity event listeners
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus',
      'visibilitychange'
    ];

    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Periodic check for session expiry
    const intervalId = setInterval(() => {
      if (user) {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityRef.current;
        const sessionDuration = now - sessionStartRef.current;
        
        // Only expire session if there's been no activity for the timeout period
        if (timeSinceLastActivity > timeoutMinutes * 60 * 1000) {
          handleSessionExpired();
        } else if (timeSinceLastActivity > (timeoutMinutes - warningMinutes) * 60 * 1000) {
          // Show warning if approaching expiry
          const remaining = Math.max(0, timeoutMinutes * 60 - timeSinceLastActivity);
          setTimeRemaining(Math.floor(remaining / 1000));
        }
      }
    }, checkInterval);

    return () => {
      // Cleanup event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      
      // Cleanup timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      
      // Cleanup interval
      clearInterval(intervalId);
    };
  }, [user, timeoutMinutes, warningMinutes, checkInterval, handleUserActivity, resetSessionTimer, handleSessionExpired]);

  // Update countdown for warning modal
  useEffect(() => {
    if (showWarningModal && timeRemaining !== null && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev !== null ? Math.max(0, prev - 1) : null);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (showWarningModal && timeRemaining === 0) {
      // Auto-logout when warning countdown reaches 0
      handleSessionExpired();
    }
  }, [showWarningModal, timeRemaining, handleSessionExpired]);


  return {
    showTimeoutModal,
    showWarningModal,
    timeRemaining,
    extendSession,
    closeTimeoutModal,
    handleSessionExpired,
  };
};

