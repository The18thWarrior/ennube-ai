# Connecting LM Studio to the Ennube AI MCP Server

This guide explains how to configure LM Studio (or any MCP-aware client) to call the MCP HTTP transport exposed by this project.

Overview
- Local MCP HTTP transport endpoint (Next.js App Router):
  - POST /api/mcp/  (this project mounts the transport at `/api/mcp/`)
- Authentication: Authorization: Bearer <API_TOKEN>
  - The transport handler currently looks for a Bearer token in the Authorization header and has a placeholder `resolveSubFromBearerToken(token)` implementation. You must implement token verification or provide a mapping from token -> `sub` (user subject) in the server for full multi-tenant/owner-aware behaviour.

Quick LM Studio settings
1. Server URL
- Use the base URL of your running app plus the transport path. Example for local dev:
  - http://localhost:3000/api/mcp/

2. Transport type / protocol
- HTTP POST JSON RPC style (Model Context Protocol / MCP)
- Content type: application/json

3. Required headers
- Authorization: Bearer <API_TOKEN>
- Content-Type: application/json

4. Example LM Studio tool endpoint settings
- Endpoint URL: http://localhost:3000/api/mcp/
- Method: POST
- Headers:
  - Authorization: Bearer YOUR_TEST_TOKEN
  - Content-Type: application/json

Example request body (MCP CallTool request)

The MCP transport supports the following JSON-RPC style actions: Initialize, ListTools, CallTool. LM Studio will generally call CallTool. Here's an example payload LM Studio can send to call a tool:

{
  "jsonrpc": "2.0",
  "method": "CallTool",
  "params": {
    "tool": "get_data",
    "args": {
      "sobject": "Account",
      "filter": "WHERE Industry = 'Technology'",
      "limit": 10
    }
  },
  "id": "req-1"
}

Notes about `sub` (user identity)
- The transport handler will try to extract `sub` (the user subject) using this priority:
  1. Bearer token mapped to sub via `resolveSubFromBearerToken(token)` (placeholder)
  2. `sub` query parameter on the request URL (e.g. `?sub=auth0|12345`)
  3. default-sub-id fallback

- For production, replace `resolveSubFromBearerToken` with a real verification step:
  - If tokens are JWTs: verify signature & expiry and extract `sub` claim
  - If tokens are API keys: look them up in your DB and map to an owner `sub`

Curl quick test

# Call the get_count tool (example)
curl -X POST \
  http://localhost:3000/api/mcp/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "CallTool",
    "params": { "tool": "get_count", "args": { "sobject": "Account", "filter": "WHERE Industry = \"Technology\"" } },
    "id": "test-1"
  }'

Troubleshooting & tips
- If you see the handler returning default-sub-id results, it means your token resolver returned null. Implement token verification to get owner-aware results.
- If you get a 404 or Next.js routing error, confirm the app is running (`pnpm -C packages/webapp dev`) and that the transport is mounted at `/api/mcp/`.
- To test visually, add `?sub=auth0|local-test` to the URL while calling from curl or LM Studio to force a sub for testing.

Next steps for production
- Implement `resolveSubFromBearerToken(token)` in the MCP transport to verify tokens (JWT verification or DB lookup).
- Add TLS (HTTPS) and secure storage for API tokens.
- Add rate-limiting and auth scopes if you plan to expose the MCP endpoint publicly.

If you'd like, I can:
- Add a small test harness (Jest) that posts sample MCP JSON to the transport and asserts tool registrations and responses.
- Implement a JWT verification example using a JWKS URL or a DB-backed API key mapping.
