import { auth } from "@/auth";
import { tool } from "ai";
import { nanoid } from "nanoid";
import z from "zod";

/**
 * Tool: Call Workflow
 * Calls the appropriate agent webhook (data-steward or prospect-finder) with a generated usageId.
 * @param agent - The agent to execute on ('data-steward' or 'prospect-finder')
 * @param subId - The user subId to pass to the webhook
 * @param limit - Optional limit for records
 * @returns The webhook response
 */
export const callWorkflowToolDataSteward = tool({
	description: 'Call the execution workflow for the Data Steward agent. Data Steward is used to enrich Account and Contact data in Salesforce. ALWAYS ask the user for permission before calling this tool.',
	inputSchema: z.object({
		limit: z.string().optional(),
		accountIds: z.array(z.string()).optional().describe('The Salesforce Account IDs to enrich. If not provided, the tool will enrich all Accounts.'),
	}),
	execute: async ({ limit, accountIds }) => {
        const session = await auth();
        if (!session || !session.user || !session.user.auth0) throw new Error('You must be signed in to call a workflow');
        const subId = session.user.auth0.sub;
		if (!subId) throw new Error('subId is required');
		const usageId = nanoid();
		const webhookUrl = process.env.DATASTEWARD_WEBHOOK_URL;
		if (!webhookUrl) throw new Error('Webhook URL is not configured for this agent');

		const url = `${webhookUrl}?limit=${limit || '10'}&subId=${subId}&usageId=${usageId}${accountIds ? `&accountIds=${accountIds.join(',')}` : ''}`;
		const response = await fetch(url, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error from agent webhook: ${errorText}`);
		}
		const data = await response.json();
		return { ...data, usageId };
	},
});

export const callWorkflowToolProspectFinder = tool({
	description: 'Call the execution workflow for Prospect Finder. Prospect Finder is used to find new prospects. ALWAYS ask the user for permission before calling this tool.',
	parameters: z.object({
		limit: z.string().optional(),
	}),
	async execute({ limit }) {
        const session = await auth();
        if (!session || !session.user || !session.user.auth0) throw new Error('You must be signed in to call a workflow');
        const subId = session.user.auth0.sub;
		if (!subId) throw new Error('subId is required');
		const usageId = nanoid();
		const webhookUrl = process.env.PROSPECTFINDER_WEBHOOK_URL;
		if (!webhookUrl) throw new Error('Webhook URL is not configured for this agent');

		const url = `${webhookUrl}?limit=${limit || '10'}&subId=${subId}&usageId=${usageId}`;
		const response = await fetch(url, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error from agent webhook: ${errorText}`);
		}
		const data = await response.json();
		return { ...data, usageId };
	},
});

export const callWorkflowToolContractReader = tool({
	description: 'Call the execution workflow for Contract Reader. Contract Reader is used to read and analyze contracts. ALWAYS ask the user for permission before calling this tool.',
	parameters: z.object({
		limit: z.string().optional(),
	}),
	async execute({ limit }) {
        const session = await auth();
        if (!session || !session.user || !session.user.auth0) throw new Error('You must be signed in to call a workflow');
        const subId = session.user.auth0.sub;
		if (!subId) throw new Error('subId is required');
		const usageId = nanoid();
		const webhookUrl = process.env.CONTRACT_READER_WEBHOOK_URL;
		if (!webhookUrl) throw new Error('Webhook URL is not configured for this agent');

		const url = `${webhookUrl}?limit=${limit || '10'}&subId=${subId}&usageId=${usageId}`;
		const response = await fetch(url, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error from agent webhook: ${errorText}`);
		}
		const data = await response.json();
		return { ...data, usageId };
	},
});

export const getWorkflowTool = (agent: 'data-steward' | 'prospect-finder' | 'contract-reader') => {
    return agent === 'data-steward' ? callWorkflowToolDataSteward : agent === 'contract-reader' ? callWorkflowToolContractReader : callWorkflowToolProspectFinder;
}   