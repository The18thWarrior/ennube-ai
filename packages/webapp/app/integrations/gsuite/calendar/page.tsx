export const dynamic = "force-dynamic";
import { auth } from "@/auth"
import { getGSuiteCredentialsById } from "@/lib/db/gsuite-storage"
import { redirect } from "next/navigation"
import { GSuiteClient } from "@/lib/gsuite"
import CalendarView from "./CalendarView"

export default async function CalendarPage() {
  // Check if we have GSuite credentials
  const gsuiteCredentials = await getGSuiteCredentialsById()
  
  if (!gsuiteCredentials || !gsuiteCredentials.accessToken) {
    redirect("/integrations/gsuite/connect")
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <img src={"/google-calendar-logo.png"} alt="Google Calendar Logo" className="h-10 w-10" />
        Google Calendar Integration
      </h1>

      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="mb-6">
          Manage your calendar events and schedule meetings directly from this application.
          View upcoming events and create new ones.
        </p>
        
        <div className="mt-4">
          <CalendarView />
        </div>
      </div>
    </div>
  )
}
