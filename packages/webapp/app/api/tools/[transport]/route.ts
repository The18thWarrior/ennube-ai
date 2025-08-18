
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { isValid, z } from "zod";

import { callWorkflowToolDataSteward, callWorkflowToolProspectFinder } from '@/lib/chat/callWorkflowTool';
import { getCountTool } from '@/lib/chat/getCountTool';
import { getSFDCDataTool } from '@/lib/chat/sfdc/getDataTool';
import { getFieldsTool } from '@/lib/chat/sfdc/getFieldsTool';
import { getCredentialsTool } from '@/lib/chat/sfdc/getCredentialsTool';
import { openai } from '@ai-sdk/openai';
import { getDataVisualizerTool } from '@/lib/chat/getDataVisualizerTool';
import { validateApiKey } from "@/lib/db/api-keys-storage";

// Helper: resolve sub from bearer token (placeholder)
// TODO: implement real token verification and sub extraction using your auth system
async function resolveSubFromBearerToken(token: string | null | undefined): Promise<string | null> {
  if (!token) return null;
  // Placeholder: in future replace this with verification (JWT verification / introspection)
  // and lookup to map API keys / tokens -> subject (sub) from your auth DB.
  // For now, return a dummy or null to indicate unresolved.
  const sub = validateApiKey(token)
  if (sub) return sub;
  return null;
}

const handler = createMcpHandler(
  async (server) => {
    // call_workflow_data_steward
    server.tool(
      'call_workflow_data_steward',
      { limit: z.string().optional() },
      { description: 'Call the execution workflow for the Data Steward agent. Data Steward is used to enrich Account and Contact data in Salesforce. ALWAYS ask the user for permission before calling this tool.' },
      async (args: any, extra: any) => {
        // attach subId from request query if present
        const params = args || {};
        
        let subId = extra.authInfo?.clientId;
        const result = await callWorkflowToolDataSteward.execute({ ...params, subId } as any, extra);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    );

    // call_workflow_prospect_finder
    server.tool(
      'call_workflow_prospect_finder',
      { limit: z.string().optional() },
      { description: 'Call the execution workflow for Prospect Finder. Prospect Finder is used to find new prospects. ALWAYS ask the user for permission before calling this tool.' },
      async (args: any, extra: any) => {
        const params = args || {};
        
        let subId = extra.authInfo?.clientId;
        const result = await callWorkflowToolProspectFinder.execute({ ...params, subId } as any, extra);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    );

    // get_count
    // server.tool(
    //   'get_count',
    //   { sobject: z.string(), filter: z.string() },
    //   { description: 'Query for count of records in Salesforce for CRM data.' },
    //   async (args: any, extra: any) => {
    //     const params = args || {};
    //     const url = extra?.request?.url;
    //     let subId = 'default-sub-id';
    //     const authHeader = extra?.request?.headers?.get?.('authorization') || extra?.request?.headers?.authorization;
    //     const bearer = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '') : null;
    //     const tokenSub = await resolveSubFromBearerToken(bearer);
    //     if (tokenSub) {
    //       subId = tokenSub;
    //     } else if (url) {
    //       try {
    //         const u = new URL(url);
    //         subId = u.searchParams.get('sub') || subId;
    //       } catch (_) {}
    //     }
    //     const countTool = getCountTool(subId);
    //     const result = await countTool.execute(params, extra);
    //     return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    //   }
    // );

    // get_data
    server.tool(
      'get_data',
      { limit: z.number().optional(), sobject: z.string(), filter: z.string().optional() },
      { description: 'Query Salesforce for CRM data.' },
      async (args: any, extra: any) => {
        const params = args || {};
        let subId = extra.authInfo?.clientId;
        
        const dataTool = getSFDCDataTool(subId);
        const execParams = { ...params, limit: params.limit ?? 100, filter: params.filter ?? "" } as any;
        const result = await dataTool.execute(execParams, extra);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    );

    // get_fields
    server.tool(
      'get_fields',
      { sobjectType: z.string(), limit: z.number().optional() },
      { description: 'Introspect a Salesforce sObject and return a JSON payload listing every valid field available for use.' },
      async (args: any, extra: any) => {
        const params = args || {};
        
        let subId = extra.authInfo?.clientId;
        const fieldsTool = getFieldsTool(subId);
        const execParams = { ...params, limit: params.limit ?? 200 } as any;
        const result = await fieldsTool.execute(execParams, extra);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    );

    // get_credentials
    server.tool(
      'get_credentials',
      {},
      { description: 'Retrieve Salesforce credentials for a user, should be used to retrieve the running user Id. Is necessary as for any queries relative to ownership.' },
      async (_args: any, extra: any) => {
        
        let subId = extra.authInfo?.clientId;
        const credentialsTool = getCredentialsTool(subId);
        const result = await credentialsTool.execute({}, extra);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    );

    // visualize_data
    // server.tool(
    //   'visualize_data',
    //   { data: z.any() },
    //   { description: 'Call this tool when you have a database result that you want to generate a rendered output for the user.' },
    //   async (args: any, extra: any) => {
    //     const params = args || {};
    //     const model = openai('gpt-4o');
    //     const visualizerTool = getDataVisualizerTool(model);
    //     const result = await visualizerTool.execute(params || {}, extra);
    //     return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    //   }
    // );
  },
  {
    capabilities: {
      tools: {
        call_workflow_data_steward: { description: 'Call the execution workflow for the Data Steward agent.' },
        call_workflow_prospect_finder: { description: 'Call the execution workflow for Prospect Finder.' },
        // get_count: { description: 'Query for count of records in Salesforce.' },
        get_data: { description: 'Query Salesforce for CRM data.' },
        get_fields: { description: 'Introspect a Salesforce sObject.' },
        get_credentials: { description: 'Retrieve Salesforce credentials for a user.' },
        // visualize_data: { description: 'Render a visualization for provided data.' },
      },
    },
  },
  {
    basePath: '/api/tools',
    verboseLogs: true,
    maxDuration: 60,
  }
);

// Wrap your handler with authorization
const verifyToken = async (
  req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined;

  // Replace this example with actual token verification logic
  // Return an AuthInfo object if verification succeeds
  // Otherwise, return undefined
  const sub = await resolveSubFromBearerToken(bearerToken);

  if (!sub) return undefined;

  return {
    token: bearerToken,
    scopes: ["mcp:tools"], // Add relevant scopes
    clientId: sub, // Add user/client identifier
    extra: {
      // Optional extra information
      userId: sub,
    },
  };
};
// export { handler as GET, handler as POST, handler as DELETE };
// Make authorization required
const authHandler = withMcpAuth(handler, verifyToken, {
  required: true, // Make auth required for all requests
});

export { authHandler as GET, authHandler as POST };