import { auth } from "@/auth"
import { getSalesforceCredentialsById } from "@/lib/salesforce-storage"
import { redirect } from "next/navigation"

export default async function SalesforcePage() {
  const credential = await getSalesforceCredentialsById()
  
  // Redirect based on connection status
  if (credential && credential.accessToken) {
    redirect("/salesforce/dashboard")
  } else {
    redirect("/salesforce/connect")
  }
  
  // This won't be reached due to redirects
  return null
}
