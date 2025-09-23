// === webSearchTool.ts ===
// Created: 2025-09-23 12:00
// Purpose: Provides web search functionality for agents using Google Custom Search API
// Exports:
//   - export const webSearchTool = (subId: string) => { ... }
// Interactions:
//   - Used by: Chat agents for web queries
// Notes:
//   - Requires GOOGLE_SEARCH_URL, GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_CX env vars

import { tool } from "ai";
import z from "zod/v4";

/**
 * OVERVIEW
 *
 * - Purpose: Exposes web search capability to agents via Google Custom Search API
 * - Assumptions: Environment variables GOOGLE_SEARCH_URL, GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_CX are set
 * - Edge Cases: API rate limits, invalid queries, network failures
 * - How it fits into the system: Integrates with MCP tools for agent workflows
 * - Future Improvements: Add support for additional search parameters like num, safe, etc.
 */

// Tool: Web Search
export const webSearchTool = (subId: string) => {
    return tool({
      description: 'Search the web using Google Custom Search API for real-time information.',
      execute: async ({ query }: { query: string }) => {
        if (!subId) throw new Error('subId is required');
        const url = process.env.GOOGLE_SEARCH_URL;
        const key = process.env.GOOGLE_SEARCH_API_KEY;
        const cx = process.env.GOOGLE_SEARCH_CX;
        if (!url || !key || !cx) {
          throw new Error('Missing required environment variables: GOOGLE_SEARCH_URL, GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_CX');
        }
        const fullUrl = `${url}?key=${key}&cx=${cx}&q=${encodeURIComponent(query)}`;
        const res = await fetch(fullUrl);
        if (!res.ok) {
          throw new Error(`Web search failed: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        return data;
      },
      inputSchema: z.object({
        query: z.string().describe('The search query to perform on the web. Must be a non-empty string.'),
      }),
    });
}

/*
 * === webSearchTool.ts ===
 * Updated: 2025-09-23 12:00
 * Summary: Implements web search tool for agents
 * Key Components:
 *   - webSearchTool(): Returns a tool for web searching
 * Dependencies:
 *   - Requires: ai (tool), zod/v4, fetch API
 * Version History:
 *   v1.0 – initial implementation
 * Notes:
 *   - Ensure env vars are configured for production use
 */