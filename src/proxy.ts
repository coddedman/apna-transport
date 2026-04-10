import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple proxy for now to fix build errors, we'll handle auth in layouts
export function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
}
