import { NextRequest, NextResponse } from 'next/server';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  InitializeRequestSchema,
  Tool,
  TextContent,
  CallToolResult,
  ListToolsResult,
  InitializeResult
} from '@modelcontextprotocol/sdk/types.js';
import { auth } from '@/auth';
import { callWorkflowToolDataSteward, callWorkflowToolProspectFinder } from '@/lib/chat/callWorkflowTool';
import { getCountTool } from '@/lib/chat/getCountTool';
import { getSFDCDataTool } from '@/lib/chat/sfdc/getDataTool';
import { getFieldsTool } from '@/lib/chat/sfdc/getFieldsTool';
import { getCredentialsTool } from '@/lib/chat/sfdc/getCredentialsTool';
import { openai } from '@ai-sdk/openai';
import { getDataVisualizerTool } from '@/lib/chat/getDataVisualizerTool';

// Define the available tools
const TOOL_DEFINITIONS: Tool[] = [
  {
    name: 'call_workflow_data_steward',
    description: 'Call the execution workflow for the Data Steward agent. Data Steward is used to enrich Account and Contact data in Salesforce. ALWAYS ask the user for permission before calling this tool.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'string',
          description: 'Optional limit for records',
        },
      },
    },
  },
  {
    name: 'call_workflow_prospect_finder',
    description: 'Call the execution workflow for Prospect Finder. Prospect Finder is used to find new prospects. ALWAYS ask the user for permission before calling this tool.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'string',
          description: 'Optional limit for records',
        },
      },
    },
  },
  {
    name: 'get_count',
    description: 'Query for count of records in Salesforce for CRM data.',
    inputSchema: {
      type: 'object',
      properties: {
        sobject: {
          type: 'string',
          description: 'The Salesforce object to query',
        },
        filter: {
          type: 'string',
          description: 'SOQL WHERE clause filter to apply, this value cannot be empty. Always use single quotes for string values.',
        },
      },
      required: ['sobject', 'filter'],
    },
  },
  {
    name: 'get_data',
    description: 'Query Salesforce for CRM data.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'The maximum number of records to return. Defaults to 100. Maximum is 200.',
          default: 100,
        },
        sobject: {
          type: 'string',
          description: 'The Salesforce object to query',
        },
        filter: {
          type: 'string',
          description: 'SOQL WHERE clause filter to apply, this value cannot be empty. Always use single quotes for string values.',
        },
      },
      required: ['sobject', 'filter'],
    },
  },
  {
    name: 'get_fields',
    description: 'Introspect a Salesforce sObject and return a JSON payload listing every valid field available for use.',
    inputSchema: {
      type: 'object',
      properties: {
        sobjectType: {
          type: 'string',
          description: 'The Salesforce sObject type to introspect',
        },
        limit: {
          type: 'number',
          description: 'Optional limit on the number of fields to return',
          default: 1,
        },
      },
      required: ['sobjectType'],
    },
  },
  {
    name: 'get_credentials',
    description: 'Retrieve Salesforce credentials for a user, should be used to retrieve the running user Id. Is necessary as for any queries relative to ownership.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'visualize_data',
    description: 'Call this tool when you have a database result that you want to generate a rendered output for the user.',
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          description: 'The data to visualize or render for the user',
        },
      },
      required: ['data'],
    },
  },
];

// Initialize the MCP server
const server = new Server(
  {
    name: 'ennube-ai-tools',
    version: '1.0.0',
    description: 'MCP server exposing Ennube AI tools for CRM data management and workflow automation',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to execute tools
async function executeTool(name: string, args: any, subId: string) {
  const model = openai('gpt-4o');
  
  switch (name) {
    case 'call_workflow_data_steward':
      return await callWorkflowToolDataSteward.execute(args || {}, {} as any);
      
    case 'call_workflow_prospect_finder':
      return await callWorkflowToolProspectFinder.execute(args || {}, {} as any);
      
    case 'get_count':
      const countTool = getCountTool(subId);
      return await countTool.execute(args, {} as any);
      
    case 'get_data':
      const dataTool = getSFDCDataTool(subId);
      return await dataTool.execute(args, {} as any);
      
    case 'get_fields':
      const fieldsTool = getFieldsTool(subId);
      return await fieldsTool.execute(args, {} as any);
      
    case 'get_credentials':
      const credentialsTool = getCredentialsTool(subId);
      return await credentialsTool.execute(args || {}, {} as any);
      
    case 'visualize_data':
      const visualizerTool = getDataVisualizerTool(model);
      return await visualizerTool.execute(args || {}, {} as any);
      
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Set up MCP server handlers
server.setRequestHandler(InitializeRequestSchema, async (request): Promise<InitializeResult> => {
  return {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: 'ennube-ai-tools',
      version: '1.0.0',
      description: 'MCP server exposing Ennube AI tools for CRM data management and workflow automation',
    },
  };
});

server.setRequestHandler(ListToolsRequestSchema, async (request): Promise<ListToolsResult> => {
  return {
    tools: TOOL_DEFINITIONS,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name, arguments: args } = request.params;
  
  // Extract subId from the request context or use a default
  // In a real implementation, you'd want to get this from authentication
  const subId = (request as any).subId || 'default-sub-id';
  
  try {
    const result = await executeTool(name, args, subId);
    
    const content: TextContent = {
      type: 'text',
      text: JSON.stringify(result, null, 2),
    };
    
    return {
      content: [content],
    };
  } catch (error) {
    const errorContent: TextContent = {
      type: 'text',
      text: `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`,
    };
    
    return {
      content: [errorContent],
      isError: true,
    };
  }
});

// Handle MCP protocol requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const searchParams = request.nextUrl.searchParams;
    const subId = searchParams.get('sub');
    
    // Validate required parameters
    if (!subId) {
      console.error('Missing required parameter: sub');
      return NextResponse.json(
        { 
          jsonrpc: '2.0',
          id: body.id,
          error: { code: -32602, message: 'Missing required parameter: sub' }
        },
        { status: 400 }
      );
    }

    // Add subId to the request context for the handlers
    (body as any).subId = subId;

    // Create a custom transport for handling HTTP requests
    const transport = {
      async send(message: any) {
        return message;
      },
      async close() {
        // Cleanup if needed
      },
    };

    // Process the MCP request using the SDK
    try {
      const response = await (server as any).handleRequest(body);
      return NextResponse.json(response);
    } catch (error) {
      console.error('MCP Server Error:', error);
      return NextResponse.json(
        { 
          jsonrpc: '2.0',
          id: body.id,
          error: {
            code: -32603,
            message: 'Internal server error',
            data: error instanceof Error ? error.message : String(error)
          }
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('MCP Server Error:', error);
    return NextResponse.json(
      { 
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal server error',
          data: error instanceof Error ? error.message : String(error)
        }
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for server info
export async function GET() {
  return NextResponse.json({
    name: 'ennube-ai-tools',
    version: '1.0.0',
    description: 'MCP server exposing Ennube AI tools for CRM data management and workflow automation',
    protocol: 'mcp',
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {},
    },
    tools: TOOL_DEFINITIONS.map(tool => ({
      name: tool.name,
      description: tool.description,
    })),
  });
}
