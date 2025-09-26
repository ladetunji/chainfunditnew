# Link Shortener Setup and Troubleshooting

## Overview

The link shortener functionality uses Dub.co's API to create shortened URLs for campaign sharing. This feature is used across multiple components in the application.

## Components

### 1. Core Link Shortener (`lib/shorten-link.ts`)
- Server-side function that calls Dub.co API
- Requires `DUB_CO_TOKEN` environment variable
- Returns shortened URL or null if failed

### 2. API Route (`app/api/shorten-link/route.ts`)
- Client-accessible endpoint for link shortening
- Handles validation and error responses
- Used by the `useShortenLink` hook

### 3. React Hook (`hooks/use-shorten-link.ts`)
- Client-side hook for link shortening
- Provides loading states and error handling
- Used by all components that need link shortening

### 4. Updated Components
- **Create Campaign Page**: Uses link shortening when campaign is created
- **Share Modal**: Dynamic link shortening for campaign sharing
- **Donate Modal**: Dynamic link shortening for donation sharing
- **Chain Modal**: Dynamic link shortening with referral codes

## Environment Setup

### Required Environment Variable
```bash
DUB_CO_TOKEN=your-dub-co-token
```

### Getting a Dub.co Token
1. Sign up at [dub.co](https://dub.co)
2. Go to your dashboard
3. Navigate to API settings
4. Generate a new API token
5. Add the token to your environment variables

## Deployment Checklist

### For Local Development
1. Create `.env.local` file
2. Add `DUB_CO_TOKEN=your-token`
3. Restart development server

### For Production (Vercel)
1. Go to Vercel dashboard
2. Navigate to your project settings
3. Add environment variable `DUB_CO_TOKEN`
4. Set the value to your Dub.co API token
5. Redeploy the application

## Troubleshooting

### Link Shortener Not Working

#### 1. Check Environment Variable
```bash
# Verify the environment variable is set
echo $DUB_CO_TOKEN
```

#### 2. Test API Route
```bash
curl -X POST http://localhost:3000/api/shorten-link \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/test"}'
```

#### 3. Check Dub.co API Status
- Visit [dub.co/status](https://dub.co/status)
- Verify your API token is valid
- Check if you have remaining API calls

#### 4. Common Issues

**Issue**: `DUB_CO_TOKEN` not set
**Solution**: Add the environment variable to your deployment platform

**Issue**: API returns 401/403
**Solution**: Check if your Dub.co token is valid and has proper permissions

**Issue**: API returns 429 (Rate Limited)
**Solution**: Check your Dub.co usage limits and upgrade if needed

**Issue**: Network errors
**Solution**: Check your internet connection and Dub.co API status

### Fallback Behavior

If link shortening fails, the application will:
1. Use the original long URL as a fallback
2. Show appropriate loading states
3. Display error messages in the console
4. Continue to function normally

## Testing

### Run Tests
```bash
npm test -- --testPathPattern="shorten-link"
```

### Manual Testing
1. Create a new campaign
2. Check if short URL is generated
3. Test sharing functionality
4. Verify links work correctly

## API Usage

### Request Format
```json
POST /api/shorten-link
Content-Type: application/json

{
  "url": "https://example.com/very-long-url"
}
```

### Response Format
```json
{
  "shortUrl": "https://dub.co/abc123"
}
```

### Error Response
```json
{
  "error": "Failed to shorten link"
}
```

## Monitoring

### Logs to Watch
- API route errors in Vercel logs
- Dub.co API response errors
- Environment variable issues

### Metrics to Track
- Link shortening success rate
- API response times
- Error rates by component

## Future Improvements

1. **Caching**: Cache shortened URLs to reduce API calls
2. **Analytics**: Track link click rates
3. **Custom Domains**: Support for custom short domains
4. **Bulk Shortening**: Shorten multiple URLs at once
5. **QR Codes**: Generate QR codes for shortened URLs 