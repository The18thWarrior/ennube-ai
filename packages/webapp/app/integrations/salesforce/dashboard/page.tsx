import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import CustomLink from "@/components/custom-link"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import SalesforceSignOut from "./SalesforceSignOut"
import { getSalesforceCredentialsById } from "@/lib/db/salesforce-storage"
import { SalesforceClient } from "@/lib/salesforce"
import Link from "next/link"
import EmbedMetadataButton from '@/components/integrations/salesforce/embed-metadata'

export default async function SalesforceDashboard() {
  // Check if we have a NextAuth session with Salesforce OAuth data
  const session = await auth()
  const displayQuickActions = true;
  console.log(session?.user?.auth0)
  //console.log('Session:', session?.user?.auth0)
  // Check if we have a Salesforce client from either OAuth or direct authentication
  const salesforceCredentials = await getSalesforceCredentialsById()
  //console.log(salesforceCredentials);
  if (!salesforceCredentials) {
    console.log('No Salesforce credentials found, redirecting to connect page')
    redirect("/integrations/salesforce/connect");
  }
  const instanceUrl = salesforceCredentials.instanceUrl || 'https://login.salesforce.com';
  //console.log(salesforceCredentials);
  const salesforceClient = new SalesforceClient(salesforceCredentials.accessToken, salesforceCredentials.instanceUrl, session?.user?.auth0?.sub as string,salesforceCredentials.refreshToken as string);
  // If no Salesforce client available and no OAuth session, redirect to connect page
  if (!salesforceClient) {
    console.log('No Salesforce client found, redirecting to connect page')
    redirect("/integrations/salesforce/connect");
  }
  
  // Fetch user information from Salesforce
  let userInfo;
  let error = null;
  
  try {
    if (salesforceClient) {
      userInfo = await salesforceClient.getUserInfo();
    } 
  } catch (e) {
    console.log("Failed to fetch Salesforce user info:", e);
    error = e instanceof Error ? e.message : "Unknown error";
  }

  // Check if the managed package is installed
  let isPackageInstalled = false;
  let isPackageOutOfDate = false;
  try {
    if (salesforceClient) {
      const result = await salesforceClient.isPackageInstalled(process.env.NEXT_PUBLIC_SFDC_MANAGED_PACKAGE_NAMESPACE as string);
      isPackageInstalled = result ?.installed !== false;
      isPackageOutOfDate = result ?.validVersion === false;
    }
  } catch (e) {
    console.log("Failed to check package installation:", e);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <img src={"/salesforce-logo.png"} alt={'Salesforce Logo'} className="h-10 w-10 object-contain" />
        Salesforce Dashboard
      </h1>

      {error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <p className="text-red-700">
              {error}. Please try reconnecting to Salesforce.
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
                Connected to Salesforce {session?.user?.salesforce ? "(via OAuth)" : ""}
              </p>
            </div>
          </div>
          
          {/* User Info */}
          {userInfo && (
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={''} alt={userInfo.display_name} />
                  <AvatarFallback>{userInfo.display_name ? userInfo.display_name.substring(0, 2).toUpperCase() : ''}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-medium">{userInfo.display_name}</p>
                  <p className="text-gray-500">{userInfo.email}</p>
                  <p className="text-sm text-gray-400">Organization ID: {userInfo.organization_id}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Instance Url</h3>
                  <p>{salesforceCredentials.instanceUrl}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Quick Actions */}
          {displayQuickActions && <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* <Button asChild variant="outline" className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2">
                <CustomLink href="/salesforce/contacts">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Manage Contacts</span>
                </CustomLink>
              </Button> 
              
              <Button asChild variant="outline" className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2">
                <CustomLink href="/integrations/salesforce/accounts">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>View Accounts</span>
                </CustomLink>
              </Button> */}

              {<Button asChild variant="outline" className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2 text-center">
                <Link href={`${salesforceCredentials.instanceUrl}/${process.env.NEXT_PUBLIC_SFDC_MANAGED_PACKAGE_QUERY as string}`} rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-2 w-full" target="_blank" >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  <span>{!isPackageInstalled ? "Install Managed Package" : isPackageOutOfDate ? "Managed Package is out of date (reinstall)" : "Managed Package is installed"}</span>
                </Link>
              </Button>}
              {/* Embed metadata quick action */}
              <EmbedMetadataButton instanceUrl={salesforceCredentials.instanceUrl} />
              
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
              <CustomLink href="/integrations/salesforce/connect">Reconnect to Salesforce</CustomLink>
            </Button>
            
            {/* Sign Out button for both OAuth and direct login */}
            <div className="w-full sm:w-auto">
              <SalesforceSignOut />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
