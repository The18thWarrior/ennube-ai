export const dynamic = "force-dynamic";
import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import CustomLink from "@/components/custom-link"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import GSuiteSignOut from "./GSuiteSignOut"
import { getGSuiteCredentialsById } from "@/lib/db/gsuite-storage"
import { GSuiteClient } from "@/lib/gsuite"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default async function GSuiteDashboard() {
  // Check if we have a NextAuth session with GSuite OAuth data
  const session = await auth()
  const displayQuickActions = false;
  // Check if we have a GSuite client from OAuth authentication
  const gsuiteCredentials = await getGSuiteCredentialsById()
  if (!gsuiteCredentials) {
    redirect("/integrations/gsuite/connect");
  }

  // Create GSuite client from credentials
  const gsuiteClient = new GSuiteClient(
    gsuiteCredentials.accessToken || "",
    gsuiteCredentials.refreshToken || "",
    gsuiteCredentials.expiryDate,
    gsuiteCredentials.clientId || "",
    gsuiteCredentials.clientSecret || ""
  );
  
  // If no GSuite client available and no OAuth session, redirect to connect page
  if (!gsuiteClient) {
    redirect("/integrations/gsuite/connect");
  }
  
  // Fetch user information from GSuite
  let userInfo;
  let error = null;
  
  try {
    userInfo = await gsuiteClient.getUserInfo();
  } catch (e) {
    console.log("Failed to fetch Google user info:", e);
    error = e instanceof Error ? e.message : "Unknown error";
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <img src={"/gmail-logo.webp"} alt="Google Workspace Logo" className="h-10 w-10 object-contain" />
        Google Workspace Dashboard
      </h1>

      {error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 dark:bg-red-900/20">
          <div className="flex">
            <p className="text-red-700 dark:text-red-300">
              {error}. Please try reconnecting to Google Workspace.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Connection Status */}
          <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-green-700 dark:text-green-400 font-medium">
                Connected to Google Workspace
              </p>
            </div>
          </div>
          
          {/* User Info */}
          {userInfo && (
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={userInfo.picture || ''} alt={userInfo.name || ''} />
                  <AvatarFallback>{userInfo.name ? userInfo.name.substring(0, 2).toUpperCase() : 'GS'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-medium">{userInfo.name}</p>
                  <p className="text-gray-500">{userInfo.email}</p>
                  <div className="flex mt-1 space-x-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200">
                      Google Workspace
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Quick Actions */}
          {displayQuickActions &&  <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2">
                <CustomLink href="/integrations/gsuite/gmail">
                  <img src={"/gmail-logo.webp"} alt="Gmail Logo" className="h-6 w-6" />
                  <span>Manage Gmail</span>
                </CustomLink>
              </Button>
              
              <Button asChild variant="outline" className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2">
                <CustomLink href="/integrations/gsuite/calendar">
                  <img src={"/google-calendar-logo.png"} alt="Google Calendar Logo" className="h-6 w-6" />
                  <span>Manage Calendar</span>
                </CustomLink>
              </Button>

              <Button asChild variant="outline" className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2">
                <CustomLink href="/integrations/gsuite/contacts">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Manage Contacts</span>
                </CustomLink>
              </Button>
            </div>
          </div> }
        </>
      )}
      
      {/* Administration Section */}
      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Administration</h2>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-row space-x-4">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <CustomLink href="/integrations/gsuite/connect">Reconnect to Google Workspace</CustomLink>
            </Button>
            
            {/* Sign Out button */}
            <div className="w-full sm:w-auto">
              <GSuiteSignOut />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
