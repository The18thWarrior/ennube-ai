# @ennube-ai/mcp

A TypeScript wrapper package for [FastMCP](https://github.com/punkpeye/fastmcp) that provides type-safe Model Context Protocol (MCP) server and client implementations for the ennube-ai ecosystem.

## Features

- 🚀 **Easy-to-use FastMCP wrapper** with simplified APIs
- 🔒 **Type-safe** implementations with comprehensive TypeScript support
- 🛠️ **Multiple transport types** (stdio, SSE, HTTP streaming)
- 🔧 **Tool, Resource, and Prompt management** with Zod schema validation
- 🔐 **Authentication support** with custom authentication functions
- 📦 **Content helpers** for images, audio, and other media types
- ⚡ **Event-driven architecture** with typed event handlers
- 🧪 **Comprehensive testing** with Jest test suite

## Installation

```bash
pnpm add @ennube-ai/mcp
```

## Quick Start

### Creating an MCP Server

```typescript
import { MCPServer } from '@ennube-ai/mcp';
import { z } from 'zod';

const server = new MCPServer({
  name: 'My MCP Server',
  version: '1.0.0',
});

// Add a tool with validation
server.addTool({
  name: 'add_numbers',
  description: 'Add two numbers together',
  parameters: z.object({
    a: z.number(),
    b: z.number(),
  }),
  execute: async (args) => {
    return String(args.a + args.b);
  },
});

// Start the server
await server.start({
  transportType: 'stdio',
});
```

### Creating an MCP Client

```typescript
import { MCPClient } from '@ennube-ai/mcp';

const client = new MCPClient({
  name: 'My MCP Client',
  version: '1.0.0',
});

// Connect to server
await client.connect({
  type: 'stdio',
  command: 'node',
  args: ['server.js'],
});

// Call a tool
const result = await client.callTool({
  name: 'add_numbers',
  arguments: { a: 5, b: 3 },
});

console.log(result.content[0].text); // "8"
```

## Server API

### Server Configuration

```typescript
interface MCPServerConfig {
  name: string;
  version: string;
  description?: string;
  instructions?: string;
  authenticate?: (request: any) => any;
  ping?: {
    enabled?: boolean;
    intervalMs?: number;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
  };
  roots?: {
    enabled?: boolean;
  };
  health?: {
    enabled?: boolean;
    message?: string;
    path?: string;
    status?: number;
  };
}
```

### Adding Tools

```typescript
// Tool with parameters
server.addTool({
  name: 'fetch_url',
  description: 'Fetch content from a URL',
  parameters: z.object({
    url: z.string().url(),
    timeout: z.number().optional(),
  }),
  execute: async (args) => {
    const response = await fetch(args.url);
    return await response.text();
  },
});

// Tool without parameters
server.addTool({
  name: 'get_timestamp',
  description: 'Get current timestamp',
  execute: async () => {
    return new Date().toISOString();
  },
});
```

### Adding Resources

```typescript
// Static resource
server.addResource({
  uri: 'file:///app.log',
  name: 'Application Log',
  mimeType: 'text/plain',
  load: async () => ({
    text: await readLogFile(),
  }),
});

// Resource template
server.addResourceTemplate({
  uriTemplate: 'file:///logs/{name}.log',
  name: 'Log Files',
  mimeType: 'text/plain',
  arguments: [
    {
      name: 'name',
      description: 'Log file name',
      required: true,
    },
  ],
  load: async ({ name }) => ({
    text: await readLogFile(name),
  }),
});
```

### Adding Prompts

```typescript
server.addPrompt({
  name: 'code_review',
  description: 'Generate code review comments',
  arguments: [
    {
      name: 'code',
      description: 'Code to review',
      required: true,
    },
    {
      name: 'language',
      description: 'Programming language',
      required: false,
    },
  ],
  load: async (args) => {
    return `Please review this ${args.language || 'code'}:\n\n${args.code}`;
  },
});
```

### Transport Options

```typescript
// stdio transport
await server.start({
  transportType: 'stdio',
});

// HTTP streaming
await server.start({
  transportType: 'httpStream',
  httpStream: {
    port: 8080,
    endpoint: '/mcp', // optional, defaults to '/mcp'
  },
});

// Server-Sent Events
await server.start({
  transportType: 'sse',
  sse: {
    port: 8080,
    endpoint: '/sse', // optional, defaults to '/sse'
  },
});
```

## Client API

### Client Configuration

```typescript
interface MCPClientConfig {
  name: string;
  version: string;
  capabilities?: {
    sampling?: boolean;
    roots?: boolean;
  };
}
```

### Transport Connections

```typescript
// stdio connection
await client.connect({
  type: 'stdio',
  command: 'node',
  args: ['server.js'],
});

// SSE connection
await client.connect({
  type: 'sse',
  url: 'http://localhost:8080/sse',
});

// HTTP streaming connection
await client.connect({
  type: 'httpStream',
  url: 'http://localhost:8080/mcp',
  headers: {
    'Authorization': 'Bearer token',
  },
});
```

### Client Operations

```typescript
// List available tools
const tools = await client.listTools();

// Call a tool
const result = await client.callTool({
  name: 'tool_name',
  arguments: { key: 'value' },
});

// List resources
const resources = await client.listResources();

// Read a resource
const resource = await client.readResource('file:///path/to/resource');

// List prompts
const prompts = await client.listPrompts();

// Get a prompt
const prompt = await client.getPrompt({
  name: 'prompt_name',
  arguments: { key: 'value' },
});
```

## Utility Functions

### Content Helpers

```typescript
import { imageContent, audioContent } from '@ennube-ai/mcp';

// Create image content from URL
const image = await imageContent({
  url: 'https://example.com/image.png',
});

// Create image content from file path
const image = await imageContent({
  path: '/path/to/image.jpg',
});

// Create image content from buffer
const image = await imageContent({
  buffer: imageBuffer,
  mimeType: 'image/png',
});

// Create audio content
const audio = await audioContent({
  url: 'https://example.com/audio.mp3',
});
```

### Error Handling

```typescript
import { UserError } from '@ennube-ai/mcp';

server.addTool({
  name: 'validate_input',
  execute: async (args) => {
    if (!isValid(args.input)) {
      throw new UserError('Invalid input provided');
    }
    return 'Valid input';
  },
});
```

## Authentication

```typescript
const server = new MCPServer({
  name: 'Secure Server',
  version: '1.0.0',
  authenticate: (request) => {
    const apiKey = request.headers['x-api-key'];
    if (!isValidApiKey(apiKey)) {
      throw new Response(null, {
        status: 401,
        statusText: 'Unauthorized',
      });
    }
    return { userId: getUserId(apiKey) };
  },
});

// Access session data in tools
server.addTool({
  name: 'user_specific_action',
  execute: async (args, { session }) => {
    return `Action for user: ${session.userId}`;
  },
});
```

## Event Handling

```typescript
// Server events
server.on('connect', (event) => {
  console.log('Client connected:', event.session);
});

server.on('disconnect', (event) => {
  console.log('Client disconnected:', event.session);
});

// Session events
server.on('connect', (event) => {
  const session = event.session;
  
  session.on('rootsChanged', (event) => {
    console.log('Roots changed:', event.roots);
  });
});
```

## Testing

Run the test suite:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT - see LICENSE file for details.

## Related Projects

- [FastMCP](https://github.com/punkpeye/fastmcp) - The underlying FastMCP library
- [Model Context Protocol](https://modelcontextprotocol.io/) - Official MCP specification
- [ennube-ai](https://github.com/The18thWarrior/ennube-ai) - Main ennube-ai project
