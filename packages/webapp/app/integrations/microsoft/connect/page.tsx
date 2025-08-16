import CustomLink from '@/components/custom-link'
import { Button } from '@/components/ui/button'
import { auth } from '@/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getMicrosoftCredentialsById } from '@/lib/db/microsoft-storage'

export default async function MicrosoftConnect() {
  const session = await auth();
  const credential = await getMicrosoftCredentialsById();

  // If already connected, redirect to dashboard
  if (credential && credential.access_token) {
    redirect('/integrations/microsoft/dashboard')
  }

  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN || '';
  const authUrl = `/api/microsoft/oauth2/authorize?returnTo=/integrations/microsoft/dashboard`;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Connect to Microsoft 365</h1>

      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="mb-4">Connect your Microsoft account to access and manage your Outlook mail and Calendar directly from this application.</p>
        <div>
          <a href={authUrl} className="inline-block">
            <Button>Connect Microsoft 365</Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Benefits of connecting</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Access your Outlook mail without switching applications</li>
            <li>Manage your Microsoft Calendar events and meetings</li>
            <li>Automate workflows between Microsoft 365 and other services</li>
            <li>Send emails using your Microsoft account</li>
          </ul>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">How it works</h2>
          <p className="mb-4">When you connect to Microsoft 365:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>You'll be redirected to Microsoft's login page</li>
            <li>After login, you'll be asked to grant permission to this application</li>
            <li>Once authorized, you'll be redirected back to this application</li>
            <li>Your Microsoft connection will be securely stored for future use</li>
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
