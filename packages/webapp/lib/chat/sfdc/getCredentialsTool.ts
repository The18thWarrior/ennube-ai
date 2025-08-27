import { getSalesforceCredentialsBySub } from "@/lib/db/salesforce-storage";
import { Tool, tool } from "ai";
import { id } from "date-fns/locale";
import z from "zod";


// Tool: Get Credentials
export const getCredentialsTool = (subId: string) => {
    return tool({
        description: 'Retrieve Salesforce credentials for a user, should be used to retrieve the running user Id. Is necessary as for any queries relative to ownership.',
        execute: async ({}) => {
            if (!subId) throw new Error('subId is required');
            const credentials = await getSalesforceCredentialsBySub(subId);
                
            if (!credentials) {
                throw new Error('Failed to fetch credentials');
            }
            
            // Remove sensitive data before returning
            const sanitizedCredentials = {
                ...credentials,
                // Remove token-related sensitive data but keep metadata
                accessToken: undefined,
                refreshToken: undefined,
                // Keep basic user info and expiry information
                hasCredentials: true,
                instanceUrl: credentials.instanceUrl,
                userInfo: {
                    id: credentials.userInfo?.id || credentials.userInfo?.id,
                    display_name: credentials.userInfo?.display_name,
                    email: credentials.userInfo?.email,
                    organization_id: credentials.userInfo?.organization_id || credentials.userInfo?.organizationId
                },
                expiresAt: credentials.expiresAt
            };

            return sanitizedCredentials;
        },
        inputSchema: z.object({})
    });
}
