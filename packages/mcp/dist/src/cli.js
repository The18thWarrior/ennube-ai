// === cli.ts ===
// Created: 2025-07-24 13:00
// Purpose: CLI entrypoint to start MCP server
// Exports: none (bin script)
// Interactions: Used by npm bin, direct CLI
// Notes: Requires MCPServer from server.ts
import { MCPServer } from './server';
import { Command } from 'commander';
const program = new Command();
program
    .name('mpc-server')
    .description('Start an MCP server')
    .option('-n, --name <name>', 'Server name', 'MCP Server')
    .option('-v, --version <version>', 'Server version', '1.0.0')
    .option('-p, --port <port>', 'Port to listen on', '8080')
    .option('-t, --transport <type>', 'Transport type (stdio|sse|httpStream)', 'stdio')
    .option('--tool-dir <dir>', 'Directory for tool definitions')
    .option('--resource-dir <dir>', 'Directory for resources')
    .parse(process.argv);
const opts = program.opts();
const config = {
    name: opts.name,
    version: opts.version,
};
const server = new MCPServer(config);
server.start({
    transportType: opts.transport,
}).then(() => {
    // eslint-disable-next-line no-console
    console.log(`MCP server started on port ${opts.port} with transport ${opts.transport}`);
}).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start MCP server:', err);
    process.exit(1);
});
/*
 * === cli.ts ===
 * Updated: 2025-07-24 13:00
 * Summary: CLI entrypoint for MCP server startup
 * Key Components:
 *   - MCPServer: Main server class
 *   - commander: CLI argument parsing
 * Version History:
 *   v1.0 – initial
 */
