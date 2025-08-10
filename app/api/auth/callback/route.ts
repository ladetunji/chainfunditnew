import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateUserJWT } from '@/lib/auth';

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
        // Generate JWT token
        const token = generateUserJWT({ 
          id: responseData.user.id, 
          email: responseData.user.email 
        });

        // Create response with redirect to dashboard
        const response = NextResponse.redirect(new URL('/dashboard', request.url));
        
        // Set auth cookie
        response.cookies.set("auth_token", token, {
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
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
