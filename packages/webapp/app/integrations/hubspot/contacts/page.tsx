export const dynamic = "force-dynamic";
import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"
import { getHubSpotCredentialsById } from "@/lib/db/hubspot-storage"
import { HubSpotClient } from "@/lib/hubspot"

interface Contact {
  id: string;
  properties: {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    [key: string]: any;
  };
}

export default async function HubspotContacts() {
  // Get HubSpot credentials
  const hubspotCredentials = await getHubSpotCredentialsById()
  if (!hubspotCredentials) {
    redirect("/integrations/hubspot/connect");
  }

  const hubspotClient = new HubSpotClient(
    hubspotCredentials.accessToken, 
    hubspotCredentials.refreshToken,
    process.env.HUBSPOT_CLIENT_ID,
    process.env.HUBSPOT_CLIENT_SECRET,
    hubspotCredentials.expiresAt,
    hubspotCredentials
  );
  
  // Fetch contacts from HubSpot
  let contacts: Contact[] = [];
  let error = null;
  
  try {
    const contactsResult = await hubspotClient.query<Contact>('contacts', {
      limit: 10,
      properties: ['firstname', 'lastname', 'email', 'phone'],
    });
    contacts = contactsResult.records || [];
  } catch (e) {
    console.log("Failed to fetch HubSpot contacts:", e);
    error = e instanceof Error ? e.message : "Unknown error";
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">HubSpot Contacts</h1>
      
      <Button asChild variant="outline" className="mb-4">
        <a href="/integrations/hubspot/dashboard">Back to Dashboard</a>
      </Button>

      {error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <p className="text-red-700">
              {error}. Please try reconnecting to HubSpot.
            </p>
          </div>
        </div>
      ) : (
        <>
          {contacts.length > 0 ? (
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contact.properties.firstname} {contact.properties.lastname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contact.properties.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contact.properties.phone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p>No contacts found.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
