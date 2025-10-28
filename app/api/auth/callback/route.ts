import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateTokenPair } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(new URL('/signin?error=oauth_failed', request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/signin?error=invalid_callback', request.url));
    }

    // Handle the OAuth callback with BetterAuth
    const result = await auth.handler(request);
    
    if (result instanceof Response) {
      // Check if the response contains user data
      const responseData = await result.clone().json().catch(() => null);
      
      if (responseData?.user) {
        // Generate access and refresh tokens
        const tokens = await generateTokenPair({ 
          id: responseData.user.id, 
          email: responseData.user.email 
        }, request);

        // Get user role for role-based redirection
        let redirectUrl = '/dashboard';
        try {
          const userResponse = await fetch(`${request.nextUrl.origin}/api/user/me`, {
            headers: {
              'Cookie': `auth_token=${tokens.accessToken}; refresh_token=${tokens.refreshToken}`
            }
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const userRole = userData.user?.role;
            if (userRole === 'admin' || userRole === 'super_admin') {
              redirectUrl = '/admin/admin-dashboard/overview';
            }
          }
        } catch (error) {
          console.error('Error getting user role for OAuth redirect:', error);
        }

        // Create response with role-based redirect
        const response = NextResponse.redirect(new URL(redirectUrl, request.url));
        
        // Set access token cookie (30 minutes)
        response.cookies.set("auth_token", tokens.accessToken, {
          httpOnly: true,
          path: "/",
          maxAge: 30 * 60, // 30 minutes
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });

        // Set refresh token cookie (30 days)
        response.cookies.set("refresh_token", tokens.refreshToken, {
          httpOnly: true,
          path: "/",
          maxAge: 30 * 24 * 60 * 60, // 30 days
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });

        return response;
      }
    }

    // If no user data, redirect to signin with error
    return NextResponse.redirect(new URL('/signin?error=oauth_failed', request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/signin?error=oauth_failed', request.url));
  }
}
