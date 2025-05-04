import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import CustomLink from "@/components/custom-link"
import { redirect } from "next/navigation"
import { getSalesforceClient } from "@/lib/salesforce"

export default async function SalesforceOpportunities() {
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
        <h1 className="text-3xl font-bold">Salesforce Opportunities</h1>
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
  
  // Fetch opportunities from Salesforce
  let opportunities: any[] = [];
  let error = null;
  
  try {
    const result = await salesforceClient.query(
      "SELECT Id, Name, StageName, Amount, CloseDate, AccountId, Account.Name FROM Opportunity LIMIT 10"
    );
    opportunities = result.records;
  } catch (e) {
    console.error("Failed to fetch Salesforce opportunities:", e);
    error = e instanceof Error ? e.message : "Unknown error";
  }
  
  // Format currency to show dollars
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Format date to show readable format
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Salesforce Opportunities</h1>
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
                      Opportunity Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Close Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                  {opportunities.length > 0 ? (
                    opportunities.map((opportunity) => (
                      <tr key={opportunity.Id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {opportunity.Name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {opportunity.Account?.Name || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${opportunity.StageName.includes('Closed Won') ? 'bg-green-100 text-green-800' : 
                              opportunity.StageName.includes('Closed Lost') ? 'bg-red-100 text-red-800' : 
                              'bg-blue-100 text-blue-800'}`}>
                            {opportunity.StageName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {opportunity.Amount ? formatCurrency(opportunity.Amount) : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(opportunity.CloseDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Button size="sm" variant="outline" asChild>
                            <CustomLink href={`/salesforce/opportunities/${opportunity.Id}`}>
                              View
                            </CustomLink>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No opportunities found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button disabled>
              Create New Opportunity
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
