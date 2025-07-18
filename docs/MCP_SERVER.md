# MCP Server for Ennube AI Tools

This directory contains an MCP (Model Context Protocol) server that exposes the Ennube AI tools for CRM data management and workflow automation.

## Available Tools

The MCP server exposes the following tools from the `lib/chat` directory:

### Workflow Tools
- **call_workflow_data_steward**: Executes the Data Steward agent workflow for enriching Account and Contact data in Salesforce
- **call_workflow_prospect_finder**: Executes the Prospect Finder workflow for finding new prospects

### Salesforce Data Tools
- **get_count**: Query for count of records in Salesforce
- **get_data**: Query Salesforce for CRM data with full field selection
- **get_fields**: Introspect a Salesforce sObject and return available fields
- **get_credentials**: Retrieve Salesforce credentials for the authenticated user

### Data Visualization Tool
- **visualize_data**: Generate rendered output for database results

## API Endpoints

### GET /api/mcp
Returns server information and available tools.

```json
{
  "name": "ennube-ai-tools",
  "version": "1.0.0",
  "description": "MCP server exposing Ennube AI tools for CRM data management and workflow automation",
  "protocol": "mcp",
  "protocolVersion": "2024-11-05",
  "capabilities": {
    "tools": {}
  },
  "tools": [...]
}
```

### POST /api/mcp
Handles MCP protocol requests.

#### Initialize Request
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {}
}
```

#### List Tools Request
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

#### Call Tool Request
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_data",
    "arguments": {
      "sobject": "Account",
      "filter": "Name != null",
      "limit": 10
    }
  }
}
```

## Authentication

All tool calls require authentication through the application's auth system. Users must be signed in with a valid Auth0 session to access the tools.

## Usage Example

```bash
# Initialize the MCP server
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {}
  }'

# List available tools
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'

# Call a tool
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_credentials",
      "arguments": {}
    }
  }'
```

## Configuration

The MCP server can be configured using the `mcp-config.json` file in the project root. This file defines the server connection details for MCP clients.

## Error Handling

The server returns JSON-RPC 2.0 compliant error responses:

- **-32601**: Method not found
- **-32603**: Internal server error
- **401**: Authentication required

## Development

To extend the MCP server with additional tools:

1. Add new tool definitions to the `TOOL_DEFINITIONS` array
2. Implement the tool execution logic in the `executeTool` function
3. Update this documentation

The server automatically discovers and exposes all tools from the `lib/chat` directory following the established patterns.

## Running the Server

Start the development server with:

```bash
pnpm dev
```

The MCP server will be available at `http://localhost:3000/api/mcp`.
