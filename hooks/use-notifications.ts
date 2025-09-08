import { useState, useEffect } from 'react';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: string;
  createdAt: string;
  readAt?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async (unreadOnly: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/notifications?unreadOnly=${unreadOnly}&limit=20`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch notifications');
      }

      setNotifications(result.notifications);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to mark notifications as read');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString()
        }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
