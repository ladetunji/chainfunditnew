import { Resend } from 'resend';
import { db } from '@/lib/db';
import { adminSettings } from '@/lib/schema/admin-settings';
import { users } from '@/lib/schema';
import { eq, or } from 'drizzle-orm';

const resend = new Resend(process.env.RESEND_API_KEY);

interface AccountChangeRequestData {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  currentAccountNumber?: string;
  currentBankName?: string;
  currentAccountName?: string;
  reason: string;
  requestDate: Date;
}

/**
 * Send email notification to admins when user requests account change
 */
export async function notifyAdminsOfAccountChangeRequest(requestData: AccountChangeRequestData) {
  try {
    // Get all admin users first
    const adminUsers = await db.query.users.findMany({
      where: or(
        eq(users.role, 'admin'),
        eq(users.role, 'super_admin')
      ),
    });

    if (adminUsers.length === 0) {
      return;
    }

    // Get admin settings for each admin user
    const adminConfigs = await db.query.adminSettings.findMany({
      where: eq(adminSettings.notifyOnAccountChangeRequest, true),
    });

    // Create a map of userId to settings for quick lookup
    const settingsMap = new Map(adminConfigs.map(config => [config.userId, config]));

    let notificationsSent = 0;

    for (const adminUser of adminUsers) {
      const config = settingsMap.get(adminUser.id);
      
      // If no specific settings found, use defaults (notify by default)
      const shouldNotify = config ? config.notifyOnAccountChangeRequest : true;
      const emailEnabled = config ? config.emailNotificationsEnabled : true;
      
      if (!shouldNotify || !emailEnabled) continue;

      const recipientEmail = config?.notificationEmail || process.env.ADMIN_EMAIL;
      if (!recipientEmail) continue;

      await sendAccountChangeRequestEmailToAdmin(recipientEmail, requestData);
      notificationsSent++;
    }

    if (notificationsSent === 0) {
    } else {
    }
  } catch (error) {
    console.error('Error notifying admins of account change request:', error);
    // Don't throw - notification failure shouldn't break the request flow
  }
}

/**
 * Send confirmation email to user
 */
export async function sendAccountChangeConfirmationToUser(requestData: AccountChangeRequestData) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .info-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Request Received</h1>
            </div>
            
            <div class="content">
              <p>Hello ${requestData.userName},</p>
              
              <p>We've received your request to change your bank account details. Our admin team will review your request and get back to you shortly.</p>
              
              <div class="info-box">
                <strong>📋 Request Details:</strong><br/>
                <strong>Submitted:</strong> ${requestData.requestDate.toLocaleDateString()} at ${requestData.requestDate.toLocaleTimeString()}<br/>
                <strong>Reason:</strong> ${requestData.reason}
              </div>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Our admin team will review your request</li>
                <li>They may contact you for additional verification</li>
                <li>Once approved, your account will be unlocked for changes</li>
                <li>You'll receive an email notification when your request is processed</li>
              </ul>
              
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                <strong>Need to update or cancel your request?</strong><br/>
                Please contact our support team at <a href="mailto:campaigns@chainfundit.com">campaigns@chainfundit.com</a> or call +44 203 838 0360
              </p>
            </div>
            
            <div class="footer">
              <p>ChainFundit Payment Settings</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/payments">View Your Settings</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'notifications@chainfundit.com',
      to: requestData.userEmail,
      subject: '✅ Account Change Request Received - ChainFundit',
      html,
    });

  } catch (error) {
    console.error('Error sending user confirmation email:', error);
    // Don't throw - notification failure shouldn't break the request flow
  }
}

/**
 * Send account change request email to admin
 */
async function sendAccountChangeRequestEmailToAdmin(
  recipientEmail: string,
  requestData: AccountChangeRequestData
) {
  try {
    const subject = `🔐 Account Change Request from ${requestData.userName}`;

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
            .reason-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .alert-badge { background: #fbbf24; color: #78350f; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Account Change Request</h1>
              <div class="alert-badge">⚠️ Requires Admin Review</div>
            </div>
            
            <div class="content">
              <h2>User Details</h2>
              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">User Name:</span>
                  <span class="detail-value">${requestData.userName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">${requestData.userEmail}</span>
                </div>
                ${requestData.userPhone ? `
                  <div class="detail-row">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${requestData.userPhone}</span>
                  </div>
                ` : ''}
                <div class="detail-row">
                  <span class="detail-label">User ID:</span>
                  <span class="detail-value" style="font-family: monospace; font-size: 12px;">${requestData.userId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Request Date:</span>
                  <span class="detail-value">${requestData.requestDate.toLocaleDateString()} at ${requestData.requestDate.toLocaleTimeString()}</span>
                </div>
              </div>

              ${requestData.currentAccountNumber ? `
                <h2>Current Account Details</h2>
                <div class="details">
                  <div class="detail-row">
                    <span class="detail-label">Account Number:</span>
                    <span class="detail-value" style="font-family: monospace;">${requestData.currentAccountNumber}</span>
                  </div>
                  ${requestData.currentBankName ? `
                    <div class="detail-row">
                      <span class="detail-label">Bank Name:</span>
                      <span class="detail-value">${requestData.currentBankName}</span>
                    </div>
                  ` : ''}
                  ${requestData.currentAccountName ? `
                    <div class="detail-row">
                      <span class="detail-label">Account Name:</span>
                      <span class="detail-value">${requestData.currentAccountName}</span>
                    </div>
                  ` : ''}
                </div>
              ` : ''}

              <div class="reason-box">
                <strong>📝 Reason for Change Request:</strong><br/>
                <p style="margin-top: 10px; white-space: pre-wrap;">${requestData.reason}</p>
              </div>

              <div style="background: #fff7ed; border: 1px solid #fed7aa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <strong>⚠️ Action Required:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Review the user's request and reason</li>
                  <li>Verify the user's identity if needed</li>
                  <li>Contact the user for additional verification (phone/email)</li>
                  <li>Approve or deny the request from the admin dashboard</li>
                  <li>If approved, unlock their account and notify them</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/settings/account-requests" class="button">
                  Review Request in Dashboard →
                </a>
              </div>
              
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                <strong>Security Tip:</strong> Always verify the user's identity before approving account changes. 
                Consider calling them at their registered phone number or requesting additional verification documents.
              </p>
            </div>
            
            <div class="footer">
              <p>ChainFundit Admin Notifications</p>
              <p>To manage your notification preferences, visit <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/settings/notifications">Admin Settings</a></p>
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

  } catch (error) {
    console.error('Error sending admin notification email:', error);
    // Don't throw - email failure shouldn't break the request flow
  }
}

/**
 * Create in-app notification for admins about account change request
 */
export async function createAdminNotificationForAccountChange(requestData: AccountChangeRequestData) {
  try {
    const adminConfigs = await db.query.adminSettings.findMany({
      where: eq(adminSettings.notifyOnAccountChangeRequest, true),
    });

    if (adminConfigs.length === 0) return;

    const { notifications } = await import('@/lib/schema/notifications');

    for (const config of adminConfigs) {
      await db.insert(notifications).values({
        userId: config.userId,
        type: 'account_change_request',
        title: `Account change request from ${requestData.userName}`,
        message: `${requestData.userName} (${requestData.userEmail}) has requested to change their bank account details.`,
        isRead: false,
        metadata: JSON.stringify({
          userId: requestData.userId,
          userEmail: requestData.userEmail,
          reason: requestData.reason,
          requestDate: requestData.requestDate.toISOString(),
        }),
      });
    }

  } catch (error) {
    console.error('Error creating admin notification:', error);
  }
}

/**
 * Main function to notify all parties of account change request
 */
export async function notifyAccountChangeRequest(requestData: AccountChangeRequestData) {
  // Run all notification methods in parallel
  await Promise.allSettled([
    notifyAdminsOfAccountChangeRequest(requestData),     // Email to admins
    sendAccountChangeConfirmationToUser(requestData),    // Email to user
    createAdminNotificationForAccountChange(requestData), // In-app notification
  ]);
}

interface AccountChangeApprovalData {
  userId: string;
  userName: string;
  userEmail: string;
  adminName: string;
  notes?: string;
}

/**
 * Send approval email to user when their account change request is approved
 */
export async function sendAccountChangeApprovalEmail(data: AccountChangeApprovalData) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .success-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Account Change Request Approved</h1>
            </div>
            
            <div class="content">
              <p>Hello ${data.userName},</p>
              
              <div class="success-box">
                <strong>🎉 Great News!</strong><br/>
                <p style="margin-top: 10px;">Your request to change your bank account details has been approved by our admin team.</p>
              </div>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Your account has been unlocked for changes</li>
                <li>You can now update your bank account details in your payment settings</li>
                <li>Please verify your new account details to ensure payouts are processed correctly</li>
              </ul>
              
              ${data.notes ? `
                <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <strong>Admin Note:</strong><br/>
                  <p style="margin-top: 5px; white-space: pre-wrap;">${data.notes}</p>
                </div>
              ` : ''}
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/payments" class="button">
                  Update Account Details →
                </a>
              </div>
              
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                If you have any questions, please contact our support team at <a href="mailto:campaigns@chainfundit.com">campaigns@chainfundit.com</a>
              </p>
            </div>
            
            <div class="footer">
              <p>ChainFundit Payment Settings</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'notifications@chainfundit.com',
      to: data.userEmail,
      subject: '✅ Account Change Request Approved - ChainFundit',
      html,
    });

  } catch (error) {
    console.error('Error sending approval email:', error);
    throw error;
  }
}

interface AccountChangeRejectionData {
  userId: string;
  userName: string;
  userEmail: string;
  adminName: string;
  reason: string;
}

/**
 * Send rejection email to user when their account change request is rejected
 */
export async function sendAccountChangeRejectionEmail(data: AccountChangeRejectionData) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .info-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Account Change Request Not Approved</h1>
            </div>
            
            <div class="content">
              <p>Hello ${data.userName},</p>
              
              <p>We regret to inform you that your request to change your bank account details could not be approved at this time.</p>
              
              <div class="info-box">
                <strong>Reason for Rejection:</strong><br/>
                <p style="margin-top: 10px; white-space: pre-wrap;">${data.reason}</p>
              </div>
              
              <p><strong>What can you do?</strong></p>
              <ul>
                <li>Review the reason provided above</li>
                <li>If you believe this is an error, please contact our support team</li>
                <li>You may submit a new request with additional information or clarification</li>
                <li>For urgent matters, please call our support line</li>
              </ul>
              
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                <strong>Need assistance?</strong><br/>
                Contact our support team:<br/>
                📧 <a href="mailto:campaigns@chainfundit.com">campaigns@chainfundit.com</a><br/>
                📞 +44 203 838 0360
              </p>
            </div>
            
            <div class="footer">
              <p>ChainFundit Payment Settings</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'notifications@chainfundit.com',
      to: data.userEmail,
      subject: '❌ Account Change Request Not Approved - ChainFundit',
      html,
    });

  } catch (error) {
    console.error('Error sending rejection email:', error);
    throw error;
  }
}

