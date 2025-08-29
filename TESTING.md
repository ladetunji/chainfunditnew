# Campaign & Donation Testing Guide

This guide explains how to test the comprehensive campaign status logic and donation status display functionality.

## 🎯 **What We've Implemented**

### **1. Campaign Status Logic**
- **Automatic Status Determination**: Campaigns are automatically categorized based on duration, time, and funding goals
- **Time-Based Expiration**: Campaigns automatically move to "Past" when they exceed their duration
- **Goal-Based Status**: Campaigns are marked as "Goal Reached" when funding target is met
- **Manual Override**: Respects manually closed campaigns

### **2. Donation Status Display**
- **Multiple Statuses**: Shows completed, pending, and failed donations with appropriate styling
- **Visual Indicators**: Color-coded badges for each donation status
- **Status Icons**: Clear visual representation of donation states

## 🧪 **How to Test**

### **Option 1: Use the Test Page**
1. Navigate to `/test` in your browser
2. Click "Test Campaign Logic" to see campaign status determination
3. Click "Test Donation Statuses" to see donation status examples
4. Check the browser console for detailed results

### **Option 2: Use the Test API Endpoint**
```bash
# Populate test campaigns
curl -X POST http://localhost:3000/api/test/populate \
  -H "Content-Type: application/json" \
  -d '{"action": "populate_campaigns", "creatorId": "your-user-id"}'

# Populate test donations
curl -X POST http://localhost:3000/api/test/populate \
  -H "Content-Type: application/json" \
  -d '{"action": "populate_donations", "campaignId": "campaign-id", "donorIds": ["donor1", "donor2"]}'

# Clean up test data
curl -X POST http://localhost:3000/api/test/populate \
  -H "Content-Type: application/json" \
  -d '{"action": "cleanup"}'
```

### **Option 3: Manual Testing**
1. **Create campaigns with different durations** (1 week, 1 month, 1 year)
2. **Wait for time-based expiration** or manually adjust dates in the database
3. **Create donations with different statuses** (completed, pending, failed)
4. **Navigate to campaigns page** to see live/past filtering
5. **View individual campaign pages** to see donation statuses

## 📊 **Campaign Status Types**

| Status | Description | Visual Indicator | When It Occurs |
|--------|-------------|------------------|-----------------|
| **Active** | Campaign is running | Green badge | Has time remaining and goal not reached |
| **Expired** | Campaign exceeded duration | Red badge with clock | Duration exceeded automatically |
| **Goal Reached** | Funding target met | Blue badge with target | Current amount ≥ goal amount |
| **Closed** | Manually closed | Gray badge with X | Creator manually closed campaign |

## 💰 **Donation Status Types**

| Status | Description | Visual Indicator | Color Scheme |
|--------|-------------|------------------|--------------|
| **Completed** | Payment successful | ✓ Completed | Green background |
| **Pending** | Payment processing | ⏳ Pending | Yellow background |
| **Failed** | Payment unsuccessful | ✗ Failed | Red background |

## 🔧 **Technical Implementation**

### **Campaign Status Logic**
- **File**: `lib/utils/campaign-status.ts`
- **Functions**:
  - `getCampaignStatus()`: Determines current status
  - `isPastCampaign()`: Checks if campaign should be in past tab
  - `isLiveCampaign()`: Checks if campaign should be in live tab
  - `getTimeRemaining()`: Formats time remaining/overdue

### **Test Data Generation**
- **File**: `lib/utils/test-data.ts`
- **Functions**:
  - `generateTestCampaigns()`: Creates campaigns with different scenarios
  - `generateTestDonations()`: Creates donations with different statuses

### **API Endpoint**
- **File**: `app/api/test/populate/route.ts`
- **Actions**:
  - `populate_campaigns`: Insert test campaigns
  - `populate_donations`: Insert test donations
  - `cleanup`: Remove test data

## 📱 **UI Components Updated**

### **Campaigns Page**
- **Live Tab**: Shows active campaigns with time remaining
- **Past Tab**: Shows expired, goal-reached, and closed campaigns
- **Status Badges**: Visual indicators for campaign states

### **Campaign Display**
- **Time Remaining**: Shows countdown or expiration info
- **Status Indicators**: Clear visual representation of campaign state

### **Donation Display**
- **Status Badges**: Color-coded donation status indicators
- **Enhanced Layout**: Better organization of donation information

## 🚀 **Testing Scenarios**

### **Scenario 1: Time-Based Expiration**
1. Create campaign with 1-week duration
2. Wait 8 days or manually adjust creation date
3. Verify campaign appears in "Past" tab
4. Check status shows "Expired X days ago"

### **Scenario 2: Goal Reached**
1. Create campaign with goal of ₦100,000
2. Add donation of ₦100,000 or more
3. Verify campaign appears in "Past" tab
4. Check status shows "Goal Reached"

### **Scenario 3: Manual Closure**
1. Create active campaign
2. Manually set status to "closed" in database
3. Verify campaign appears in "Past" tab
4. Check status shows "Closed"

### **Scenario 4: Donation Statuses**
1. Create campaign
2. Add donations with different statuses
3. View campaign page
4. Verify status badges display correctly

## 🐛 **Troubleshooting**

### **Campaigns Not Moving to Past Tab**
- Check campaign duration format (should be "1 week", "1 month", etc.)
- Verify creation date is correct
- Check if `isActive` flag is set correctly

### **Donation Statuses Not Displaying**
- Verify donation `paymentStatus` field has correct values
- Check if donation data includes all required fields
- Ensure donation API is returning correct data structure

### **Test Data Not Working**
- Check database connection
- Verify API endpoint is accessible
- Check browser console for error messages

## 📝 **Database Schema Requirements**

### **Campaigns Table**
- `duration`: String (e.g., "1 week", "1 month")
- `createdAt`: Timestamp
- `status`: String (active, closed, etc.)
- `isActive`: Boolean
- `currentAmount`: Decimal
- `goalAmount`: Decimal

### **Donations Table**
- `paymentStatus`: String (completed, pending, failed)
- `amount`: Decimal
- `currency`: String
- `message`: Text (optional)
- `isAnonymous`: Boolean

## 🔮 **Future Enhancements**

- **Real-time Updates**: WebSocket integration for live status updates
- **Email Notifications**: Alert creators when campaigns expire
- **Auto-extension**: Allow campaigns to extend duration if close to goal
- **Analytics Dashboard**: Track campaign performance over time
- **Bulk Operations**: Mass update campaign statuses

## 📞 **Support**

If you encounter issues:
1. Check the browser console for error messages
2. Verify database schema matches requirements
3. Test with the provided test endpoints
4. Review the implementation files for debugging

---

**Happy Testing! 🎉**
