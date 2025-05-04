import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "auth"

// Create a middleware function that wraps NextAuth middleware
// and adds support for Salesforce direct authentication
export async function middleware(request: NextRequest) {
  // // Run the NextAuth middleware first
  // const authMiddlewareResponse = await auth()(request)
  
  // // Get the response to modify, either from auth middleware or create a new one
  // const response = authMiddlewareResponse || NextResponse.next()
  
  // // Check if there's a session ID cookie for Salesforce direct authentication
  // const sfSessionId = request.cookies.get("sf_session_id")?.value
  
  // if (sfSessionId) {
  //   // Pass the session ID to the server component through headers
  //   response.headers.set("x-sf-session-id", sfSessionId)
  // }
  
  // return response

  return NextResponse.next();
}

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
