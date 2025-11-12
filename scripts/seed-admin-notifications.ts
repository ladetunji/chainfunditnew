import { db } from '../lib/db';
import { adminNotifications } from '../lib/schema';

const sampleNotifications = [
  {
    title: 'New User Registration',
    message: 'John Doe has registered and needs profile verification',
    type: 'user',
    priority: 'medium',
    actionUrl: '/admin/dashboard/users',
    actionLabel: 'Review User',
    metadata: { userId: 'user-123', userName: 'John Doe' }
  },
  {
    title: 'Large Donation Received',
    message: 'A donation of $5,000 was made to the Education Fund campaign',
    type: 'donation',
    priority: 'medium',
    actionUrl: '/admin/dashboard/donations',
    actionLabel: 'View Donation',
    metadata: { donationId: 'donation-789', amount: 5000, campaignId: 'campaign-123' }
  },
  {
    title: 'Payout Request',
    message: 'Sarah Johnson has requested a payout of $2,500',
    type: 'payout',
    priority: 'high',
    actionUrl: '/admin/dashboard/payouts',
    actionLabel: 'Review Payout',
    metadata: { payoutId: 'payout-101', amount: 2500, userId: 'user-456' }
  },
  {
    title: 'Security Alert',
    message: 'Multiple failed login attempts detected from IP 192.168.1.100',
    type: 'security',
    priority: 'urgent',
    actionUrl: '/admin/settings',
    actionLabel: 'Review Security',
    metadata: { ipAddress: '192.168.1.100', attempts: 5 }
  },
  {
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight at 2:00 AM UTC',
    type: 'system',
    priority: 'low',
    actionUrl: '/admin/settings',
    actionLabel: 'View Details',
    metadata: { maintenanceWindow: '2024-01-15T02:00:00Z', duration: '2 hours' }
  }
];

async function seedNotifications() {
  try {
    
    for (const notification of sampleNotifications) {
      await db.insert(adminNotifications).values(notification);
    }
    
  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedNotifications();
}

export { seedNotifications };
