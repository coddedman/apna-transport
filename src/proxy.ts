import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Proxy handles low-level request routing.
// Auth checks and mustChangePassword redirects are handled in layouts.
export function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
}
