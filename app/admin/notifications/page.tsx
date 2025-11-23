'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertTriangle, 
  Info, 
  Users, 
  DollarSign, 
  Shield, 
  Check, 
  Archive, 
  Trash2,
  Search,
  Filter,
  Bell,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
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
  metadata?: any;
  createdAt: string;
  readAt?: string;
  archivedAt?: string;
}

interface NotificationStats {
  unread: number;
  read: number;
  urgent: number;
  total: number;
}

const getNotificationIcon = (type: string, priority: string) => {
  if (priority === 'urgent') return <AlertTriangle className="h-5 w-5 text-red-500" />;
  
  switch (type) {
    case 'system': return <Shield className="h-5 w-5 text-blue-500" />;
    case 'user': return <Users className="h-5 w-5 text-green-500" />;
    case 'campaign': return <Info className="h-5 w-5 text-purple-500" />;
    case 'donation': return <DollarSign className="h-5 w-5 text-green-500" />;
    case 'payout': return <DollarSign className="h-5 w-5 text-orange-500" />;
    case 'security': return <Shield className="h-5 w-5 text-red-500" />;
    default: return <Info className="h-5 w-5 text-gray-500" />;
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

const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-blue-100 text-blue-800';
    case 'low': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ unread: 0, read: 0, urgent: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  // Fetch notifications and stats
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      params.append('limit', '50');

      const [notificationsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/notifications?${params.toString()}`),
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
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter]);

  // Filter notifications based on search and priority
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const handleNotificationAction = async (id: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        await fetchData();
        toast.success(`Notification ${action.replace('_', ' ')}`);
      }
    } catch (error) {
      console.error('Error updating notification:', error);
      toast.error('Failed to update notification');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedNotifications.length === 0) {
      toast.error('Please select notifications to perform bulk action');
      return;
    }

    try {
      await Promise.all(
        selectedNotifications.map(id => 
          fetch(`/api/admin/notifications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
          })
        )
      );
      
      await fetchData();
      setSelectedNotifications([]);
      toast.success(`Bulk ${action.replace('_', ' ')} completed`);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const handleSelectNotification = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(n => n !== id)
        : [...prev, id]
    );
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">Manage and monitor all admin notifications</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={fetchData} variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Urgent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Read</p>
              <p className="text-2xl font-bold text-gray-900">{stats.read}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="campaign">Campaign</SelectItem>
                <SelectItem value="donation">Donation</SelectItem>
                <SelectItem value="payout">Payout</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedNotifications.length} notification(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleBulkAction('mark_read')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Mark Read
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('archive')}
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Archive
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-600">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Header */}
            <div className="px-6 py-3 bg-gray-50 border-b">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <span className="ml-3 text-sm font-medium text-gray-900">
                  Select All ({filteredNotifications.length})
                </span>
              </div>
            </div>

            {/* Notifications */}
            {filteredNotifications.map((notification) => {
              const actionUrl = normalizeActionUrl(notification.actionUrl);
              const actionLabel = notification.actionLabel?.trim() || 'View Details';
              const linkClasses = 'text-blue-600 hover:text-blue-800 text-sm font-medium';
              const actionLink = actionUrl
                ? isInternalActionUrl(actionUrl)
                  ? (
                    <Link href={actionUrl} className={linkClasses}>
                      {actionLabel} →
                    </Link>
                  )
                  : (
                    <a
                      href={actionUrl}
                      className={linkClasses}
                      target={shouldOpenInNewTab(actionUrl) ? '_blank' : undefined}
                      rel={shouldOpenInNewTab(actionUrl) ? 'noopener noreferrer' : undefined}
                    >
                      {actionLabel} →
                    </a>
                  )
                : null;

              return (
                <div
                  key={notification.id}
                  className={`p-6 border-l-4 ${getPriorityColor(notification.priority)} ${
                    notification.status === 'unread' ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getNotificationIcon(notification.type, notification.priority)}
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {notification.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getPriorityBadgeColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                              <Badge variant="outline">
                                {notification.type}
                              </Badge>
                              {notification.status === 'unread' && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  Unread
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          <div className="flex gap-1">
                            {notification.status === 'unread' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleNotificationAction(notification.id, 'mark_read')}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleNotificationAction(notification.id, 'archive')}
                              className="h-8 w-8 p-0"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mt-3 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Created: {formatDate(notification.createdAt)}
                          </span>
                          {notification.readAt && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              Read: {formatDate(notification.readAt)}
                            </span>
                          )}
                        </div>
                        
                        {actionLink}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
