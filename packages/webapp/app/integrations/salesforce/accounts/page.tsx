import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import CustomLink from "@/components/custom-link"
import { redirect } from "next/navigation"
import { SalesforceClient } from "@/lib/salesforce"
import { getSalesforceCredentialsById } from "@/lib/db/salesforce-storage"

export default async function SalesforceAccounts() {
  const session = await auth()
  console.log('Session:', session?.user?.auth0)
  // Check if we have a Salesforce client from either OAuth or direct authentication
  const salesforceCredentials = await getSalesforceCredentialsById()
  if (!salesforceCredentials) {
    console.log('No Salesforce credentials found, redirecting to connect page')
    redirect("/integrations/salesforce/connect");
  }
  const salesforceClient = new SalesforceClient(salesforceCredentials.accessToken, salesforceCredentials.instanceUrl, salesforceCredentials.refreshToken);
  // If no Salesforce client available and no OAuth session, redirect to connect page
  if (!salesforceClient) {
    console.log('No Salesforce client found, redirecting to connect page')
    redirect("/integrations/salesforce/connect");
  }


  if (!salesforceClient) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Salesforce Accounts</h1>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <p className="text-yellow-700">
              There was an issue with your Salesforce connection. Please try reconnecting.
            </p>
          </div>
        </div>
        <Button asChild>
          <CustomLink href="/integrations/salesforce/connect">Reconnect to Salesforce</CustomLink>
        </Button>
      </div>
    )
  }
  
  // Fetch accounts from Salesforce
  let accounts: any[] = [];
  let error = null;
  
  try {
    const result = await salesforceClient.query(
      "SELECT Id, Name, Type, Industry, Phone, Website FROM Account LIMIT 10"
    );
    accounts = result.records;
  } catch (e) {
    console.log("Failed to fetch Salesforce accounts:", e);
    error = e instanceof Error ? e.message : "Unknown error";
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Salesforce Accounts</h1>
        <Button asChild>
          <CustomLink href="/integrations/salesforce/dashboard">Back to Dashboard</CustomLink>
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
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Website
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                  {accounts.length > 0 ? (
                    accounts.map((account) => (
                      <tr key={account.Id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {account.Name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.Type || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.Industry || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.Phone || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.Website ? (
                            <a href={account.Website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                              {account.Website}
                            </a>
                          ) : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Button size="sm" variant="outline" asChild>
                            <CustomLink href={`/integrations/salesforce/accounts/${account.Id}`}>
                              View
                            </CustomLink>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No accounts found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          
        </>
      )}
    </div>
  )
}
