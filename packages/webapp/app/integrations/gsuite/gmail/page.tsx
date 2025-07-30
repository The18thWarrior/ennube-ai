import { auth } from "@/auth"
import { getGSuiteCredentialsById } from "@/lib/db/gsuite-storage"
import { redirect } from "next/navigation"
import { GSuiteClient } from "@/lib/gsuite"
import GmailSearch from "./GmailSearch"

export default async function GmailPage() {
  // Check if we have GSuite credentials
  const gsuiteCredentials = await getGSuiteCredentialsById()
  
  if (!gsuiteCredentials || !gsuiteCredentials.accessToken) {
    redirect("/integrations/gsuite/connect")
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <img src={"/gmail-logo.webp"} alt="Gmail Logo" className="h-10 w-10" />
        Gmail Integration
      </h1>

      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="mb-6">
          Search and manage your Gmail messages directly from this application. 
          Use the search box below to find specific emails.
        </p>
        
        <div className="mt-4">
          <GmailSearch />
        </div>
      </div>
    </div>
  )
}
