import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";


export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;

  // Never redirect API routes or Clerk's own routes
  if (path.startsWith("/api") || path.startsWith("/__clerk")) {
    return NextResponse.next();
  }

  // Onboarding is for signed-in users only
  if (path.startsWith("/onboarding")) {
    await auth.protect();
    return NextResponse.next();
  }

  // Signed in but hasn't picked an account type yet: send them to onboarding
  const { isAuthenticated, sessionClaims } = await auth();
  if (isAuthenticated && !sessionClaims?.metadata?.onboardingComplete) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for Clerk's auto-proxy path
    '/__clerk/:path*',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};