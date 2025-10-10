export const dynamic = "force-dynamic";
import { auth } from "@/auth"
import { getGSuiteCredentialsById } from "@/lib/db/gsuite-storage"
import { redirect } from "next/navigation"

export default async function GSuitePage() {
  const credential = await getGSuiteCredentialsById()
  
  // Redirect based on connection status
  if (credential && credential.accessToken) {
    redirect("/integrations/gsuite/dashboard")
  } else {
    redirect("/integrations/gsuite/connect")
  }
  
  // This won't be reached due to redirects
  return null
}
