import { NextRequest, NextResponse } from 'next/server';
import { put } from "@vercel/blob";
import { getSalesforceCredentialsBySub, updateDescribeEmbedUrlByUserAndType, updateSalesforceCredentials } from '@/lib/db/salesforce-storage';
import { createSalesforceClient } from '@/lib/salesforce';
import { SalesforceAuthResult } from '@/lib/types';
import { auth } from '@/auth';
import { createFieldText, createChildRelationshipText, embedManyTexts } from '@/lib/chat/sfdc/embeddings';
import { VectorStoreEntry, createSalesforceVectorStore } from '@/lib/chat/sfdc/vectorStore';
import { loadSchemaFromJSON } from '@/lib/graph';

const STANDARD_OBJECTS = ['Account', 'Contact', 'Lead', 'Opportunity', 'OpportunityLineItem', 'Product2', 'Case', 'User', 'Campaign', 'Task', 'Event', 'Contract', 'ContentVersion', 'Attachment', 'Note'];
export const maxDuration = 300;
/**
 * Placeholder GET handler for /api/salesforce/embed
 * Mirrors authentication and credential lookup used by `describe` route so
 * implementers have an example of session/sub resolution and client creation.
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const _sub = searchParams.get('sub');

		// Resolve session and user sub (supports providing sub via query for admin/debug)
		const session = await auth();
		const sub = _sub || session?.user.sub;
		if (!sub) {
			return NextResponse.json({ error: 'Missing required parameter: sub' }, { status: 400 });
		}

		// Fetch stored Salesforce credentials for the user
		const credentials = await getSalesforceCredentialsBySub(sub);
		if (!credentials) {
			return NextResponse.json({ error: 'No Salesforce credentials found for this user' }, { status: 404 });
		}
    if (!credentials.describeEmbedUrl) {
			return NextResponse.json({ error: 'No Salesforce embedding found for this user' }, { status: 404 });
		}

    // console.log('Memory Usage getting credentials:', process.memoryUsage());
    
    // const embedding_file = await fetch(credentials.describeEmbedUrl || '').then(res => res.ok ? res.text() : null).catch(() => null);
    // console.log('Memory Usage getting credentials:', process.memoryUsage());

    return NextResponse.json({url: credentials.describeEmbedUrl})
		// Placeholder response - replace with real embed logic
		return NextResponse.json({ message: 'Placeholder GET for salesforce/embed', sub, hasCredentials: !!credentials });
	} catch (error) {
		return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
	}
}

/**
 * Placeholder POST handler for /api/salesforce/embed
 * Accepts JSON body and demonstrates auth/credential resolution like the describe route.
 */
// export async function PUT(request: NextRequest) {
// 	try {
// 		const body = await request.json().catch(() => ({}));
// 		const _sub = body?.sub;

// 		const session = await auth();
// 		const sub = _sub || session?.user.sub;
// 		if (!sub) {
// 			return NextResponse.json({ error: 'Missing required parameter: sub' }, { status: 400 });
// 		}

// 		const credentials = await getSalesforceCredentialsBySub(sub);
// 		if (!credentials) {
// 			return NextResponse.json({ error: 'No Salesforce credentials found for this user' }, { status: 404 });
// 		}

// 		const authResult: SalesforceAuthResult = {
// 			success: true,
// 			userId: sub,
// 			accessToken: credentials.accessToken,
// 			instanceUrl: credentials.instanceUrl,
// 			refreshToken: credentials.refreshToken,
// 			userInfo: credentials.userInfo
// 		};
// 		const client = createSalesforceClient(authResult);

//     const globalDescribe = await client.describeGlobal();
//     const sobjects = globalDescribe.sobjects.filter(obj => obj.custom).map(obj => obj.name).concat(STANDARD_OBJECTS);
    


// 		// Echo received body as a placeholder - implement real embed creation here
// 		return NextResponse.json({ message: 'Placeholder POST for salesforce/embed', sub, bodyReceived: body });
// 	} catch (error) {
// 		return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
// 	}
// }

export async function POST(request: NextRequest) {
	try {
		const body = await request.json().catch(() => ({}));
		const _sub = body?.sub;

		const session = await auth();
		const sub = _sub || session?.user.sub;
		if (!sub) {
			return NextResponse.json({ error: 'Missing required parameter: sub' }, { status: 400 });
		}

		const credentials = await getSalesforceCredentialsBySub(sub);
		if (!credentials) {
			return NextResponse.json({ error: 'No Salesforce credentials found for this user' }, { status: 404 });
		}

		const authResult: SalesforceAuthResult = {
			success: true,
			userId: sub,
			accessToken: credentials.accessToken,
			instanceUrl: credentials.instanceUrl,
			refreshToken: credentials.refreshToken,
			userInfo: credentials.userInfo
		};
		const client = createSalesforceClient(authResult);

		// Get list of sObjects. If the caller provides a list (body.sobjects),
		// restrict the global describe to that list. Otherwise use STANDARD_OBJECTS.
		const globalDescribe = await client.describeGlobal();
		const availableNames: string[] = (globalDescribe.sobjects || []).map((obj: any) => obj.name);

		const providedSobjects = Array.isArray(body?.sobjects)
			? body.sobjects.filter((s: any) => typeof s === 'string')
			: null;

		let sobjects: string[];
		if (providedSobjects && providedSobjects.length > 0) {
			// Only include provided names that actually exist in the org's global describe
			sobjects = providedSobjects.filter((name: string) => availableNames.includes(name));
		} else {
			// Default to a curated list of standard objects
			sobjects = STANDARD_OBJECTS.slice();
		}
    console.log('Memory Usage after global describe:', process.memoryUsage());
		// Describe each sobject in parallel; tolerate per-sobject failures
		const describePromises = sobjects.map(async (sobject: string) => {
			try {
				const describe = await client.describe(sobject);
				return { sobject, describe };
			} catch (err) {
				console.log(`Failed to describe ${sobject}:`);
				return { sobject, error: err };
			}
		});

		const describeResults = await Promise.all(describePromises);

    console.log('Memory Usage after describe results:', process.memoryUsage());
		// Build VectorStoreEntry records using the same pattern as generateQueryTool
		
		// Instead of storing vectors, build a schema object and create a graph
		const tables: any[] = [];
		for (const res of describeResults) {
			if (res.error || !res.describe) continue;
			const desc = res.describe;
			const tableSchema: any = {
				name: desc.name,
				schema: 'public',
				columns: (desc.fields || []).map((f) => ({
					name: f.name,
					dataType: f.type || 'unknown',
					isNullable: f.nillable ?? true,
					isPrimaryKey:f.name.toLowerCase() === 'id',
					defaultValue: undefined,
					maxLength: f.length,
				})),
				foreignKeys: (desc.fields || []).flatMap((f) => {
					// Detect lookup/foreign key fields by presence of referenceTo
					if (Array.isArray(f.referenceTo) && f.referenceTo.length > 0) {
						// Create a FK entry for each referenced table
						return f.referenceTo.map((ref: string) => ({
							columnName: f.name,
							referencedTable: ref,
							referencedColumn: 'id',
						}));
					}
					return [];
				}),
			};
			tables.push(tableSchema);
		}

		// Use the graph library to build a graph from the schema
		
		const graph = loadSchemaFromJSON({ tables });
		const jsonData = graph.toJSON();

		// Write graph JSON to Vercel Blob
		const fileName = `sfdc:${sub}:embed.json`;
		const { url } = await put(fileName, JSON.stringify(jsonData), { access: 'public', allowOverwrite: true });

		// Update stored credentials with describe embed URL
		const credentials2 = await getSalesforceCredentialsBySub(sub);
		if (!credentials2) {
			return NextResponse.json({ error: 'No Salesforce credentials found for this user' }, { status: 404 });
		}
		const authResult2: SalesforceAuthResult = {
			success: true,
			userId: sub,
			accessToken: credentials2.accessToken,
			instanceUrl: credentials2.instanceUrl,
			refreshToken: credentials2.refreshToken,
			userInfo: credentials2.userInfo,
			describeEmbedUrl: url
		};
		await updateDescribeEmbedUrlByUserAndType(authResult2.userId, authResult2.describeEmbedUrl || null);
		console.log('successfully embedded graph json', url);

		return NextResponse.json({ message: 'Embedded sobject graph', sub, sobjectsProcessed: describeResults.length, file: url });
	} catch (error) {
		return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
	}
}