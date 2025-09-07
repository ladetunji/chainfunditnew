# Testing Pending and Failed Donations Flow

This guide explains how to test the pending and failed donation scenarios in your ChainFundIt application.

## 🎯 Overview

The donation system supports three main states:
- **✅ Success/Completed**: Payment processed successfully
- **⏳ Pending**: Payment initiated but not yet completed
- **❌ Failed**: Payment failed or was rejected

## 🔄 Payment Status Checking

### **Automatic Status Updates (Recommended)**
- **Webhooks**: Stripe and Paystack automatically update donation statuses
- **Real-time**: Status changes happen immediately when payments complete/fail
- **Reliable**: No manual intervention needed

### **User Status Checking**
- **Simple Check**: Users can check their donation status via API
- **Auto-updates**: If pending, automatically checks with payment provider
- **User-friendly**: Clean, simple interface for users

## 🚀 Method 1: UI Testing (Recommended)

### Step 1: Enable Test Mode
1. Open any campaign page
2. Click "Donate" to open the donation modal
3. Check the "Test Mode" checkbox
4. You'll see three scenario buttons appear:
   - ✅ Success
   - ⏳ Pending  
   - ❌ Failed

### Step 2: Test Each Scenario

#### Test Success Scenario:
1. Select "✅ Success" button
2. Fill in donation details (amount, name, email, etc.)
3. Click "Continue" → "Test Success"
4. **Expected Result**: Donation appears in "Received" donations with "completed" status

#### Test Pending Scenario:
1. Select "⏳ Pending" button
2. Fill in donation details
3. Click "Continue" → "Test Pending"
4. **Expected Result**: Donation appears in "Pending" donations with "pending" status

#### Test Failed Scenario:
1. Select "❌ Failed" button
2. Fill in donation details
3. Click "Continue" → "Test Failed"
4. **Expected Result**: Donation appears in "Failed" donations with "failed" status

### Step 3: Verify Results
Check your dashboard at `/dashboard/donations`:
- **Received tab**: Shows completed donations
- **Pending tab**: Shows pending donations
- **Failed tab**: Shows failed donations

## 🔧 Method 2: Script Testing

### Prerequisites:
1. Update the campaign ID in `scripts/test-pending-failed-donations.ts`
2. Ensure you're authenticated (add session cookies)

### Run the Test Script:
```bash
npx tsx scripts/test-pending-failed-donations.ts
```

This will:
1. Create a pending donation
2. Create a failed donation  
3. Create a completed donation
4. Show you the results

## 🔍 Method 3: API Testing

### Test Pending Donation:
```bash
# 1. Initialize donation (creates pending status)
curl -X POST http://localhost:3001/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "your-campaign-id",
    "amount": 50,
    "currency": "NGN",
    "paymentProvider": "stripe",
    "simulate": true
  }'

# 2. Leave it pending (don't call simulate API)
```

### Test Failed Donation:
```bash
# 1. Initialize donation
curl -X POST http://localhost:3001/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "your-campaign-id", 
    "amount": 75,
    "currency": "NGN",
    "paymentProvider": "paystack",
    "simulate": true
  }'

# 2. Simulate failure
curl -X POST http://localhost:3001/api/payments/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "donationId": "donation-id-from-step-1",
    "status": "failed"
  }'
```

### Test Completed Donation:
```bash
# 1. Initialize donation
curl -X POST http://localhost:3001/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "your-campaign-id",
    "amount": 100, 
    "currency": "NGN",
    "paymentProvider": "stripe",
    "simulate": true
  }'

# 2. Simulate success
curl -X POST http://localhost:3001/api/payments/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "donationId": "donation-id-from-step-1",
    "status": "completed"
  }'
```

## 🔍 Method 4: User Status Checking

### **Check Donation Status:**
```bash
# Check a specific donation's status
curl -X GET "http://localhost:3001/api/donations/status?donationId=your-donation-id"
```

**Response:**
```json
{
  "success": true,
  "donationId": "donation-123",
  "status": "completed",
  "wasUpdated": false,
  "message": "Donation is completed",
  "donation": {
    "id": "donation-123",
    "amount": "100.00",
    "currency": "NGN",
    "paymentStatus": "completed",
    "createdAt": "2024-01-01T00:00:00Z",
    "processedAt": "2024-01-01T00:05:00Z"
  }
}
```

### **React Hook Usage:**
```typescript
import { useDonationStatus } from '@/hooks/use-donation-status';

const { checkDonationStatus, loading, error } = useDonationStatus();

// Check donation status
const result = await checkDonationStatus('donation-id');
if (result.status === 'completed') {
  // Show success message
}
```

## 📊 What to Check

After testing, verify:

### Dashboard Donations Page:
- **Received**: Shows completed donations with amounts
- **Pending**: Shows pending donations waiting for completion
- **Failed**: Shows failed donations with error status

### Campaign Data:
- Campaign progress bars should update with completed donations
- Total raised amount should reflect only completed donations
- Pending/failed donations should NOT affect campaign totals

### Database Verification:
```sql
-- Check donation statuses
SELECT paymentStatus, COUNT(*) as count 
FROM donations 
GROUP BY paymentStatus;

-- Check campaign amounts (should only include completed donations)
SELECT id, title, currentAmount, targetAmount 
FROM campaigns;
```

## 🐛 Troubleshooting

### Common Issues:

1. **"Not authenticated" error**:
   - Make sure you're logged in
   - Check session cookies are present

2. **"Campaign not found" error**:
   - Verify campaign ID exists
   - Check campaign is published

3. **Donations not appearing**:
   - Refresh the dashboard page
   - Check browser console for errors
   - Verify API responses

4. **Test mode not working**:
   - Ensure development server is running
   - Check environment variables are set
   - Verify test mode checkbox is checked

## 🎉 Success Indicators

You'll know the testing is successful when:
- ✅ All three donation states work correctly
- ✅ Dashboard properly categorizes donations
- ✅ Campaign data updates only with completed donations
- ✅ Pending donations remain in pending state
- ✅ Failed donations show in failed section
- ✅ No TypeScript or runtime errors

## 📝 Notes

- Test donations are created with `simulate: true` flag
- Only completed donations affect campaign totals
- Pending donations can be manually completed later via API
- Failed donations can be retried by creating new donations
- All test data is stored in the same database as real donations
