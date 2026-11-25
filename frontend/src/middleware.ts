import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/reminders',
  '/bills',
  '/subscriptions',
  '/expenses',
  '/tasks',
  '/documents',
  '/assistant',
  '/settings',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  const { supabaseResponse, user } = await updateSession(request);

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
