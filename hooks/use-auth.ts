"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  fullName: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Get current user from auth token
  const getCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use the same endpoint as the user profile system
      const response = await fetch('/api/user/profile', {
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.success && userData.user) {
          setUser(userData.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // This would typically call the Better Auth login endpoint
      // After successful login, refresh user data
      await getCurrentUser();
    } catch (error) {
      console.error('Error in login:', error);
    }
  }, [getCurrentUser]);

  const logout = useCallback(async () => {
    try {
      // Call logout API to clear server-side session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Clear user state
      setUser(null);
      
      // Clear any local storage items
      localStorage.removeItem('otp_login_type');
      localStorage.removeItem('otp_login_identifier');
      localStorage.removeItem('link_phone_number');
      localStorage.removeItem('link_phone_email');
      
      // Redirect to signin page
      window.location.href = '/signin';
    } catch (error) {
      console.error('Error during logout:', error);
      setUser(null);
      // Still redirect even if logout API fails
      window.location.href = '/signin';
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      await getCurrentUser();
    } catch (error) {
      console.error('Error in signup:', error);
    }
  }, [getCurrentUser]);

  return {
    user,
    loading,
    login,
    logout,
    signup,
    refreshUser: getCurrentUser,
  };
} 