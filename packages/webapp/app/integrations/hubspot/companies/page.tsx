import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"
import { getHubSpotCredentialsById } from "@/lib/db/hubspot-storage"
import { HubSpotClient } from "@/lib/hubspot"

interface Company {
  id: string;
  properties: {
    name: string;
    domain: string;
    industry: string;
    phone: string;
    [key: string]: any;
  };
}

export default async function HubspotCompanies() {
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
  
  // Fetch companies from HubSpot
  let companies: Company[] = [];
  let error = null;
  
  try {
    const companiesResult = await hubspotClient.query<Company>('companies', {
      limit: 10,
      properties: ['name', 'domain', 'industry', 'phone'],
    });
    companies = companiesResult.records || [];
  } catch (e) {
    console.log("Failed to fetch HubSpot companies:", e);
    error = e instanceof Error ? e.message : "Unknown error";
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">HubSpot Companies</h1>
      
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
          {companies.length > 0 ? (
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                  {companies.map((company) => (
                    <tr key={company.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {company.properties.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {company.properties.domain}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {company.properties.industry}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {company.properties.phone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p>No companies found.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
