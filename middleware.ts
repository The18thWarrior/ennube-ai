import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "auth"

// Create a middleware function that wraps NextAuth middleware
// and adds support for Salesforce direct authentication
export async function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const path = request.nextUrl.pathname

  // Define protected routes that require authentication
  const protectedPaths = [
    '/subscription',
    '/subscription/success',
  ]
  
  // Check if the current path is a protected path
  const isPathProtected = protectedPaths.some((pp) => 
    path === pp || path.startsWith(`${pp}/`)
  )

  // If the path is protected, verify authentication
  if (isPathProtected) {
    const session = await auth()
    
    // If not authenticated, redirect to signin page
    if (!session) {
      const signInUrl = new URL('/api/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', path)
      return NextResponse.redirect(signInUrl)
    }
  }

  return NextResponse.next()
}

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
