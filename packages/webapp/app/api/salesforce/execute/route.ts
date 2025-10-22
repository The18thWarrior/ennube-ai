import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createSalesforceClient } from '@/lib/salesforce';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user.sub) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const proposal = body?.proposal;
    if (!proposal || !Array.isArray(proposal.changes)) {
      return NextResponse.json({ error: 'Invalid proposal' }, { status: 400 });
    }

    const creds = await (await import('@/lib/db/salesforce-storage')).getSalesforceCredentialsById();
    if (!creds) return NextResponse.json({ error: 'No Salesforce credentials' }, { status: 400 });

    const client = createSalesforceClient({ success: true, userId: session.user.id, accessToken: creds.accessToken, instanceUrl: creds.instanceUrl, refreshToken: creds.refreshToken });

    const perRecord: Array<any> = [];

    for (const change of proposal.changes) {
      try {
        if (change.operation === 'update') {
          const payload: any = { Id: change.recordId };
          for (const f of change.fields || []) payload[f.fieldName] = f.after;
          const ok = await client.update(change.sobject, payload as any);
          perRecord.push({ id: change.recordId, success: ok, message: ok ? 'updated' : 'failed' });
        } else if (change.operation === 'delete') {
          const ok = await client.delete(change.sobject, change.recordId as string);
          perRecord.push({ id: change.recordId, success: ok, message: ok ? 'deleted' : 'failed' });
        } else if (change.operation === 'create') {
          const payload: any = {};
          for (const f of change.fields || []) payload[f.fieldName] = f.after;
          const newId = await client.create(change.sobject, payload);
          perRecord.push({ id: newId, success: true, message: 'created' });
        } else {
          perRecord.push({ id: change.recordId, success: false, message: 'unsupported operation' });
        }
      } catch (err) {
        perRecord.push({ id: change.recordId, success: false, message: err instanceof Error ? err.message : String(err) });
      }
    }

    const overall = perRecord.every(r => r.success) ? 'success' : (perRecord.some(r => r.success) ? 'partial' : 'failed');

    const result = {
      proposalId: proposal.proposalId,
      executedBy: session.user.sub,
      timestamp: new Date().toISOString(),
      perRecord,
      overallStatus: overall
    };

    return NextResponse.json(result);
  } catch (error) {
    console.log('Error executing proposal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
