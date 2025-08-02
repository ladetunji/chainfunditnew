import { NextRequest, NextResponse } from "next/server";

// List of protected routes (add more as needed)
const protectedRoutes = [
  "/dashboard/:path*",
  "/create-campaign",
  "/settings/:path*",
  // add other protected routes here
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected) {
    const token = request.cookies.get("auth_token");
    if (!token) {
      // Redirect to signin, preserving the original destination
      const signinUrl = new URL("/signin", request.url);
      signinUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signinUrl);
    }
  }

  return NextResponse.next();
}

// Optionally, limit middleware to only certain paths for performance
export const config = {
  matcher: [...protectedRoutes],
};