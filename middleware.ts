import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow all requests to /api/marketcap
  if (request.nextUrl.pathname.startsWith('/api/marketcap')) {
    return NextResponse.next();
  }

  // For all other routes, proceed normally
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
}