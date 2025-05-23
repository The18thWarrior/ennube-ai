import { auth } from "@/auth"
import { getSalesforceCredentialsById } from "@/lib/db/salesforce-storage"
import { redirect } from "next/navigation"

export default async function SalesforcePage() {
  const credential = await getSalesforceCredentialsById()
  
  // Redirect based on connection status
  if (credential && credential.accessToken) {
    redirect("/integrations/salesforce/dashboard")
  } else {
    redirect("/integrations/salesforce/connect")
  }
  
  // This won't be reached due to redirects
  return null
}
