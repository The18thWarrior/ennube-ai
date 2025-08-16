export const dynamic = "force-dynamic";
import { auth } from '@/auth'
import { Button } from '@/components/ui/button'
import CustomLink from '@/components/custom-link'
import { redirect } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getMicrosoftCredentialsById } from '@/lib/db/microsoft-storage'
import { createGraphClient } from '@/lib/microsoft'
import { Badge } from '@/components/ui/badge'
import MicrosoftSignOut from './MicrosoftSignOut'

export default async function MicrosoftDashboard() {
  const session = await auth();
  const micCreds = await getMicrosoftCredentialsById();
  if (!micCreds) {
    redirect('/integrations/microsoft/connect');
  }

  // Attempt to create a Graph client and fetch user profile
  let me = null;
  try {
    const client = createGraphClient({ accessToken: micCreds?.access_token || '' });
    me = await client.api('/me').get();
  } catch (e) {
    console.log('Failed to fetch Microsoft profile', e);
    // allow dashboard to render an error state
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <img src={'/microsoft-logo.png'} alt="Microsoft 365 Logo" className="h-10 w-10 object-contain" />
        Microsoft 365 Dashboard
      </h1>

      <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <p className="text-green-700 dark:text-green-400 font-medium">Connected to Microsoft 365</p>
        </div>
      </div>

      {me && (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={me.photo || ''} alt={me.displayName || ''} />
              <AvatarFallback>{me.displayName ? me.displayName.substring(0,2).toUpperCase() : 'MS'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-medium">{me.displayName}</p>
              <p className="text-gray-500">{me.mail || me.userPrincipalName}</p>
              <div className="flex mt-1 space-x-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200">
                  Microsoft 365
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Administration</h2>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-row space-x-4">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <CustomLink href="/integrations/microsoft/connect">Reconnect to Microsoft 365</CustomLink>
            </Button>
            <div className="w-full sm:w-auto">
              <MicrosoftSignOut />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
