import CustomLink from "@/components/custom-link"
import { Button } from "@/components/ui/button"
import { auth, signIn } from "@/auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import DirectLoginForm from "./DirectLoginForm"

export default async function HubspotConnect() {
  const session = await auth()
  
  // If user is already connected to Hubspot, redirect to the Hubspot dashboard
//   if (session?.user?.hubspot) {
//     redirect("/integrations/hubspot/dashboard")
//   }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Connect to HubSpot</h1>

      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="mb-4">Connect your HubSpot instance to access and manage your HubSpot data directly from this application.</p>
        <DirectLoginForm />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Benefits of connecting</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Access your HubSpot data without switching applications</li>
            <li>Manage contacts and companies directly from this interface</li>
            <li>Integrate HubSpot data with other systems</li>
            <li>Automate marketing and sales workflows</li>
          </ul>
        </div>
        
        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">How it works</h2>
          <p className="mb-4">When you connect to HubSpot:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>You'll be redirected to HubSpot's login page</li>
            <li>After login, you'll be asked to grant permission to this application</li>
            <li>Once authorized, you'll be redirected back to this application</li>
            <li>Your HubSpot connection will be securely stored for future use</li>
          </ol>
        </div>
      </div>      
      
      <div className="mt-8">
        <p className="text-sm text-gray-500">
          Need help? Check our <CustomLink href="/policy">documentation</CustomLink> or contact support.
        </p>
      </div>
    </div>
  )
}
