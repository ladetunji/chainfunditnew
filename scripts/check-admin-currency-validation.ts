#!/usr/bin/env tsx
/**
 * Currency Validation Check Script
 * 
 * This script checks:
 * 1. If currencies match admin's location
 * 2. If conversions are being run when there's money in other currencies
 * 3. Validates multi-currency scenarios
 * 
 * Usage: npx tsx scripts/check-admin-currency-validation.ts
 * 
 * Note: Requires DATABASE_URL environment variable to be set
 */

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env

import { db } from '../lib/db';
import { users, campaignPayouts, donations, campaigns, commissionPayouts } from '../lib/schema';
import { eq, and, inArray, sql, sum, count } from 'drizzle-orm';
import { getUserGeolocation, isCurrencySupported, getSupportedCurrencies } from '../lib/utils/geolocation';
import { convertToNaira, getCurrencyRate } from '../lib/utils/currency-conversion';
import { getCurrencyCode } from '../lib/utils/currency';

interface AdminInfo {
  id: string;
  email: string;
  fullName: string;
  role: string | null;
  countryCode?: string | null;
}

interface PayoutInfo {
  id: string;
  currency: string;
  amount: string;
  status: string;
  type: 'campaign' | 'commission' | 'charity';
  userId?: string;
  campaignId?: string;
}

interface CurrencyMismatch {
  adminId: string;
  adminEmail: string;
  payoutId: string;
  payoutCurrency: string;
  payoutAmount: string;
  adminCurrency: string;
  adminCanSeeAll: boolean;
  issue: string;
}

interface ConversionCheck {
  payoutId: string;
  payoutCurrency: string;
  payoutAmount: string;
  hasConversion: boolean;
  convertedAmount?: number;
  conversionRate?: number;
  issue?: string;
}

interface MultiCurrencyCampaign {
  campaignId: string;
  campaignTitle: string;
  currencies: string[];
  amounts: Record<string, number>;
  totalInNGN: number;
  needsConversion: boolean;
}

async function getAdminUsers(): Promise<AdminInfo[]> {
  const adminUsers = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      countryCode: users.countryCode,
    })
    .from(users)
    .where(
      sql`${users.role} IN ('admin', 'super_admin')`
    );

  return adminUsers;
}

async function getPendingPayouts(): Promise<PayoutInfo[]> {
  const pendingStatuses = ['pending', 'approved', 'processing'];
  
  // Get campaign payouts
  const campaignPayoutsList = await db
    .select({
      id: campaignPayouts.id,
      currency: campaignPayouts.currency,
      amount: campaignPayouts.requestedAmount,
      status: campaignPayouts.status,
      userId: campaignPayouts.userId,
      campaignId: campaignPayouts.campaignId,
    })
    .from(campaignPayouts)
    .where(inArray(campaignPayouts.status, pendingStatuses));

  // Get commission payouts
  const commissionPayoutsList = await db
    .select({
      id: commissionPayouts.id,
      currency: commissionPayouts.currency,
      amount: commissionPayouts.amount,
      status: commissionPayouts.status,
      chainerId: commissionPayouts.chainerId,
    })
    .from(commissionPayouts)
    .where(inArray(commissionPayouts.status, pendingStatuses));

  const payouts: PayoutInfo[] = [
    ...campaignPayoutsList.map(p => ({
      id: p.id,
      currency: p.currency || 'USD',
      amount: p.amount,
      status: p.status,
      type: 'campaign' as const,
      userId: p.userId,
      campaignId: p.campaignId,
    })),
    ...commissionPayoutsList.map(p => ({
      id: p.id,
      currency: p.currency || 'USD',
      amount: p.amount,
      status: p.status,
      type: 'commission' as const,
    })),
  ];

  return payouts;
}

async function checkCurrencyMismatches(
  admins: AdminInfo[],
  payouts: PayoutInfo[]
): Promise<CurrencyMismatch[]> {
  const mismatches: CurrencyMismatch[] = [];

  for (const admin of admins) {
    // Get admin's geolocation
    let adminGeolocation;
    try {
      // Try to get from IP if not stored in DB
      adminGeolocation = await getUserGeolocation();
      // Override with stored country code if available
      if (admin.countryCode) {
        const countryCode = admin.countryCode.toUpperCase();
        const currencyMap: Record<string, string> = {
          'NG': 'NGN',
          'GB': 'GBP',
          'US': 'USD',
          'CA': 'CAD',
        };
        const currency = currencyMap[countryCode] || 'USD';
        const canSeeAll = countryCode === 'NG';
        adminGeolocation = {
          country: countryCode,
          countryCode,
          currency,
          canSeeAllCurrencies: canSeeAll,
        };
      }
    } catch (error) {
      console.warn(`Failed to get geolocation for admin ${admin.email}:`, error);
      continue;
    }

    if (!adminGeolocation) {
      continue;
    }

    // Check each payout
    for (const payout of payouts) {
      const payoutCurrency = getCurrencyCode(payout.currency);
      const isSupported = isCurrencySupported(payoutCurrency, adminGeolocation);

      if (!isSupported && !adminGeolocation.canSeeAllCurrencies) {
        mismatches.push({
          adminId: admin.id,
          adminEmail: admin.email,
          payoutId: payout.id,
          payoutCurrency,
          payoutAmount: payout.amount,
          adminCurrency: adminGeolocation.currency,
          adminCanSeeAll: adminGeolocation.canSeeAllCurrencies,
          issue: `Admin ${admin.email} (${adminGeolocation.currency}) cannot view payout in ${payoutCurrency}`,
        });
      }
    }
  }

  return mismatches;
}

async function checkCurrencyConversions(
  payouts: PayoutInfo[]
): Promise<ConversionCheck[]> {
  const checks: ConversionCheck[] = [];

  for (const payout of payouts) {
    const payoutCurrency = getCurrencyCode(payout.currency);
    const payoutAmount = parseFloat(payout.amount);

    // Check if conversion to NGN is being applied
    if (payoutCurrency !== 'NGN') {
      const convertedAmount = convertToNaira(payoutAmount, payoutCurrency);
      const conversionRate = getCurrencyRate(payoutCurrency, 'NGN');

      checks.push({
        payoutId: payout.id,
        payoutCurrency,
        payoutAmount: payout.amount,
        hasConversion: true,
        convertedAmount,
        conversionRate,
      });
    } else {
      checks.push({
        payoutId: payout.id,
        payoutCurrency,
        payoutAmount: payout.amount,
        hasConversion: false,
      });
    }
  }

  return checks;
}

async function checkMultiCurrencyCampaigns(): Promise<MultiCurrencyCampaign[]> {
  const multiCurrencyCampaigns: MultiCurrencyCampaign[] = [];

  // Get all campaigns with donations
  const campaignsWithDonations = await db
    .select({
      campaignId: campaigns.id,
      campaignTitle: campaigns.title,
      donationCurrency: donations.currency,
      donationAmount: donations.amount,
    })
    .from(campaigns)
    .innerJoin(donations, eq(campaigns.id, donations.campaignId))
    .where(eq(donations.paymentStatus, 'completed'));

  // Group by campaign
  const campaignMap = new Map<string, {
    title: string;
    currencies: Set<string>;
    amounts: Record<string, number>;
  }>();

  for (const row of campaignsWithDonations) {
    if (!campaignMap.has(row.campaignId)) {
      campaignMap.set(row.campaignId, {
        title: row.campaignTitle,
        currencies: new Set(),
        amounts: {},
      });
    }

    const campaign = campaignMap.get(row.campaignId)!;
    const currency = getCurrencyCode(row.donationCurrency || 'USD');
    const amount = parseFloat(row.donationAmount || '0');

    campaign.currencies.add(currency);
    campaign.amounts[currency] = (campaign.amounts[currency] || 0) + amount;
  }

  // Check for multi-currency campaigns
  for (const [campaignId, data] of campaignMap.entries()) {
    if (data.currencies.size > 1) {
      // Calculate total in NGN
      let totalInNGN = 0;
      for (const [currency, amount] of Object.entries(data.amounts)) {
        totalInNGN += convertToNaira(amount, currency);
      }

      multiCurrencyCampaigns.push({
        campaignId,
        campaignTitle: data.title,
        currencies: Array.from(data.currencies),
        amounts: data.amounts,
        totalInNGN,
        needsConversion: true,
      });
    }
  }

  return multiCurrencyCampaigns;
}

async function main() {

  try {
    // Get all admin users
    const admins = await getAdminUsers();

    // Get all pending payouts
    const payouts = await getPendingPayouts();

    // Check currency mismatches
    const mismatches = await checkCurrencyMismatches(admins, payouts);
    
    if (mismatches.length > 0) {
      mismatches.forEach(m => {
      });
    } else {
    }

    // Check currency conversions
    const conversions = await checkCurrencyConversions(payouts);
    
    const nonNGNPayouts = conversions.filter(c => c.payoutCurrency !== 'NGN');
    if (nonNGNPayouts.length > 0) {
      nonNGNPayouts.forEach(c => {
        console.log(`  - Payout: ${c.payoutId} (${c.payoutCurrency} ${c.payoutAmount})`);
        if (c.hasConversion && c.convertedAmount && c.conversionRate) {
        } else {
          console.log(`    ⚠️  No conversion found`);
        }
      });
    } else {
    }

    // Check multi-currency campaigns
    const multiCurrencyCampaigns = await checkMultiCurrencyCampaigns();
    
    if (multiCurrencyCampaigns.length > 0) {
      multiCurrencyCampaigns.forEach(c => {
      });
    } else {
    }

    // Check for API route issues
      const apiIssues: string[] = [];
    
    // Check if stats route handles currency conversion
    const currenciesInPayouts = new Set(payouts.map(p => getCurrencyCode(p.currency)));
    if (currenciesInPayouts.size > 1) {
      apiIssues.push(
        `⚠️  WARNING: Admin payout stats route (/api/admin/payouts/campaigns/stats) may be summing amounts from different currencies without conversion.`
      );
      apiIssues.push(
        `    Found ${currenciesInPayouts.size} different currencies in payouts: ${Array.from(currenciesInPayouts).join(', ')}`
      );
    }
    
    if (apiIssues.length > 0) {
      } else {
    }

    // Summary
    const totalIssues = mismatches.length + (multiCurrencyCampaigns.length > 0 ? 1 : 0) + apiIssues.length;
    if (totalIssues > 0) {
      if (mismatches.length > 0) {
        console.log('  - Ensure admins can view payouts in their supported currencies');
      }
      if (multiCurrencyCampaigns.length > 0) {
        console.log('  - Implement currency conversion for multi-currency campaign totals');
      }
      if (apiIssues.length > 0) {
        console.log('  - Update admin payout stats route to convert all amounts to a base currency before summing');
      }
      process.exit(1);
    } else {
      console.log('\n✅ All checks passed!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error during validation:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { main as checkAdminCurrencyValidation };

