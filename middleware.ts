import { NextRequest, NextResponse } from "next/server";
import { verifyUserJWT } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define protected routes
  const protectedRoutes = [
    '/create-campaign',
    '/dashboard',
    '/api/dashboard',
    '/api/campaigns', // POST, PUT, DELETE operations
    '/api/donations', // POST operations
    '/api/payouts',
    '/api/user/profile'
  ];
  
  // Check if the route is protected
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Check if it's a protected API route
  const isProtectedApi = pathname.startsWith('/api/') && 
    (pathname.includes('/dashboard') || 
     pathname.includes('/payouts') || 
     pathname.includes('/user/profile') ||
     (pathname.includes('/campaigns') && ['POST', 'PUT', 'DELETE'].includes(request.method)) ||
     (pathname.includes('/donations') && request.method === 'POST'));

  if (isProtected || isProtectedApi) {
    const token = request.cookies.get("auth_token");
    
    if (!token) {
      if (isProtectedApi) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }
      // Redirect to signin, preserving the original destination
      const signinUrl = new URL("/signin", request.url);
      signinUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signinUrl);
    }
    
    // Verify token
    const userPayload = verifyUserJWT(token.value);
    if (!userPayload) {
      if (isProtectedApi) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
      // Clear invalid token and redirect
      const signinUrl = new URL("/signin", request.url);
      signinUrl.searchParams.set("redirect", pathname);
      const response = NextResponse.redirect(signinUrl);
      response.cookies.delete("auth_token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/create-campaign/:path*',
    '/dashboard/:path*',
    '/api/dashboard/:path*',
    '/api/campaigns/:path*',
    '/api/donations/:path*',
    '/api/payouts/:path*',
    '/api/user/profile/:path*',
  ],
};

