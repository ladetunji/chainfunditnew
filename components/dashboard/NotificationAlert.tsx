"use client";

import React, { useEffect } from "react";
import { Bell, X, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, Notification } from "@/hooks/use-notifications";
import { toast } from "sonner";

interface NotificationAlertProps {
  className?: string;
}

export function NotificationAlert({ className }: NotificationAlertProps) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Show toast for failed donation notifications
  useEffect(() => {
    const failedDonationNotifications = notifications.filter(
      (notification) =>
        notification.type === "donation_failed" && !notification.isRead
    );

    failedDonationNotifications.forEach((notification) => {
      toast.error(notification.title, {
        description: notification.message,
        duration: 8000,
        action: {
          label: "View Details",
          onClick: () => {
            setIsOpen(true);
            markAsRead([notification.id]);
          },
        },
      });
    });
  }, [notifications, markAsRead]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const failedDonationCount = notifications.filter(
    (n) => n.type === "donation_failed" && !n.isRead
  ).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "donation_failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "donation_received":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationStyle = (type: string, isRead: boolean) => {
    const baseStyle = "p-3 rounded-lg border transition-colors";

    if (type === "donation_failed") {
      return `${baseStyle} ${
        isRead ? "bg-red-50 border-red-200" : "bg-red-100 border-red-300"
      }`;
    }

    return `${baseStyle} ${
      isRead ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300"
    }`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="lg"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className="relative p-2 hover:bg-gray-100 cursor-pointer"
        aria-label="Notifications"
      >
        <Bell color="#757575" size={26} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              Notifications
              {failedDonationCount > 0 && (
                <span className="ml-2 text-red-600 text-sm">
                  ({failedDonationCount} failed donations)
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={markAllAsRead}
                  className="text-xs text-[#5F8555] hover:text-[#104901]"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`${getNotificationStyle(
                      notification.type,
                      notification.isRead
                    )} cursor-pointer hover:shadow-md transition-all duration-200`}
                    onClick={() => {
                      // Mark as read when clicked
                      if (!notification.isRead) {
                        markAsRead([notification.id]);
                      }
                      
                      // Handle navigation based on notification type
                      if (notification.type === 'donation_failed' || notification.type === 'donation_received') {
                        // Navigate to donations page
                        window.location.href = '/donations';
                      } else if (notification.type === 'campaign_created') {
                        // Navigate to campaigns page
                        window.location.href = '/dashboard/campaigns';
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`text-sm font-medium ${
                              notification.isRead
                                ? "text-gray-700"
                                : "text-gray-900"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p
                          className={`text-sm mt-1 ${
                            notification.isRead
                              ? "text-gray-500"
                              : "text-gray-700"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(
                            notification.createdAt
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(
                            notification.createdAt
                          ).toLocaleTimeString()}
                        </p>
                        {/* Click indicator */}
                        <p className="text-xs text-[#5F8555] mt-1 font-medium">
                          Click to view details →
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
