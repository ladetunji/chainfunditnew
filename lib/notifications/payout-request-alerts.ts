import { db } from '@/lib/db';
import { adminSettings } from '@/lib/schema/admin-settings';
import { users } from '@/lib/schema';
import { eq, or } from 'drizzle-orm';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface PayoutRequestData {
  userId: string;
  userEmail: string;
  userName: string;
  campaignId: string;
  campaignTitle: string;
  amount: number;
  currency: string;
  payoutId: string;
  requestDate: Date;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

/**
 * Send email notification to admin when user requests a payout
 */
export async function notifyAdminOfPayoutRequest(payoutData: PayoutRequestData) {
  try {
    console.log('📧 Starting admin notification process...');
    
    // Get all admin users first
    const adminUsers = await db.query.users.findMany({
      where: or(
        eq(users.role, 'admin'),
        eq(users.role, 'super_admin')
      ),
    });

    console.log(`Found ${adminUsers.length} admin user(s)`);

    if (adminUsers.length === 0) {
      console.log('⚠️ No admin users found in the system');
      return;
    }

    // Get admin settings for each admin user
    const adminConfigs = await db.query.adminSettings.findMany({
      where: eq(adminSettings.notifyOnPayoutRequest, true),
    });

    console.log(`Found ${adminConfigs.length} admin configuration(s) with payout notifications enabled`);

    // Create a map of userId to settings for quick lookup
    const settingsMap = new Map(adminConfigs.map(config => [config.userId, config]));

    let notificationsSent = 0;

    for (const adminUser of adminUsers) {
      const config = settingsMap.get(adminUser.id);
      
      // If no specific settings found, use defaults (notify by default)
      const shouldNotify = config ? config.notifyOnPayoutRequest : true;
      const emailEnabled = config ? config.emailNotificationsEnabled : true;
      
      console.log(`Processing admin ${adminUser.email}:`, {
        hasConfig: !!config,
        shouldNotify,
        emailEnabled
      });
      
      if (!shouldNotify || !emailEnabled) {
        console.log(`⏭️ Skipping ${adminUser.email} - notifications disabled`);
        continue;
      }

      const recipientEmail = config?.notificationEmail || process.env.ADMIN_EMAIL;
      
      if (!recipientEmail) {
        console.log(`⚠️ No recipient email for admin ${adminUser.email}`);
        continue;
      }

      console.log(`📨 Sending email to ${recipientEmail}...`);
      
      try {
        await sendPayoutRequestEmailToAdmin(recipientEmail, payoutData);
        notificationsSent++;
        console.log(`✅ Email sent successfully to ${recipientEmail}`);
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${recipientEmail}:`, emailError);
      }
    }

    if (notificationsSent === 0) {
      console.log('⚠️ No admins configured for payout request notifications');
      console.log('   Check that ADMIN_EMAIL is set in environment variables');
      console.log('   Or ensure admin settings have notificationEmail configured');
    } else {
      console.log(`✅ Payout request notifications sent to ${notificationsSent} admin(s)`);
    }
  } catch (error) {
    console.error('❌ Error notifying admin of payout request:', error);
    // Don't throw - notification failure shouldn't break the payout flow
  }
}

/**
 * Send payout request email to admin
 */
async function sendPayoutRequestEmailToAdmin(
  recipientEmail: string,
  payoutData: PayoutRequestData
) {
  try {
    const subject = `💰 Payout Request - ${payoutData.currency} ${payoutData.amount.toLocaleString()} - ChainFundit`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: 600; color: #6b7280; }
            .detail-value { color: #111827; }
            .amount-highlight { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .alert-badge { background: #fbbf24; color: #78350f; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Payout Request</h1>
              <div class="alert-badge">⚠️ Requires Admin Review</div>
            </div>
            
            <div class="content">
              <h2>User Details</h2>
              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">User Name:</span>
                  <span class="detail-value">${payoutData.userName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">${payoutData.userEmail}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">User ID:</span>
                  <span class="detail-value">${payoutData.userId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Request Date:</span>
                  <span class="detail-value">${payoutData.requestDate.toLocaleDateString()} at ${payoutData.requestDate.toLocaleTimeString()}</span>
                </div>
              </div>

              <h2>Campaign Details</h2>
              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Campaign:</span>
                  <span class="detail-value">${payoutData.campaignTitle}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Campaign ID:</span>
                  <span class="detail-value">${payoutData.campaignId}</span>
                </div>
              </div>

              <div class="amount-highlight">
                <strong>💰 Payout Amount:</strong><br/>
                <span style="font-size: 24px; font-weight: bold; color: #ea580c;">
                  ${payoutData.currency} ${payoutData.amount.toLocaleString()}
                </span>
              </div>

              ${payoutData.bankDetails ? `
                <h2>Bank Details</h2>
                <div class="details">
                  <div class="detail-row">
                    <span class="detail-label">Account Name:</span>
                    <span class="detail-value">${payoutData.bankDetails.accountName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Account Number:</span>
                    <span class="detail-value">****${payoutData.bankDetails.accountNumber.slice(-4)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Bank:</span>
                    <span class="detail-value">${payoutData.bankDetails.bankName}</span>
                  </div>
                </div>
              ` : ''}

              <div style="background: #fff7ed; border: 1px solid #fed7aa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <strong>⚠️ Action Required:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Review the payout request and verify the amount</li>
                  <li>Check the user's campaign earnings and eligibility</li>
                  <li>Verify bank account details if needed</li>
                  <li>Approve or deny the payout from the admin dashboard</li>
                  <li>Process the payout through your payment provider</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}admin/payouts" class="button">
                  Review Payout in Dashboard →
                </a>
              </div>
              
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                <strong>Security Tip:</strong> Always verify the user's identity and campaign earnings before processing payouts. 
                Check for any suspicious activity or unusual payout patterns.
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

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured in environment variables');
    }

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'notifications@chainfundit.com',
      to: recipientEmail,
      subject,
      html,
    });

    console.log(`✅ Admin payout request notification sent to ${recipientEmail}`, result);
  } catch (error) {
    console.error(`❌ Error sending admin payout request notification email to ${recipientEmail}:`, error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('RESEND_API_KEY')) {
        console.error('   ⚠️ RESEND_API_KEY is missing from environment variables');
      } else {
        console.error('   Error details:', error.message);
      }
    }
    
    // Re-throw so the calling function can handle it
    throw error;
  }
}

/**
 * Create in-app notification for admins about payout request
 */
export async function createAdminNotificationForPayoutRequest(payoutData: PayoutRequestData) {
  try {
    console.log('📬 Starting in-app notification creation...');
    
    // Get all admin users first
    const adminUsers = await db.query.users.findMany({
      where: or(
        eq(users.role, 'admin'),
        eq(users.role, 'super_admin')
      ),
    });

    console.log(`Found ${adminUsers.length} admin user(s) for in-app notifications`);

    if (adminUsers.length === 0) {
      console.log('⚠️ No admin users found - skipping in-app notifications');
      return;
    }

    // Get admin settings for each admin user
    const adminConfigs = await db.query.adminSettings.findMany({
      where: eq(adminSettings.notifyOnPayoutRequest, true),
    });

    console.log(`Found ${adminConfigs.length} admin configuration(s) with payout notifications enabled`);

    // Create a map of userId to settings for quick lookup
    const settingsMap = new Map(adminConfigs.map(config => [config.userId, config]));

    const { notifications } = await import('@/lib/schema/notifications');

    let notificationsCreated = 0;
    let notificationsFailed = 0;

    for (const adminUser of adminUsers) {
      const config = settingsMap.get(adminUser.id);
      
      // If no specific settings found, use defaults (notify by default)
      const shouldNotify = config ? config.notifyOnPayoutRequest : true;
      
      if (!shouldNotify) {
        console.log(`⏭️ Skipping in-app notification for ${adminUser.email} - notifications disabled`);
        continue;
      }

      try {
        await db.insert(notifications).values({
          userId: adminUser.id,
          type: 'payout_request',
          title: `Payout request from ${payoutData.userName}`,
          message: `${payoutData.userName} (${payoutData.userEmail}) has requested a payout of ${payoutData.currency} ${payoutData.amount.toLocaleString()} for campaign "${payoutData.campaignTitle}".`,
          isRead: false,
          metadata: JSON.stringify({
            userId: payoutData.userId,
            userEmail: payoutData.userEmail,
            campaignId: payoutData.campaignId,
            amount: payoutData.amount,
            currency: payoutData.currency,
            payoutId: payoutData.payoutId,
            requestDate: payoutData.requestDate.toISOString(),
          }),
        });
        notificationsCreated++;
        console.log(`✅ In-app notification created for admin ${adminUser.email}`);
      } catch (notificationError) {
        notificationsFailed++;
        console.error(`❌ Failed to create in-app notification for ${adminUser.email}:`, notificationError);
      }
    }

    if (notificationsCreated > 0) {
      console.log(`✅ In-app notifications created for ${notificationsCreated} admin(s)`);
    }
    
    if (notificationsFailed > 0) {
      console.log(`⚠️ Failed to create in-app notifications for ${notificationsFailed} admin(s)`);
    }
  } catch (error) {
    console.error('❌ Error creating admin notification:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
  }
}

/**
 * Main function to notify all parties of payout request
 */
export async function notifyPayoutRequest(payoutData: PayoutRequestData) {
  // Run all notification methods in parallel
  await Promise.allSettled([
    notifyAdminOfPayoutRequest(payoutData),           // Email to admins
    createAdminNotificationForPayoutRequest(payoutData), // In-app notification
  ]);
}

