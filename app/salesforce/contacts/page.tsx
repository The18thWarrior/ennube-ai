import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import CustomLink from "@/components/custom-link"
import { redirect } from "next/navigation"
import { getSalesforceClient } from "@/lib/salesforce"

export default async function SalesforceContacts() {
  const session = await auth()
  
  // If user is not connected to Salesforce, redirect to connect page
  if (!session?.user?.salesforce) {
    redirect("/salesforce/connect")
  }
  
  // Get Salesforce client
  const salesforceClient = await getSalesforceClient()
  
  if (!salesforceClient) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Salesforce Contacts</h1>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <p className="text-yellow-700">
              There was an issue with your Salesforce connection. Please try reconnecting.
            </p>
          </div>
        </div>
        <Button asChild>
          <CustomLink href="/salesforce/connect">Reconnect to Salesforce</CustomLink>
        </Button>
      </div>
    )
  }
  
  // Fetch contacts from Salesforce
  let contacts = [];
  let error = null;
  
  try {
    const result = await salesforceClient.query(
      "SELECT Id, Name, Email, Phone, Title, AccountId FROM Contact LIMIT 10"
    );
    contacts = result.records;
  } catch (e) {
    console.error("Failed to fetch Salesforce contacts:", e);
    error = e instanceof Error ? e.message : "Unknown error";
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Salesforce Contacts</h1>
        <Button asChild>
          <CustomLink href="/salesforce/dashboard">Back to Dashboard</CustomLink>
        </Button>
      </div>
      
      {error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <p className="text-red-700">
              {error}. Please try reconnecting to Salesforce.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                  {contacts.length > 0 ? (
                    contacts.map((contact) => (
                      <tr key={contact.Id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {contact.Name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {contact.Title || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {contact.Email || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {contact.Phone || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Button size="sm" variant="outline" asChild>
                            <CustomLink href={`/salesforce/contacts/${contact.Id}`}>
                              View
                            </CustomLink>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No contacts found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button disabled>
              Create New Contact
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
