import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup'];
  
  // Check if the current route is public
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Check for auth token in cookies
  const authToken = request.cookies.get('auth-token');
  
  // Handle root route explicitly
  if (pathname === '/') {
    return NextResponse.redirect(new URL(authToken ? '/dashboard' : '/login', request.url));
  }

  // If no auth token and trying to access protected route, redirect to login
  if (!authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If user is logged in and trying to access login/signup, redirect to dashboard
  if (authToken && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
