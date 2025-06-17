import IntegrationCard from "@/components/integration-card"
import { getGSuiteCredentialsById } from "@/lib/db/gsuite-storage";
import { getSalesforceCredentialsById } from "@/lib/db/salesforce-storage"
import { getHubSpotCredentialsById } from "@/lib/db/hubspot-storage"

export default async function IntegrationsPage() {
    const sf_credential = await getSalesforceCredentialsById()
    const hasSalesforce = Boolean(sf_credential && sf_credential.accessToken);
    const gs_credential = await getGSuiteCredentialsById();
    const hasGSuite = Boolean(gs_credential && gs_credential.accessToken);
    const hs_credential = await getHubSpotCredentialsById();
    const hasHubSpot = Boolean(hs_credential && hs_credential.accessToken);
      
    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-6">Integrations</h1>
            <p className="text-gray-600 mb-8">Connect your favorite tools and services to enhance your agent capabilities.</p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <IntegrationCard
                    title="Salesforce"
                    description="Connect your Salesforce account to sync contacts and opportunities."
                    icon="/salesforce-logo.png"
                    url={"/integrations/salesforce"}
                    connected={hasSalesforce} isAddCard={false}        
                />

                { <IntegrationCard
                    title="GSuite"
                    description="Connect your GSuite account to sync emails and calendars."
                    icon="/gmail-logo.webp"
                    url={"/integrations/gsuite"}
                    connected={hasGSuite} isAddCard={false}        
                /> }
                
                <IntegrationCard
                    title="HubSpot"
                    description="Connect your HubSpot account to sync contacts and companies."
                    icon="/hubspot.webp"
                    url={"/integrations/hubspot"}
                    connected={hasHubSpot} isAddCard={false}        
                />

                <IntegrationCard
                    title="Add New Integration"
                    description="Browse our marketplace to find more integrations."
                    isAddCard={true} 
                    connected={false}
                    url={""}        
                />
            </div>
        </div>
    )
}
