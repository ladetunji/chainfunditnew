#!/usr/bin/env node

/**
 * Script to update pending donations to completed status
 * Usage: node scripts/update-pending-donations.js [donationId]
 * If no donationId is provided, it will update all pending donations
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function updateDonation(donationId, status = 'completed') {
  try {
    console.log(`Updating donation ${donationId} to ${status}...`);
    
    const response = await fetch(`${API_BASE_URL}/api/admin/update-donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        donationId,
        status,
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Success: ${data.message}`);
      return true;
    } else {
      console.log(`❌ Error: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return false;
  }
}

async function updateAllPendingDonations(status = 'completed') {
  try {
    console.log(`Updating all pending donations to ${status}...`);
    
    const response = await fetch(`${API_BASE_URL}/api/admin/update-donations`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Success: ${data.message}`);
      return true;
    } else {
      console.log(`❌ Error: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return false;
  }
}

async function listPendingDonations() {
  try {
    console.log('Fetching pending donations...');
    
    const response = await fetch(`${API_BASE_URL}/api/admin/update-donations`);
    const data = await response.json();
    
    if (data.success) {
      console.log(`Found ${data.count} pending donations:`);
      data.data.forEach((donation, index) => {
        console.log(`${index + 1}. ${donation.id} - ${donation.currency} ${donation.amount} (${donation.paymentMethod})`);
      });
      return data.data;
    } else {
      console.log(`❌ Error: ${data.error}`);
      return [];
    }
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);
  const donationId = args[0];
  const status = args[1] || 'completed';

  console.log('🔄 Donation Status Update Tool');
  console.log('================================');

  if (donationId) {
    // Update specific donation
    await updateDonation(donationId, status);
  } else {
    // List and update all pending donations
    const pendingDonations = await listPendingDonations();
    
    if (pendingDonations.length === 0) {
      console.log('🎉 No pending donations found!');
      return;
    }

    console.log(`\nUpdating all ${pendingDonations.length} pending donations to ${status}...`);
    await updateAllPendingDonations(status);
  }
}

// Run the script
main().catch(console.error);
