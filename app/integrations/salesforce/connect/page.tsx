import CustomLink from "@/components/custom-link"
import { Button } from "@/components/ui/button"
import { auth, signIn } from "@/auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import DirectLoginForm from "./DirectLoginForm"

export default async function SalesforceConnect() {
  const session = await auth()
  
  // If user is already connected to Salesforce, redirect to the Salesforce dashboard
  if (session?.user?.salesforce) {
    redirect("/integrations/salesforce/dashboard")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Connect to Salesforce</h1>

      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="mb-4">Connect your Salesforce instance to access and manage your Salesforce data directly from this application.</p>
        <DirectLoginForm />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Benefits of connecting</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Access your Salesforce data without switching applications</li>
            <li>Perform common operations directly from this interface</li>
            <li>Integrate Salesforce data with other systems</li>
            <li>Automate workflows between Salesforce and other services</li>
          </ul>
        </div>
        
        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">How it works</h2>
          <p className="mb-4">When you connect to Salesforce:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>You'll be redirected to Salesforce's login page</li>
            <li>After login, you'll be asked to grant permission to this application</li>
            <li>Once authorized, you'll be redirected back to this application</li>
            <li>Your Salesforce connection will be securely stored for future use</li>
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