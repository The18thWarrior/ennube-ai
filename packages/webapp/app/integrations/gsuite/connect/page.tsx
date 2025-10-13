import CustomLink from "@/components/custom-link"
import { Button } from "@/components/ui/button"
import { auth, signIn } from "@/auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import GoogleLoginForm from "./GoogleLoginForm"

export default async function GSuiteConnect() {
  const session = await auth()
  
  // If user is already connected to GSuite, redirect to the GSuite dashboard
//   if (session?.user?.gsuite) {
//     redirect("/integrations/gsuite/dashboard")
//   }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Connect to Google Workspace</h1>

      <div className="p-6 bg-muted  rounded-lg">
        <p className="mb-4">Connect your Google Workspace (formerly G Suite) account to access and manage your Gmail, Google Calendar, and Google Contacts directly from this application.</p>
        {/* <GoogleLoginForm /> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-muted  rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Benefits of connecting</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Access your Gmail emails without switching applications</li>
            <li>Manage your Google Calendar events and meetings</li>
            <li>Search and organize your Google Contacts</li>
            <li>Automate workflows between Google Workspace and other services</li>
          </ul>
        </div>
        
        <div className="p-6 bg-muted  rounded-lg">
          <h2 className="text-xl font-semibold mb-4">How it works</h2>
          <p className="mb-4">When you connect to Google Workspace:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>You'll be redirected to Google's login page</li>
            <li>After login, you'll be asked to grant permission to this application</li>
            <li>Once authorized, you'll be redirected back to this application</li>
            <li>Your Google Workspace connection will be securely stored for future use</li>
          </ol>
        </div>
      </div>      
      
      <div className="mt-8">
        <p className="text-sm text-muted-foreground">
          Need help? Check our <CustomLink href="/policy">documentation</CustomLink> or contact support.
        </p>
      </div>
    </div>
  )
}
