'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TwoFactorSettings } from '@/components/admin/two-factor-settings';
import { TwoFactorSetup } from '@/components/admin/two-factor-setup';
import { Bell, Mail, Smartphone, Calendar, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'super_admin';
  isVerified: boolean;
  accountLocked: boolean;
  twoFactorEnabled: boolean;
}

interface AdminSettings {
  id: string;
  emailNotificationsEnabled: boolean;
  notificationEmail: string;
  notifyOnCharityDonation: boolean;
  notifyOnCampaignDonation: boolean;
  notifyOnPayoutRequest: boolean;
  notifyOnLargeDonation: boolean;
  notifyOnAccountChangeRequest: boolean;
  largeDonationThreshold: string;
  pushNotificationsEnabled: boolean;
  dailySummaryEnabled: boolean;
  weeklySummaryEnabled: boolean;
  summaryTime: string;
}

export default function AdminSettingsPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<AdminSettings | null>(null);
  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchNotificationSettings();
    
    // Check if 2FA setup was in progress
    const setupInProgress = localStorage.getItem('2fa-setup-in-progress');
    if (setupInProgress === 'true') {
      setShowTwoFactorSetup(true);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/admin/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        toast.error('Failed to load user data');
      }
    } catch (error) {
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSetupComplete = () => {
    setShowTwoFactorSetup(false);
    localStorage.removeItem('2fa-setup-in-progress');
    // Refresh user data to get updated 2FA status
    fetchUser();
  };

  const handleStartTwoFactorSetup = () => {
    setShowTwoFactorSetup(true);
    localStorage.setItem('2fa-setup-in-progress', 'true');
  };

  const handleCancelTwoFactorSetup = () => {
    setShowTwoFactorSetup(false);
    localStorage.removeItem('2fa-setup-in-progress');
  };

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/notifications');
      const data = await response.json();
      setNotificationSettings(data.settings);
    } catch (error) {
      toast.error('Failed to load notification settings');
    }
  };

  const handleSaveNotificationSettings = async () => {
    setSavingNotifications(true);
    try {
      const response = await fetch('/api/admin/settings/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save notification settings');
      }

      toast.success('Notification settings saved successfully!');
    } catch (error) { 
      toast.error('Failed to save notification settings');
    } finally {
      setSavingNotifications(false);
    }
  };

  const updateNotificationSetting = (key: keyof AdminSettings, value: any) => {
    if (notificationSettings) {
      setNotificationSettings({ ...notificationSettings, [key]: value });
    } else {
      // Initialize with default values if settings are null
      const defaultSettings: AdminSettings = {
        id: '',
        emailNotificationsEnabled: false,
        notificationEmail: '',
        notifyOnCharityDonation: false,
        notifyOnCampaignDonation: false,
        notifyOnPayoutRequest: false,
        notifyOnLargeDonation: false,
        notifyOnAccountChangeRequest: false,
        largeDonationThreshold: '1000',
        pushNotificationsEnabled: false,
        dailySummaryEnabled: false,
        weeklySummaryEnabled: false,
        summaryTime: '09:00',
        ...{ [key]: value }
      };
      setNotificationSettings(defaultSettings);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings</h1>
            <p className="text-gray-600">Failed to load user data</p>
          </div>
        </div>
      </div>
    );
  }

  // Show 2FA setup if in progress
  if (showTwoFactorSetup) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
            <p className="text-gray-600 mt-1">
              Setting up Two-Factor Authentication
            </p>
          </div>
          <TwoFactorSetup 
            onComplete={handleTwoFactorSetupComplete} 
            onCancel={handleCancelTwoFactorSetup}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your admin account settings and security preferences
          </p>
        </div>

        <Tabs defaultValue="security" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="space-y-6">
            <TwoFactorSettings 
              userEmail={user.email} 
              onStartSetup={handleStartTwoFactorSetup}
            />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your account details and role information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Full Name</label>
                    <p className="text-gray-900 text-lg">{user.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900 text-lg">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <p className="text-gray-900 text-lg capitalize">{user.role}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Account Status</label>
                    <p className="text-gray-900 text-lg">
                      {user.isVerified ? 'Verified' : 'Not Verified'} • 
                      {user.accountLocked ? ' Locked' : ' Active'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-6">
              {/* Email Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription>
                    Receive email alerts when important events occur
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Email Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Receive emails for donation alerts and updates
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings?.emailNotificationsEnabled || false}
                      onCheckedChange={(checked) => updateNotificationSetting('emailNotificationsEnabled', checked)}
                    />
                  </div>

                  {notificationSettings?.emailNotificationsEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="notificationEmail">Notification Email</Label>
                      <Input
                        id="notificationEmail"
                        type="email"
                        placeholder="admin@example.com"
                        value={notificationSettings?.notificationEmail || ''}
                        onChange={(e) => updateNotificationSetting('notificationEmail', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Leave blank to use your default admin email
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Donation Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Donation Alerts
                  </CardTitle>
                  <CardDescription>
                    Get notified when donations are received
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Charity Donations</Label>
                      <p className="text-sm text-gray-500">
                        Get notified for every charity donation
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings?.notifyOnCharityDonation || false}
                      onCheckedChange={(checked) => updateNotificationSetting('notifyOnCharityDonation', checked)}
                      disabled={!notificationSettings?.emailNotificationsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Campaign Donations</Label>
                      <p className="text-sm text-gray-500">
                        Get notified for campaign donations
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings?.notifyOnCampaignDonation || false}
                      onCheckedChange={(checked) => updateNotificationSetting('notifyOnCampaignDonation', checked)}
                      disabled={!notificationSettings?.emailNotificationsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Large Donations</Label>
                      <p className="text-sm text-gray-500">
                        Get special alerts for large donations
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings?.notifyOnLargeDonation || false}
                      onCheckedChange={(checked) => updateNotificationSetting('notifyOnLargeDonation', checked)}
                      disabled={!notificationSettings?.emailNotificationsEnabled}
                    />
                  </div>

                  {notificationSettings?.notifyOnLargeDonation && (
                    <div className="space-y-2 pl-4 border-l-2 border-yellow-400">
                      <Label htmlFor="threshold">Large Donation Threshold (USD)</Label>
                      <Input
                        id="threshold"
                        type="number"
                        placeholder="1000"
                        value={notificationSettings?.largeDonationThreshold || '1000'}
                        onChange={(e) => updateNotificationSetting('largeDonationThreshold', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Donations above this amount will trigger special alerts
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Payout Requests</Label>
                      <p className="text-sm text-gray-500">
                        Get notified when payouts need approval
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings?.notifyOnPayoutRequest || false}
                      onCheckedChange={(checked) => updateNotificationSetting('notifyOnPayoutRequest', checked)}
                      disabled={!notificationSettings?.emailNotificationsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Account Change Requests</Label>
                      <p className="text-sm text-gray-500">
                        Get notified when users request to change their bank account
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings?.notifyOnAccountChangeRequest || false}
                      onCheckedChange={(checked) => updateNotificationSetting('notifyOnAccountChangeRequest', checked)}
                      disabled={!notificationSettings?.emailNotificationsEnabled}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Summary Reports */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Summary Reports
                  </CardTitle>
                  <CardDescription>
                    Receive periodic summaries of platform activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Daily Summary</Label>
                      <p className="text-sm text-gray-500">
                        Get a daily report of all donations
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings?.dailySummaryEnabled || false}
                      onCheckedChange={(checked) => updateNotificationSetting('dailySummaryEnabled', checked)}
                      disabled={!notificationSettings?.emailNotificationsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Summary</Label>
                      <p className="text-sm text-gray-500">
                        Get a weekly report of platform metrics
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings?.weeklySummaryEnabled || false}
                      onCheckedChange={(checked) => updateNotificationSetting('weeklySummaryEnabled', checked)}
                      disabled={!notificationSettings?.emailNotificationsEnabled}
                    />
                  </div>

                  {(notificationSettings?.dailySummaryEnabled || notificationSettings?.weeklySummaryEnabled) && (
                    <div className="space-y-2">
                      <Label htmlFor="summaryTime">Summary Send Time</Label>
                      <Input
                        id="summaryTime"
                        type="time"
                        value={notificationSettings?.summaryTime || '09:00'}
                        onChange={(e) => updateNotificationSetting('summaryTime', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Time when summaries will be sent (24-hour format)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>


              {/* Save Button */}
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={fetchNotificationSettings}
                  disabled={savingNotifications}
                >
                  Reset
                </Button>
                <Button
                  onClick={handleSaveNotificationSettings}
                  disabled={savingNotifications}
                  className="min-w-32"
                >
                  {savingNotifications ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>

              {/* Info Box */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">How Notifications Work</h3>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• <strong>Email Notifications:</strong> Sent immediately when donations are received</li>
                        <li>• <strong>Large Donation Alerts:</strong> Special notifications for donations above threshold</li>
                        <li>• <strong>Summary Reports:</strong> Periodic digest emails with platform metrics</li>
                        <li>• <strong>In-App Notifications:</strong> Always enabled for all admin users</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
