import { getAllActiveSettings, FrequencyType } from '@/lib/db/agent-settings-storage';
import { getUserUsageLogsBySub, UsageLogEntry } from '@/lib/db/usage-logs';
import { getCustomerSubscription } from '@/lib/stripe';
import { getSubscriptionLimit } from '@/lib/stripe-context';
import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  try {
    console.log('api/webhooks/agent/execute called')
    if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);    
    // Get the frequency parameter from the query
    const frequency = url.searchParams.get('frequency') as FrequencyType | null;
    
    // Validate frequency parameter
    const validFrequencies: FrequencyType[] = ['business_hours', 'daily', 'weekly', 'monthly'];
    
    if (!frequency) {
      return NextResponse.json({ 
        error: `Missing frequency parameter. Must be one of: ${validFrequencies.join(', ')}` 
      }, { status: 400 });
    }
    
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json({ 
        error: `Invalid frequency parameter: ${frequency}. Must be one of: ${validFrequencies.join(', ')}` 
      }, { status: 400 });
    }
    
    console.log(`Starting automated agent execution for frequency: ${frequency}`);
    
    // 1. Get all active settings
    const allActiveSettings = await getAllActiveSettings();
    
    // 2. Filter settings by the frequency parameter
    const filteredSettings = allActiveSettings.filter(setting => setting.frequency === frequency);
    
    if (filteredSettings.length === 0) {
      return NextResponse.json({ 
        message: `No active settings found with frequency: ${frequency}` 
      }, { status: 200 });
    }
    
    // Keep track of results
    const results = [];
    
    // Process each setting
    for (const setting of filteredSettings) {
      try {
        // 3. Get user's usage logs by user ID
        const userLogs = await getUserUsageLogsBySub(setting.userId);
        
        // 4. Get customer subscription and check limits
        const stripeSubscription = await getCustomerSubscription(setting.userId);
        
        // Convert Stripe Subscription to SubscriptionStatus format expected by getSubscriptionLimit
        const subscription = stripeSubscription ? {
          id: stripeSubscription.id,
          customer: typeof stripeSubscription.customer === 'string' ? 
            stripeSubscription.customer : 
            stripeSubscription.customer.id,
          status: stripeSubscription.status,
          items: stripeSubscription.items
        } : null;
        
        const { usageLimit, isSubscribed } = getSubscriptionLimit(subscription);
        
        // Calculate user's current usage from logs - only count from this month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const currentUsage = userLogs.reduce((total, log) => {
          // Only count usage from current month
          const logDate = new Date(log.timestamp);
          if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
            // Sum up all records updated, created, and meetings booked
            return total + (log.recordsUpdated || 0) + (log.recordsCreated || 0) + (log.meetingsBooked || 0);
          }
          return total;
        }, 0);
        
        // 5. If user hasn't hit limit, trigger the appropriate agent
        if (isSubscribed && currentUsage < usageLimit) {
          let agentResponse;
          const remainingUsage = usageLimit - currentUsage;
          
          // Calculate safe batch size - use smaller of setting batch size or remaining usage
          const safeBatchSize = Math.min(
            setting.batchSize || 10,
            remainingUsage
          );
          
          console.log(`User ${setting.userId} has used ${currentUsage}/${usageLimit} operations. Running with batch size ${safeBatchSize}`);
          
          // Define supported agent types
          const supportedAgents = ['data-steward', 'prospect-finder'];
          
          if (!supportedAgents.includes(setting.agent)) {
            console.warn(`Unsupported agent type: ${setting.agent} for user ${setting.userId}`);
            results.push({
              userId: setting.userId,
              agent: setting.agent,
              status: 'skipped',
              reason: 'Unsupported agent type'
            });
            continue;
          }
          
          // Call the appropriate agent API
          try {
            const response = await fetch(`${url.origin}/api/agents/${setting.agent}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: setting.userId,
                batchSize: safeBatchSize,
                automated: true,
                frequency: frequency
              })
            });
            
            if (!response.ok) {
              throw new Error(`Agent API returned ${response.status}: ${response.statusText}`);
            }
            
            agentResponse = await response.json();
          } catch (agentError: any) {
            console.log(`Error calling agent ${setting.agent} for user ${setting.userId}:`, agentError);
            results.push({
              userId: setting.userId,
              agent: setting.agent,
              status: 'error',
              error: agentError.message || 'Failed to call agent API'
            });
            continue;
          }
          
          results.push({
            userId: setting.userId,
            agent: setting.agent,
            status: 'triggered',
            response: agentResponse
          });
        } else {
          results.push({
            userId: setting.userId,
            agent: setting.agent,
            status: 'skipped',
            reason: isSubscribed ? 'Usage limit reached' : 'No active subscription'
          });
        }
      } catch (error: any) {
        console.log(`Error processing setting for user ${setting.userId}, agent ${setting.agent}:`, error);
        results.push({
          userId: setting.userId,
          agent: setting.agent,
          status: 'error',
          error: error.message || 'Unknown error'
        });
      }
    }
    
    // Calculate success metrics
    const successful = results.filter(r => r.status === 'triggered').length;
    const failed = results.filter(r => r.status === 'error').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    
    console.log(`Agent execution complete. Frequency: ${frequency}, Total: ${filteredSettings.length}, Success: ${successful}, Failed: ${failed}, Skipped: ${skipped}`);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      frequency,
      total: filteredSettings.length,
      metrics: {
        successful,
        failed,
        skipped
      },
      results
    });
  } catch (error: any) {
    console.log('Error executing agents:', error);
    return NextResponse.json({ 
      timestamp: new Date().toISOString(),
      error: error.message || 'An unexpected error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';