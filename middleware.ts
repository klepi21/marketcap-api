import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  // Allow all requests to /api/marketcap
  if (request.nextUrl.pathname.startsWith('/api/marketcap')) {
    return NextResponse.next()
  }
}
