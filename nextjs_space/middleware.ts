import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const securityHeaders: [string, string][] = [
  ['Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload'],
  ['X-Content-Type-Options', 'nosniff'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()'],
  ['Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apps.abacus.ai",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' https:",
    "connect-src 'self' https://generativelanguage.googleapis.com https://www.googleapis.com https://apps.abacus.ai https://*.s3.us-west-2.amazonaws.com",
    "frame-src 'self' https://www.youtube.com https://youtube.com",
    "frame-ancestors 'self' https://*.abacusai.app https://apps.abacus.ai",
  ].join('; ')],
];

export default withAuth(
  function middleware(req) {
    const response = NextResponse.next();
    for (const [key, value] of securityHeaders) {
      response.headers.set(key, value);
    }
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req?.nextUrl?.pathname ?? '';
        if (path?.startsWith('/dashboard') || path?.startsWith('/admin')) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
