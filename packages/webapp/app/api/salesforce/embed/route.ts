import { NextRequest, NextResponse } from 'next/server';
import { put } from "@vercel/blob";
import { getSalesforceCredentialsBySub, updateDescribeEmbedUrlByUserAndType, updateSalesforceCredentials } from '@/lib/db/salesforce-storage';
import { createSalesforceClient } from '@/lib/salesforce';
import { SalesforceAuthResult } from '@/lib/types';
import { auth } from '@/auth';
import { createFieldText, createChildRelationshipText, embedManyTexts } from '@/lib/chat/sfdc/embeddings';
import { VectorStoreEntry, createSalesforceVectorStore } from '@/lib/chat/sfdc/vectorStore';

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
		const sub = _sub || session?.user?.auth0?.sub;
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
// 		const sub = _sub || session?.user?.auth0?.sub;
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
		const sub = _sub || session?.user?.auth0?.sub;
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

		// Get list of sObjects: include custom + a set of standard objects
		const globalDescribe = await client.describeGlobal();
		const sobjects = (globalDescribe.sobjects || [])
			.filter((obj: any) => obj.custom)
			.map((obj: any) => obj.name)
			.concat(STANDARD_OBJECTS);
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
		const entries: VectorStoreEntry[] = [];
		for (const res of describeResults) {
			if ((res as any).error || !(res as any).describe) continue;
			const desc = (res as any).describe;
			const sobjectType = desc.name;

			const fieldTexts: string[] = (desc.fields || []).map((field: any) =>
				createFieldText({
					sobjectType,
					fieldName: field.name,
					label: field.label,
					type: field.type,
					helpText: field.inlineHelpText,
					relationshipName: field.relationshipName,
					picklistValues: field.picklistValues?.map((pv: any) => pv.value)
				})
			);

			const childTexts: string[] = (desc.childRelationships || []).map((child: any) =>
				createChildRelationshipText({
					childSObject: child.childSObject,
					field: child.field,
					relationshipName: child.relationshipName
				})
			);

			const allTexts = fieldTexts.concat(childTexts);
			if (allTexts.length === 0) continue;

			// Batch embed texts for this sobject
			let vectors: number[][] = [];
			try {
				vectors = await embedManyTexts(allTexts);
			} catch (err) {
				console.warn(`Embedding failed for ${sobjectType}:`, err);
				continue;
			}
      //console.log(`vector length`, vectors.at(0)?.length);

			// Fields
			for (let i = 0; i < fieldTexts.length; i++) {
				const field = desc.fields[i];
				const vec = vectors[i];
				if (!vec || !Array.isArray(vec) || vec.length === 0) continue;
				entries.push({
					id: `${sobjectType}:${field.name}`,
					vector: vec,
					payload: {
						sobjectType,
						fieldName: field.name,
						label: field.label,
						type: field.type,
						helpText: field.inlineHelpText,
						picklistValues: field.picklistValues?.map((pv: any) => pv.value)
					}
				});
			}

			// Child relationships
			for (let j = 0; j < childTexts.length; j++) {
				const child = desc.childRelationships[j];
				const vec = vectors[fieldTexts.length + j];
				if (!vec || !Array.isArray(vec) || vec.length === 0) continue;
				entries.push({
					id: `${sobjectType}:child:${child.relationshipName}`,
					vector: vec,
					payload: {
						sobjectType: child.childSObject,
						fieldName: child.field,
						parentSobjectType: sobjectType,
						relationshipName: child.relationshipName
					}
				});
			}
		}

    console.log('Memory Usage after embedding:', process.memoryUsage());
    const prunedEntries = entries.reduce((acc, entry) => {
      if (entry.id && !acc.some(e => e.id === entry.id)) {
        acc.push(entry);
      }
      return acc;
    }, [] as VectorStoreEntry[]);
    const { url } = await put(`sfdc:${sub}:embed.txt`, JSON.stringify(prunedEntries), { access: 'public', allowOverwrite: true });
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
    console.log('successfully embedded', url)
		// Upsert entries into the in-memory vector store
		// const store = createSalesforceVectorStore();
		// await store.upsert(entries);

		return NextResponse.json({ message: 'Embedded sobject metadata', sub, sobjectsProcessed: describeResults.length, entriesCreated: entries.length });
	} catch (error) {
		return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
	}
}