import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { 
  AgentSetting, 
  FrequencyType,
  saveAgentSetting, 
  getAgentSetting,
  getUserAgentSettings,
  updateAgentSetting,
  toggleAgentActive,
  deleteAgentSetting
} from '@/lib/db/agent-settings-storage';

/**
 * Validates if the frequency value is a valid FrequencyType
 */
function isValidFrequency(frequency: string): frequency is FrequencyType {
  return ['business_hours', 'daily', 'weekly', 'monthly'].includes(frequency);
}

/**
 * GET /api/agents/settings
 * - Get all agent settings for the authenticated user
 * GET /api/agents/settings?agent=agentName
 * - Get a specific agent setting for the authenticated user
 */
export async function GET(
  request: NextRequest
) {
  try {
    // Verify the user is authenticated
    const session = await auth();
    
    if (!session?.user?.id || !session?.user?.auth0?.sub) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if an agent parameter was provided
    const { searchParams } = new URL(request.url);
    const agent = searchParams.get('agent');
    
    let result;
    if (agent) {
      // Get a specific agent setting
      result = await getAgentSetting(session.user.auth0.sub, agent);
      if (!result) {
        return NextResponse.json(
          { error: 'Agent setting not found' },
          { status: 404 }
        );
      }
    } else {
      // Get all agent settings for the user
      result = await getUserAgentSettings(session.user.auth0.sub);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error handling GET request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/settings
 * - Create a new agent setting for the authenticated user
 */
export async function POST(
  request: NextRequest
) {
  try {
    // Verify the user is authenticated
    const session = await auth();
    
    if (!session?.user?.id || !session?.user?.auth0?.sub) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.agent) {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      );
    }

    if (body.frequency === undefined) {
      return NextResponse.json(
        { error: 'Frequency is required' },
        { status: 400 }
      );
    }

    if (!isValidFrequency(body.frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency value. Must be one of: business_hours, daily, weekly, monthly' },
        { status: 400 }
      );
    }

    // Set the active flag to true by default if not provided
    const active = body.active !== undefined ? !!body.active : true;

    // Validate batchSize if provided
    let batchSize = 10; // Default value
    if (body.batchSize !== undefined) {
      const parsedBatchSize = parseInt(body.batchSize, 10);
      if (isNaN(parsedBatchSize) || parsedBatchSize <= 0) {
        return NextResponse.json(
          { error: 'Batch size must be a positive number' },
          { status: 400 }
        );
      }
      batchSize = parsedBatchSize;
    }

    // Save the agent setting
    const settingId = await saveAgentSetting({
      userId: session.user.auth0.sub,
      agent: body.agent,
      active,
      frequency: body.frequency,
      batchSize,
      provider: body.provider || 'sfdc' // Default to 'sfdc' if not provided
    });

    if (!settingId) {
      return NextResponse.json(
        { error: 'Failed to create agent setting' },
        { status: 500 }
      );
    }

    // Get the complete agent setting to return
    const setting = await getAgentSetting(session.user.auth0.sub, body.agent);
    
    return NextResponse.json(setting, { status: 201 });
  } catch (error) {
    console.error('Error handling POST request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/agents/settings/:id
 * - Update an existing agent setting
 */
export async function PUT(
  request: NextRequest
) {
  try {
    // Verify the user is authenticated
    const session = await auth();
    
    if (!session?.user?.id || !session?.user?.auth0?.sub) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    // Extract the setting ID from the URL
    const settingId = id || request.url.split('/').pop();
    
    if (!settingId) {
      return NextResponse.json(
        { error: 'Setting ID is required' },
        { status: 400 }
      );
    }

    // Build the updates object
    const updates: Partial<Pick<AgentSetting, 'active' | 'frequency' | 'batchSize'>> = {};
    
    if (body.active !== undefined) {
      updates.active = !!body.active;
    }
    
    if (body.frequency !== undefined) {
      if (!isValidFrequency(body.frequency)) {
        return NextResponse.json(
          { error: 'Invalid frequency value. Must be one of: business_hours, daily, weekly, monthly' },
          { status: 400 }
        );
      }
      updates.frequency = body.frequency;
    }
    
    if (body.batchSize !== undefined) {
      const parsedBatchSize = parseInt(body.batchSize, 10);
      if (isNaN(parsedBatchSize) || parsedBatchSize <= 0) {
        return NextResponse.json(
          { error: 'Batch size must be a positive number' },
          { status: 400 }
        );
      }
      updates.batchSize = parsedBatchSize;
    }

    // Update the agent setting
    const success = await updateAgentSetting(settingId, updates);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update agent setting or setting not found' },
        { status: 404 }
      );
    }

    // Use the URL parameters to extract the agent name (in case this API is extended in the future)
    const { searchParams } = new URL(request.url);
    const agent = searchParams.get('agent');
    
    // Return the updated setting if possible
    if (agent) {
      const updatedSetting = await getAgentSetting(session.user.auth0.sub, agent);
      return NextResponse.json(updatedSetting);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling PUT request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agents/settings/:id/toggle
 * - Toggle the active state of an agent setting
 */
export async function PATCH(
  request: NextRequest
) {
  try {
    // Verify the user is authenticated
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract the setting ID and action from the URL
    const url = new URL(request.url);

    const settingId = url.searchParams.get('id');
    const action = url.searchParams.get('action');
    
    if (!settingId || action !== 'toggle') {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Toggle the agent setting active state
    const success = await toggleAgentActive(settingId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to toggle agent setting or setting not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling PATCH request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents/settings/:id
 * - Delete an agent setting
 */
export async function DELETE(
  request: NextRequest
) {
  try {
    // Verify the user is authenticated
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract the setting ID from the URL
    const settingId = request.url.split('/').pop();
    
    if (!settingId) {
      return NextResponse.json(
        { error: 'Setting ID is required' },
        { status: 400 }
      );
    }

    // Delete the agent setting
    const success = await deleteAgentSetting(settingId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete agent setting or setting not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling DELETE request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
