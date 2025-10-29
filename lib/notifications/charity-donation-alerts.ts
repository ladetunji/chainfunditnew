import { Resend } from 'resend';
import { db } from '@/lib/db';
import { adminSettings } from '@/lib/schema/admin-settings';
import { users } from '@/lib/schema';
import { eq, or } from 'drizzle-orm';

const resend = new Resend(process.env.RESEND_API_KEY);

interface CharityDonationData {
  donationId: string;
  charityId: string;
  charityName: string;
  amount: string;
  currency: string;
  donorName: string;
  donorEmail: string;
  isAnonymous: boolean;
  message?: string;
}

/**
 * Send email notification to admin when charity receives a donation
 */
export async function notifyAdminOfCharityDonation(donationData: CharityDonationData) {
  try {
    // Get all admin users first
    const adminUsers = await db.query.users.findMany({
      where: or(
        eq(users.role, 'admin'),
        eq(users.role, 'super_admin')
      ),
    });

    if (adminUsers.length === 0) {
      console.log('No admin users found in the system');
      return;
    }

    // Get admin settings for each admin user
    const adminConfigs = await db.query.adminSettings.findMany({
      where: eq(adminSettings.notifyOnCharityDonation, true),
    });

    // Create a map of userId to settings for quick lookup
    const settingsMap = new Map(adminConfigs.map(config => [config.userId, config]));

    const amount = parseFloat(donationData.amount);
    let notificationsSent = 0;

    for (const adminUser of adminUsers) {
      const config = settingsMap.get(adminUser.id);
      
      // If no specific settings found, use defaults (notify by default)
      const shouldNotifyCharity = config ? config.notifyOnCharityDonation : true;
      const emailEnabled = config ? config.emailNotificationsEnabled : true;
      
      if (!shouldNotifyCharity || !emailEnabled) continue;

      const recipientEmail = config?.notificationEmail || process.env.ADMIN_EMAIL;
      if (!recipientEmail) continue;

      // Check if this is a large donation for this admin
      const threshold = config ? parseFloat(config.largeDonationThreshold || '1000') : 1000;
      const isLargeDonation = amount >= threshold;
      const shouldNotifyLarge = config ? config.notifyOnLargeDonation : true;
      
      // Send notification if:
      // 1. Admin has notify_on_charity_donation enabled, OR
      // 2. It's a large donation and admin has notify_on_large_donation enabled
      const shouldNotify = shouldNotifyCharity || (isLargeDonation && shouldNotifyLarge);

      if (!shouldNotify) continue;

      await sendCharityDonationEmail(recipientEmail, donationData, isLargeDonation);
      notificationsSent++;
    }

    if (notificationsSent === 0) {
      console.log('No admins configured for charity donation notifications');
    } else {
      console.log(`✅ Charity donation notifications sent to ${notificationsSent} admin(s)`);
    }
  } catch (error) {
    console.error('Error notifying admin of charity donation:', error);
    // Don't throw - notification failure shouldn't break payment flow
  }
}

/**
 * Send the actual email
 */
async function sendCharityDonationEmail(
  recipientEmail: string,
  donationData: CharityDonationData,
  isLargeDonation: boolean
) {
  try {
    const currencySymbol = 
      donationData.currency === 'NGN' ? '₦' :
      donationData.currency === 'GBP' ? '£' :
      donationData.currency === 'EUR' ? '€' : '$';

    const formattedAmount = `${currencySymbol}${parseFloat(donationData.amount).toLocaleString()}`;

    const subject = isLargeDonation
      ? `🎉 Large Donation Alert: ${formattedAmount} to ${donationData.charityName}`
      : `💰 New Charity Donation: ${formattedAmount} to ${donationData.charityName}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .amount { font-size: 36px; font-weight: bold; color: #16a34a; margin: 20px 0; }
            .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: 600; color: #6b7280; }
            .detail-value { color: #111827; }
            .message-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            ${isLargeDonation ? '.large-donation-badge { background: #fbbf24; color: #78350f; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }' : ''}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isLargeDonation ? '🎉 Large Donation Received!' : '💰 New Charity Donation'}</h1>
              ${isLargeDonation ? '<div class="large-donation-badge">⭐ Large Donation Alert ⭐</div>' : ''}
            </div>
            
            <div class="content">
              <div class="amount">${formattedAmount}</div>
              
              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Charity:</span>
                  <span class="detail-value">${donationData.charityName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Donor:</span>
                  <span class="detail-value">${donationData.isAnonymous ? 'Anonymous' : donationData.donorName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">${donationData.isAnonymous ? 'Hidden' : donationData.donorEmail}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Amount:</span>
                  <span class="detail-value">${formattedAmount} ${donationData.currency}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Donation ID:</span>
                  <span class="detail-value" style="font-family: monospace;">${donationData.donationId.substring(0, 8)}...</span>
                </div>
              </div>
              
              ${donationData.message ? `
                <div class="message-box">
                  <strong>💬 Donor Message:</strong><br/>
                  "${donationData.message}"
                </div>
              ` : ''}
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}admin/charity-payouts" class="button">
                  View in Admin Dashboard →
                </a>
              </div>
              
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                This donation has been successfully processed and is now pending payout to the charity.
                You can manage payouts from the admin dashboard.
              </p>
            </div>
            
            <div class="footer">
              <p>ChainFundit Admin Notifications</p>
                <p>To manage your notification preferences, visit <a href="${process.env.NEXT_PUBLIC_APP_URL}admin/settings">Admin Settings</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'notifications@chainfundit.com',
      to: recipientEmail,
      subject,
      html,
    });

    console.log(`✅ Admin notification sent to ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    // Don't throw - email failure shouldn't break payment flow
  }
}

/**
 * Send browser push notification to admin
 */
export async function sendAdminPushNotification(donationData: CharityDonationData) {
  try {
    const adminConfigs = await db.query.adminSettings.findMany({
      where: eq(adminSettings.pushNotificationsEnabled, true),
    });

    for (const config of adminConfigs) {
      if (!config.pushSubscription) continue;

      // TODO: Implement Web Push API
      // This would use libraries like 'web-push' to send browser notifications
      console.log('Push notification would be sent to admin');
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

/**
 * Create in-app notification for admin
 */
export async function createAdminNotification(donationData: CharityDonationData) {
  try {
    // Get admin user IDs (you might have a specific admin role or user table)
    // For now, we'll create notifications for all admins with settings
    const adminConfigs = await db.query.adminSettings.findMany();

    const { notifications } = await import('@/lib/schema/notifications');

    for (const config of adminConfigs) {
      if (!config.notifyOnCharityDonation) continue;

      const currencySymbol = 
        donationData.currency === 'NGN' ? '₦' :
        donationData.currency === 'GBP' ? '£' :
        donationData.currency === 'EUR' ? '€' : '$';

      await db.insert(notifications).values({
        userId: config.userId,
        type: 'charity_donation_received',
        title: `New donation to ${donationData.charityName}`,
        message: `${donationData.isAnonymous ? 'Anonymous' : donationData.donorName} donated ${currencySymbol}${donationData.amount} ${donationData.currency}`,
        isRead: false,
        metadata: JSON.stringify({
          donationId: donationData.donationId,
          charityId: donationData.charityId,
          amount: donationData.amount,
          currency: donationData.currency,
        }),
      });
    }

    console.log('✅ In-app notifications created for admins');
  } catch (error) {
    console.error('Error creating admin notification:', error);
  }
}

/**
 * Main function to notify admins of charity donation
 */
export async function notifyAdminsOfCharityDonation(donationData: CharityDonationData) {
  // Run all notification methods in parallel
  await Promise.allSettled([
    notifyAdminOfCharityDonation(donationData),  // Email
    sendAdminPushNotification(donationData),      // Push
    createAdminNotification(donationData),        // In-app
  ]);
}

