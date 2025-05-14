import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function SalesforcePage() {
  const session = await auth()
  
  // Redirect based on connection status
  if (session && session.accessToken) {
    redirect("/dashboard")
  } else {
    redirect("/api/auth/signin?callbackUrl=/dashboard")
  }
  
  // This won't be reached due to redirects
  return null
}
