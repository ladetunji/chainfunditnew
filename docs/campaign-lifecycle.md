# Campaign Lifecycle Management

## Overview

ChainFundIt now includes comprehensive campaign lifecycle management to prevent donations/chains for completed or expired campaigns and automatically close campaigns after reaching their goal.

## Campaign Statuses

### Active Statuses
- **`active`**: Campaign is running and accepting donations/chains
- **`goal_reached`**: Campaign reached its goal, no longer accepts donations/chains, remains open for 4 weeks before auto-closing

### Inactive Statuses
- **`paused`**: Campaign is temporarily paused by creator
- **`closed`**: Campaign is closed (manually or auto-closed after 4 weeks)
- **`expired`**: Campaign has passed its expiration date

## Auto-Close Logic

### Goal Reached Auto-Close
When a campaign reaches its funding goal:
1. Status changes to `goal_reached`
2. `goalReachedAt` timestamp is set
3. `autoCloseAt` is set to 4 weeks from goal reached date
4. Campaign stops accepting donations and new chains immediately
5. Campaign remains open for viewing only
6. After 4 weeks, campaign automatically closes

### Expiration Auto-Close
If a campaign has an `expiresAt` date set:
1. Campaign automatically expires when past the date
2. Status changes to `expired`
3. No donations or chains accepted

## Database Schema Changes

### New Fields Added to `campaigns` Table

```sql
-- Auto-close logic fields
ALTER TABLE "campaigns" ADD COLUMN "goal_reached_at" timestamp;
ALTER TABLE "campaigns" ADD COLUMN "auto_close_at" timestamp;
ALTER TABLE "campaigns" ADD COLUMN "expires_at" timestamp;

-- Performance indexes
CREATE INDEX "idx_campaigns_status" ON "campaigns" ("status");
CREATE INDEX "idx_campaigns_auto_close_at" ON "campaigns" ("auto_close_at");
CREATE INDEX "idx_campaigns_expires_at" ON "campaigns" ("expires_at");
CREATE INDEX "idx_campaigns_goal_reached_at" ON "campaigns" ("goal_reached_at");
```

## API Changes

### Validation Logic

All donation and chaining APIs now use `validateCampaignForDonations()` which:
- Checks campaign status
- Validates expiration dates
- Handles auto-close timing
- Returns detailed error messages

### Updated Endpoints

#### Donation APIs
- `/api/donations` (POST)
- `/api/payments/initialize`

**New Validation:**
- Prevents donations to closed/expired campaigns
- Prevents donations to goal_reached campaigns (goal already achieved)
- Returns campaign status in error responses

#### Chaining APIs
- `/api/chainers` (POST)

**New Validation:**
- Prevents new chains for goal_reached campaigns (goal already achieved)
- Prevents new chains for closed/expired campaigns

#### Payment Callbacks
- `/api/payments/paystack/callback`
- `/api/payments/stripe/callback`

**Enhanced Logic:**
- Automatically checks and updates goal status after successful payments
- Sets auto-close timers when goals are reached

## Cron Job

### Auto-Close Cron Job
**Endpoint:** `/api/cron/campaigns`

**Functionality:**
- Auto-closes campaigns 4 weeks after goal reached
- Marks campaigns as expired when past expiration date
- Runs daily (configure in your cron scheduler)

**Security:**
- Requires `CRON_SECRET` environment variable
- Uses Bearer token authentication

**Environment Variable:**
```bash
CRON_SECRET=your-secure-cron-secret-key
```

**Cron Setup Example:**
```bash
# Run daily at 2 AM
0 2 * * * curl -X POST -H "Authorization: Bearer your-secure-cron-secret-key" https://your-domain.com/api/cron/campaigns
```

## User Experience

### For Donors
- Clear error messages when campaigns are closed/expired
- Clear error messages when campaigns have reached their goal
- Information about auto-close timing

### For Campaign Creators
- Automatic goal tracking
- 4-week viewing period after reaching goal
- Clear campaign status indicators

### For Chainers
- Cannot create new chains for completed campaigns
- Cannot create new chains for goal-reached campaigns
- Existing chains continue to work until campaign closes
- Clear feedback on campaign status

## Error Messages

### Donation Errors
- `"Campaign has been closed"`
- `"Campaign has expired"`
- `"Campaign is currently paused"`
- `"Campaign reached goal and will close in X days"` (goal already achieved, no more donations accepted)

### Chaining Errors
- `"Campaign cannot accept new chains"`
- `"Campaign reached goal and will close in X days"` (goal already achieved, no new chains)
- `"Campaign has been closed"`

## Implementation Details

### Campaign Validation Function
```typescript
validateCampaignForDonations(campaignId: string): Promise<{
  canAcceptDonations: boolean;
  canAcceptChains: boolean;
  reason?: string;
  campaign?: any;
}>
```

### Goal Reached Check
```typescript
checkAndUpdateGoalReached(campaignId: string): Promise<boolean>
```

### Auto-Close Functions
```typescript
autoCloseExpiredCampaigns(): Promise<number>
markExpiredCampaigns(): Promise<number>
```

## Testing

### Manual Testing
In development, you can trigger the cron job manually:
```bash
curl -X GET http://localhost:3000/api/cron/campaigns
```

### Test Scenarios
1. **Goal Reached**: Donate to reach campaign goal, verify status changes
2. **Auto-Close**: Set `autoCloseAt` to past date, run cron job
3. **Expiration**: Set `expiresAt` to past date, try to donate
4. **Chaining**: Try to create chainer for goal_reached campaign

## Migration

To apply the database changes:

1. **Run Migration:**
```bash
# Apply the new migration
psql -d your_database -f lib/migrations/0002_add_campaign_auto_close_fields.sql
```

2. **Set Environment Variable:**
```bash
CRON_SECRET=your-secure-cron-secret-key
```

3. **Setup Cron Job:**
Configure your cron scheduler to call `/api/cron/campaigns` daily

## Monitoring

### Logs to Monitor
- Campaign status changes
- Auto-close operations
- Validation failures
- Cron job execution

### Metrics to Track
- Number of campaigns auto-closed
- Number of campaigns expired
- Donation rejection rates by status
- Goal reached events

## Future Enhancements

### Potential Features
- Email notifications when campaigns reach goals
- Graceful handling of partial goals
- Campaign extension requests
- Advanced expiration policies
- Campaign analytics and reporting

### Configuration Options
- Configurable grace period (currently 4 weeks)
- Per-campaign expiration settings
- Notification preferences
- Auto-close scheduling flexibility