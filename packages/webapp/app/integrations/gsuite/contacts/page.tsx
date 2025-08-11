export const dynamic = "force-dynamic";
import { auth } from "@/auth"
import { getGSuiteCredentialsById } from "@/lib/db/gsuite-storage"
import { redirect } from "next/navigation"
import { GSuiteClient } from "@/lib/gsuite"
import ContactsSearch from "./ContactsSearch"

export default async function ContactsPage() {
  // Check if we have GSuite credentials
  const gsuiteCredentials = await getGSuiteCredentialsById()
  
  if (!gsuiteCredentials || !gsuiteCredentials.accessToken) {
    redirect("/integrations/gsuite/connect")
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Google Contacts
      </h1>

      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="mb-6">
          Search and manage your Google Contacts directly from this application.
          Use the search box below to find specific contacts.
        </p>
        
        <div className="mt-4">
          <ContactsSearch />
        </div>
      </div>
    </div>
  )
}
