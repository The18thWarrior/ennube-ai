import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "auth"
import {auth0} from "@/lib/auth0Client";

// Create a middleware function that wraps NextAuth middleware
// and adds support for Salesforce direct authentication
export async function middleware(request: NextRequest) {
  return await auth0.middleware(request);
  // Get the pathname from the URL
  const path = request.nextUrl.pathname

  // Define protected routes that require authentication
  const protectedPaths = [
    '/stripe',
    '/stripe/checkout',
    '/stripe/customer',
    '/stripe/portal',
    '/stripe/subscription',
    '/salesforce/credentials',
    '/hubspot/credentials',
    '/gsuite/credentials',
  ]
  
  // Check if the current path is a protected path
  const isPathProtected = protectedPaths.some((pp) => 
    path === pp || path.startsWith(`${pp}/`)
  )

  // If the path is protected, verify authentication
  if (isPathProtected) {
    return await auth0.middleware(request);
  }

  return NextResponse.next()
}

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
  runtime: 'nodejs',
}
