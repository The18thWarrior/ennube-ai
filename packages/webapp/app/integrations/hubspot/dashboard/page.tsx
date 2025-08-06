import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import CustomLink from "@/components/custom-link"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import HubSpotSignOut from "./HubSpotSignOut"
import { getHubSpotCredentialsById } from "@/lib/db/hubspot-storage"
import { HubSpotClient } from "@/lib/hubspot"
import Link from "next/link"

export default async function HubspotDashboard() {
  // Check if we have a NextAuth session with HubSpot OAuth data
  const session = await auth()
  const displayQuickActions = true;

  // Check if we have HubSpot credentials
  const hubspotCredentials = await getHubSpotCredentialsById()
  if (!hubspotCredentials) {
    console.log('No HubSpot credentials found, redirecting to connect page')
    redirect("/integrations/hubspot/connect");
  }

  const hubspotClient = new HubSpotClient(
    hubspotCredentials.accessToken, 
    hubspotCredentials.refreshToken,
    process.env.HUBSPOT_CLIENT_ID,
    process.env.HUBSPOT_CLIENT_SECRET,
    hubspotCredentials.expiresAt,
    hubspotCredentials
  );

  // If no HubSpot client available, redirect to connect page
  // if (hubspotClient.) {
  //   console.log('No HubSpot client found, redirecting to connect page')
  //   redirect("/integrations/hubspot/connect");
  // }

  // Removed unnecessary console.log statement
  
  // Fetch user information from HubSpot
  let userInfo;
  let error = null;
  
  try {
    if (hubspotClient) {
      userInfo = await hubspotClient.getUserInfo();
    } 
  } catch (e) {
    console.log("Failed to fetch HubSpot user info:", e);
    error = e instanceof Error ? e.message : "Unknown error";
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <img src={"/hubspot.webp"} alt={'HubSpot Logo'} className="h-10 w-10 object-contain" />
        HubSpot Dashboard
      </h1>

      {error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <p className="text-red-700">
              {error}. Please try reconnecting to HubSpot.
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
                Connected to HubSpot
              </p>
            </div>
          </div>
          
          {/* User Info */}
          {userInfo && (
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage alt={userInfo.email} />
                  <AvatarFallback>{userInfo.email ? userInfo.email.substring(0, 2).toUpperCase() : ''}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-medium">{userInfo.email}</p>
                  <p className="text-sm text-gray-400">Portal ID: {userInfo.portalId}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">User ID</h3>
                  <p>{userInfo.id}</p>
                </div>
              </div>
            </div>
          )}
          
          {displayQuickActions && <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              

              <Button asChild variant="outline" className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2 text-center">
                <Link href={process.env.NEXT_PUBLIC_HUBSPOT_PACKAGE_URL as string} rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-2 w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  <span>Install Managed Package</span>
                </Link>
              </Button>
            </div>
          </div> }

          {/* Data Access Links */}
          {/* <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">HubSpot Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/integrations/hubspot/contacts" passHref>
                <Button variant="outline" className="w-full justify-start">
                  <div className="flex items-center">
                    <span className="mr-2">👤</span>
                    <span>Contacts</span>
                  </div>
                </Button>
              </Link>
              
              <Link href="/integrations/hubspot/companies" passHref>
                <Button variant="outline" className="w-full justify-start">
                  <div className="flex items-center">
                    <span className="mr-2">🏢</span>
                    <span>Companies</span>
                  </div>
                </Button>
              </Link>

              <Link href="/integrations/hubspot/schema" passHref>
                <Button variant="outline" className="w-full justify-start">
                  <div className="flex items-center">
                    <span className="mr-2">🔄</span>
                    <span>Schema Mapping</span>
                  </div>
                </Button>
              </Link>
            </div>
          </div> */}
        </>
      )}
      
      {/* Disconnect Button */}
      <div className="flex justify-end">
        <HubSpotSignOut />
      </div>
    </div>
  )
}
