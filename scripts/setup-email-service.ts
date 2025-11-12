#!/usr/bin/env tsx

/**
 * Email Service Setup Script
 * 
 * This script helps you configure the Resend email service for OTP delivery.
 * Run this script to check your current configuration and get setup instructions.
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

interface EmailConfig {
  resendApiKey: string | undefined;
  resendFromEmail: string | undefined;
  isConfigured: boolean;
  issues: string[];
}

function checkEmailConfiguration(): EmailConfig {
  const issues: string[] = [];
  
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;
  
  if (!resendApiKey) {
    issues.push('RESEND_API_KEY is not set');
  } else if (!resendApiKey.startsWith('re_')) {
    issues.push('RESEND_API_KEY appears to be invalid (should start with "re_")');
  }
  
  if (!resendFromEmail) {
    issues.push('RESEND_FROM_EMAIL is not set');
  } else if (!resendFromEmail.includes('@')) {
    issues.push('RESEND_FROM_EMAIL appears to be invalid (should be a valid email)');
  }
  
  return {
    resendApiKey,
    resendFromEmail,
    isConfigured: issues.length === 0,
    issues
  };
}

function generateEnvTemplate(): string {
  return `# Email Service Configuration
# Get your API key from: https://resend.com/api-keys
RESEND_API_KEY=re_your_api_key_here

# Use a verified domain email (e.g., noreply@yourdomain.com)
# Add your domain in Resend dashboard: https://resend.com/domains
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Optional: Admin email for notifications
ADMIN_EMAIL=admin@yourdomain.com`;
}

function main() {
  
  const config = checkEmailConfiguration();
  
  if (config.isConfigured) {
    return;
  }
  
  
  config.issues.forEach((issue, index) => {
  });
  
  // Check if .env.local exists
  const envPath = join(process.cwd(), '.env.local');
  if (existsSync(envPath)) {
  } else {
  }
  
}

if (require.main === module) {
  main();
}

export { checkEmailConfiguration };
