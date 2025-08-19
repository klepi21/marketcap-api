import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow all requests
  return NextResponse.next();
}

// Only run middleware on API routes
export const config = {
  matcher: '/api/:path*'
}