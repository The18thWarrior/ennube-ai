export const dynamic = "force-dynamic";
import { auth } from "@/auth"
import { getHubSpotCredentialsById } from "@/lib/db/hubspot-storage"
import { redirect } from "next/navigation"

export default async function HubspotPage() {
  const credential = await getHubSpotCredentialsById()
  
  // Redirect based on connection status
  if (credential && credential.accessToken) {
    redirect("/integrations/hubspot/dashboard")
  } else {
    redirect("/integrations/hubspot/connect")
  }
  
  // This won't be reached due to redirects
  return null
}
