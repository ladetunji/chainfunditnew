import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface PayoutEmailData {
  userEmail: string;
  userName: string;
  campaignTitle: string;
  payoutAmount: number;
  currency: string;
  netAmount: number;
  fees: number;
  payoutProvider: string;
  processingTime: string;
  payoutId: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

export async function sendPayoutConfirmationEmail(data: PayoutEmailData) {
  try {
    const { userEmail, userName, campaignTitle, payoutAmount, currency, netAmount, fees, payoutProvider, processingTime, payoutId, bankDetails } = data;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payout Confirmation - ChainFundIt</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #104901;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #104901;
            margin-bottom: 10px;
          }
          .success-icon {
            width: 60px;
            height: 60px;
            background-color: #10b981;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
          }
          .success-icon::before {
            content: "✓";
            color: white;
            font-size: 30px;
            font-weight: bold;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #104901;
            margin-bottom: 10px;
          }
          .subtitle {
            font-size: 16px;
            color: #666;
          }
          .content {
            margin-bottom: 30px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #104901;
          }
          .info-card {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            border-left: 4px solid #104901;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
          }
          .info-row:last-child {
            margin-bottom: 0;
          }
          .info-label {
            font-weight: 600;
            color: #555;
          }
          .info-value {
            font-weight: 500;
            color: #333;
          }
          .amount-highlight {
            background-color: #e8f5e8;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            text-align: center;
          }
          .amount-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
          }
          .amount-value {
            font-size: 24px;
            font-weight: bold;
            color: #104901;
          }
          .bank-details {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
          }
          .bank-title {
            font-weight: bold;
            color: #856404;
            margin-bottom: 10px;
          }
          .processing-info {
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
          }
          .processing-title {
            font-weight: bold;
            color: #0c5460;
            margin-bottom: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .footer a {
            color: #104901;
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          .cta-button {
            display: inline-block;
            background-color: #104901;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .cta-button:hover {
            background-color: #0d3d00;
          }
          @media (max-width: 600px) {
            body {
              padding: 10px;
            }
            .container {
              padding: 20px;
            }
            .info-row {
              flex-direction: column;
              gap: 5px;
            }
            .amount-value {
              font-size: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon"></div>
            <div class="logo">ChainFundIt</div>
            <div class="title">Payout Request Confirmed</div>
            <div class="subtitle">Your payout has been successfully initiated</div>
          </div>

          <div class="content">
            <div class="greeting">Hello ${userName},</div>
            
            <p>Great news! Your payout request has been successfully submitted and is now being processed. Here are the details of your payout:</p>

            <div class="info-card">
              <div class="info-row">
                <span class="info-label">Campaign:</span>
                <span class="info-value">${campaignTitle}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Transaction ID:</span>
                <span class="info-value">${payoutId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payout Provider:</span>
                <span class="info-value">${payoutProvider.charAt(0).toUpperCase() + payoutProvider.slice(1)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Request Date:</span>
                <span class="info-value">${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>

            <div class="amount-highlight">
              <div class="amount-label">Net Amount (After Fees)</div>
              <div class="amount-value">${currency} ${netAmount.toLocaleString()}</div>
            </div>

            <div class="info-card">
              <div class="info-row">
                <span class="info-label">Gross Amount:</span>
                <span class="info-value">${currency} ${payoutAmount.toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Platform Fees:</span>
                <span class="info-value">-${currency} ${fees.toLocaleString()}</span>
              </div>
              <div class="info-row" style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px;">
                <span class="info-label" style="font-weight: bold;">Net Amount:</span>
                <span class="info-value" style="font-weight: bold; color: #104901;">${currency} ${netAmount.toLocaleString()}</span>
              </div>
            </div>

            ${bankDetails ? `
            <div class="bank-details">
              <div class="bank-title">🏦 Bank Account Details</div>
              <div class="info-row">
                <span class="info-label">Account Name:</span>
                <span class="info-value">${bankDetails.accountName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Account Number:</span>
                <span class="info-value">${bankDetails.accountNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Bank Name:</span>
                <span class="info-value">${bankDetails.bankName}</span>
              </div>
            </div>
            ` : ''}

            <div class="processing-info">
              <div class="processing-title">⏰ Processing Information</div>
              <p><strong>Processing Time:</strong> ${processingTime}</p>
              <p><strong>Status:</strong> Processing</p>
              <p>You will receive another email notification once the payout has been completed and the funds have been transferred to your bank account.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://chainfundit.com'}/dashboard/payouts" class="cta-button">
                View Payout Status
              </a>
            </div>

            <p><strong>Important Notes:</strong></p>
            <ul>
              <li>Please keep this email for your records</li>
              <li>Processing times may vary depending on your bank</li>
              <li>If you have any questions, please contact our support team</li>
              <li>Ensure your bank account details are correct to avoid delays</li>
            </ul>

            <p>Thank you for using ChainFundIt! We're committed to making your fundraising experience smooth and successful.</p>
          </div>

          <div class="footer">
            <p>This email was sent to ${userEmail}</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://chainfundit.com'}">ChainFundIt</a> | 
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://chainfundit.com'}/support">Support</a> | 
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://chainfundit.com'}/privacy">Privacy Policy</a>
            </p>
            <p>© ${new Date().getFullYear()} ChainFundIt. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@chainfundit.com',
      to: userEmail,
      subject: `Payout Confirmation - ${currency} ${netAmount.toLocaleString()} - ChainFundIt`,
      html: emailHtml,
    });

    console.log('Payout confirmation email sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending payout confirmation email:', error);
    throw error;
  }
}

export async function sendPayoutCompletionEmail(data: PayoutEmailData & { completionDate: string }) {
  try {
    const { userEmail, userName, campaignTitle, netAmount, currency, payoutId, bankDetails, completionDate } = data;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payout Completed - ChainFundIt</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #10b981;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #104901;
            margin-bottom: 10px;
          }
          .success-icon {
            width: 60px;
            height: 60px;
            background-color: #10b981;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
          }
          .success-icon::before {
            content: "✓";
            color: white;
            font-size: 30px;
            font-weight: bold;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 10px;
          }
          .subtitle {
            font-size: 16px;
            color: #666;
          }
          .content {
            margin-bottom: 30px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #104901;
          }
          .info-card {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            border-left: 4px solid #10b981;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
          }
          .info-row:last-child {
            margin-bottom: 0;
          }
          .info-label {
            font-weight: 600;
            color: #555;
          }
          .info-value {
            font-weight: 500;
            color: #333;
          }
          .amount-highlight {
            background-color: #d4edda;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            text-align: center;
          }
          .amount-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
          }
          .amount-value {
            font-size: 24px;
            font-weight: bold;
            color: #10b981;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .footer a {
            color: #104901;
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          .cta-button {
            display: inline-block;
            background-color: #104901;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .cta-button:hover {
            background-color: #0d3d00;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon"></div>
            <div class="logo">ChainFundIt</div>
            <div class="title">Payout Completed!</div>
            <div class="subtitle">Your funds have been successfully transferred</div>
          </div>

          <div class="content">
            <div class="greeting">Hello ${userName},</div>
            
            <p>Excellent! Your payout has been successfully completed and the funds have been transferred to your bank account.</p>

            <div class="amount-highlight">
              <div class="amount-label">Amount Transferred</div>
              <div class="amount-value">${currency} ${netAmount.toLocaleString()}</div>
            </div>

            <div class="info-card">
              <div class="info-row">
                <span class="info-label">Campaign:</span>
                <span class="info-value">${campaignTitle}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Transaction ID:</span>
                <span class="info-value">${payoutId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Completion Date:</span>
                <span class="info-value">${completionDate}</span>
              </div>
              ${bankDetails ? `
              <div class="info-row">
                <span class="info-label">Account:</span>
                <span class="info-value">${bankDetails.accountName} (${bankDetails.accountNumber})</span>
              </div>
              ` : ''}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://chainfundit.com'}/dashboard/payouts" class="cta-button">
                View All Payouts
              </a>
            </div>

            <p>Thank you for using ChainFundIt! We're glad we could help you successfully fundraise for your cause.</p>
          </div>

          <div class="footer">
            <p>This email was sent to ${userEmail}</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://chainfundit.com'}">ChainFundIt</a> | 
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://chainfundit.com'}/support">Support</a>
            </p>
            <p>© ${new Date().getFullYear()} ChainFundIt. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@chainfundit.com',
      to: userEmail,
      subject: `Payout Completed - ${currency} ${netAmount.toLocaleString()} - ChainFundIt`,
      html: emailHtml,
    });

    console.log('Payout completion email sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending payout completion email:', error);
    throw error;
  }
}
