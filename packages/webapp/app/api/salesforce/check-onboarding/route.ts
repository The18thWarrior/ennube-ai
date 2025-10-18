import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSalesforceCredentialsById } from '@/lib/db/salesforce-storage';
import { getUserAgentSettings } from '@/lib/db/agent-settings-storage';
import { getUserUsageLogs } from '@/lib/db/usage-logs';

/**
 * GET /api/salesforce/check-onboarding
 * Returns a summary of onboarding checks for the authenticated user:
 * - hasCredentials: whether Salesforce credentials exist
 * - hasAgentSettings: whether any active agent settings exist
 * - hasSuccessfulExecution: whether any usage logs show successful executions creating/updating records or booking meetings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user.sub) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check credentials
    const credentials = await getSalesforceCredentialsById();
    const hasCredentials = Boolean(credentials);

    // Check agent settings
    const agentSettings = await getUserAgentSettings(session.user.sub);
    const hasAgentSettings = Array.isArray(agentSettings) && agentSettings.length > 0 && agentSettings.some(s => s.active === true);

    // Check recent usage logs (limit 10, same behavior as the hook)
    const usageLogs = await getUserUsageLogs(10, 0);
    const hasSuccessfulExecution = Array.isArray(usageLogs) && usageLogs.some(log =>
      (log.status === 'success' || log.status === 'Success') &&
      (Number(log.recordsCreated || 0) > 0 || Number(log.recordsUpdated || 0) > 0 || Number(log.meetingsBooked || 0) > 0)
    );

    return NextResponse.json({ hasCredentials, hasAgentSettings, hasSuccessfulExecution });
  } catch (error) {
    console.log('Error checking onboarding status (route):', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
