"use client";

import React, { useState, useEffect } from 'react';
import { useSessionTimeout } from '@/hooks/use-session-timeout';
import { useAuth } from '@/hooks/use-auth';
import SessionWarningModal from '@/components/auth/SessionWarningModal';
import SessionTimeoutModal from '@/components/auth/SessionTimeoutModal';

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
  config?: {
    timeoutMinutes?: number;
    checkInterval?: number;
  };
}

const SessionTimeoutProvider: React.FC<SessionTimeoutProviderProps> = ({
  children,
  config = {},
}) => {
  const [isClient, setIsClient] = useState(false);
  const { user, logout } = useAuth();

  // Call the hook before any conditional returns to follow React Hook rules
  const sessionTimeoutData = useSessionTimeout({
    ...config,
    user,
    logout,
  });

  // Only render on client side to prevent SSR issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything on server side
  if (!isClient) {
    return <>{children}</>;
  }
  // Destructure with safe defaults
  const {
    showTimeoutModal = false,
    showWarningModal = false,
    timeRemaining = null,
    extendSession = () => {},
    closeTimeoutModal = () => {},
    handleSessionExpired = () => {},
  } = sessionTimeoutData || {};

  const handleLogin = () => {
    if (typeof handleSessionExpired === 'function') {
      handleSessionExpired();
    } else {
      console.warn('SessionTimeoutProvider: handleSessionExpired is not a function:', typeof handleSessionExpired);
    }
  };

  return (
    <>
      {children}
      
      {/* Session Warning Modal */}
      <SessionWarningModal
        isOpen={showWarningModal}
        onClose={closeTimeoutModal}
        onExtend={extendSession}
        timeRemaining={timeRemaining}
      />
      
      {/* Session Timeout Modal */}
      <SessionTimeoutModal
        isOpen={showTimeoutModal}
        onClose={closeTimeoutModal}
        onLogin={handleLogin}
      />
    </>
  );
};

export default SessionTimeoutProvider;

