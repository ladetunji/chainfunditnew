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
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

async function updateAllPendingDonations(status = 'completed') {
  try {
    
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
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

async function listPendingDonations() {
  try {
    
    const response = await fetch(`${API_BASE_URL}/api/admin/update-donations`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);
  const donationId = args[0];
  const status = args[1] || 'completed';

  if (donationId) {
    // Update specific donation
    await updateDonation(donationId, status);
  } else {
    // List and update all pending donations
    const pendingDonations = await listPendingDonations();
    
    if (pendingDonations.length === 0) {
      return;
    }
    
    await updateAllPendingDonations(status);
  }
}

// Run the script
main().catch(console.error);
