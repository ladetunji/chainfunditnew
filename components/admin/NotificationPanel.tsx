'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, Archive, AlertTriangle, Info, Users, DollarSign, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  normalizeActionUrl,
  isInternalActionUrl,
  shouldOpenInNewTab,
} from '@/lib/notifications/url-utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'user' | 'campaign' | 'donation' | 'payout' | 'security';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
  readAt?: string;
}

interface NotificationStats {
  unread: number;
  read: number;
  urgent: number;
  total: number;
}

const getNotificationIcon = (type: string, priority: string) => {
  if (priority === 'urgent') return <AlertTriangle className="h-4 w-4 text-red-500" />;
  
  switch (type) {
    case 'system': return <Shield className="h-4 w-4 text-blue-500" />;
    case 'user': return <Users className="h-4 w-4 text-green-500" />;
    case 'campaign': return <Info className="h-4 w-4 text-purple-500" />;
    case 'donation': return <DollarSign className="h-4 w-4 text-green-500" />;
    case 'payout': return <DollarSign className="h-4 w-4 text-orange-500" />;
    case 'security': return <Shield className="h-4 w-4 text-red-500" />;
    default: return <Info className="h-4 w-4 text-gray-500" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'border-l-red-500 bg-red-50';
    case 'high': return 'border-l-orange-500 bg-orange-50';
    case 'medium': return 'border-l-blue-500 bg-blue-50';
    case 'low': return 'border-l-gray-500 bg-gray-50';
    default: return 'border-l-gray-500 bg-gray-50';
  }
};

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ unread: 0, read: 0, urgent: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  // Fetch notifications and stats
  const fetchData = async () => {
    setLoading(true);
    try {
      const [notificationsRes, statsRes] = await Promise.all([
        fetch('/api/admin/notifications?limit=10'),
        fetch('/api/admin/notifications/stats')
      ]);

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData.notifications || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationAction = async (id: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        await fetchData(); // Refresh data
        toast.success(`Notification ${action.replace('_', ' ')}`);
      }
    } catch (error) {
      console.error('Error updating notification:', error);
      toast.error('Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => n.status === 'unread');
      await Promise.all(
        unreadNotifications.map(n => 
          fetch(`/api/admin/notifications/${n.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'mark_read' }),
          })
        )
      );
      await fetchData();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {stats.unread > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs">
            {stats.unread}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-12 z-50 w-96 bg-white rounded-lg shadow-lg border">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Notifications</h3>
                <div className="flex items-center gap-2">
                  {stats.unread > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                <span>{stats.unread} unread</span>
                <span>{stats.urgent} urgent</span>
                <span>{stats.total} total</span>
              </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className="h-96">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No notifications</div>
              ) : (
                <div className="p-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 mb-2 rounded-lg border-l-4 ${getPriorityColor(notification.priority)} ${
                        notification.status === 'unread' ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type, notification.priority)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">
                              {notification.title}
                            </h4>
                            {notification.status === 'unread' && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            <div className="flex gap-1">
                              {notification.status === 'unread' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleNotificationAction(notification.id, 'mark_read')}
                                  className="h-6 w-6 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleNotificationAction(notification.id, 'archive')}
                                className="h-6 w-6 p-0"
                              >
                                <Archive className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {(() => {
                            const actionUrl = normalizeActionUrl(notification.actionUrl);
                            if (!actionUrl) {
                              return null;
                            }

                            const actionLabel =
                              notification.actionLabel?.trim() || 'View Details';
                            const linkClasses = 'text-xs text-blue-600 hover:text-blue-800';

                            if (isInternalActionUrl(actionUrl)) {
                              return (
                                <div className="mt-2">
                                  <Link
                                    href={actionUrl}
                                    className={linkClasses}
                                    onClick={() => setIsOpen(false)}
                                  >
                                    {actionLabel} →
                                  </Link>
                                </div>
                              );
                            }

                            const openInNewTab = shouldOpenInNewTab(actionUrl);
                            return (
                              <div className="mt-2">
                                <a
                                  href={actionUrl}
                                  className={linkClasses}
                                  target={openInNewTab ? '_blank' : undefined}
                                  rel={openInNewTab ? 'noopener noreferrer' : undefined}
                                  onClick={() => setIsOpen(false)}
                                >
                                  {actionLabel} →
                                </a>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t">
              <Link
                href="/admin/notifications"
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => setIsOpen(false)}
              >
                View all notifications →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
