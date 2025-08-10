# OAuth Setup Guide for ChainFundIt

This guide will help you set up Google and Facebook OAuth authentication for your ChainFundIt application.

## Prerequisites

- A Google Developer Account
- A Facebook Developer Account
- Your application deployed or running locally

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "ChainFundIt"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users (your email addresses)

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback` (for development)
   - `https://yourdomain.com/api/auth/callback` (for production)
5. Copy the Client ID and Client Secret

### 4. Add to Environment Variables

Add these to your `.env.local` file:

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Facebook OAuth Setup

### 1. Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App"
3. Choose "Consumer" app type
4. Fill in the app details

### 2. Configure Facebook Login

1. In your app dashboard, go to "Add Product" > "Facebook Login"
2. Choose "Web" platform
3. Add your site URL:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
4. Add OAuth redirect URIs:
   - `http://localhost:3000/api/auth/callback`
   - `https://yourdomain.com/api/auth/callback`

### 3. Configure App Settings

1. Go to "Settings" > "Basic"
2. Add your domain to "App Domains"
3. Add your privacy policy and terms of service URLs
4. Go to "Facebook Login" > "Settings"
5. Add your domain to "Valid OAuth Redirect URIs"

### 4. Get App Credentials

1. Go to "Settings" > "Basic"
2. Copy the App ID and App Secret

### 5. Add to Environment Variables

Add these to your `.env.local` file:

```env
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
```

## Environment Variables

Make sure you have all these environment variables set in your `.env.local` file:

```env
# Database
DATABASE_URL="your-database-url"

# BetterAuth
BETTER_AUTH_SECRET="your-better-auth-secret"

# JWT
JWT_SECRET="your-jwt-secret"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"

# Other required variables...
```

## Testing OAuth

1. Start your development server: `pnpm dev`
2. Go to `/signin` or `/signup`
3. Click on "Google" or "Facebook" buttons
4. Complete the OAuth flow
5. You should be redirected to `/dashboard` after successful authentication

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Make sure your redirect URIs match exactly in both Google/Facebook console and your app
   - Check for trailing slashes and protocol (http vs https)

2. **"App not configured" error**
   - Ensure your app is in "Live" mode (Facebook) or has proper OAuth consent screen setup (Google)
   - Add your email as a test user

3. **Database errors**
   - Run `pnpm db:push` to ensure all BetterAuth tables are created
   - Check your database connection

4. **Environment variables not loading**
   - Make sure your `.env.local` file is in the root directory
   - Restart your development server after adding new environment variables

### Debug Mode

To enable debug logging, add this to your `.env.local`:

```env
DEBUG=true
```

## Security Considerations

1. **Never commit your `.env.local` file** to version control
2. **Use strong, unique secrets** for `BETTER_AUTH_SECRET` and `JWT_SECRET`
3. **Set up proper CORS** for production
4. **Use HTTPS** in production
5. **Regularly rotate your OAuth secrets**

## Production Deployment

1. Update your OAuth app settings with production URLs
2. Set all environment variables in your hosting platform
3. Ensure your domain is verified in both Google and Facebook consoles
4. Test the OAuth flow in production

## Support

If you encounter issues:

1. Check the browser console for errors
2. Check your server logs
3. Verify all environment variables are set correctly
4. Ensure your OAuth apps are properly configured
5. Test with a fresh browser session
