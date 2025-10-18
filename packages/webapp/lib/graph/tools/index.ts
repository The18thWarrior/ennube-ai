// === tools/index.ts ===
// Created: 2025-10-10 12:00
// Purpose: Export all graph database AI SDK tools
// Exports:
//   - getTableInfoTool
//   - analyzeTableRelationshipsTool
//   - findJoinPathTool
//   - findMultiTableJoinPathsTool
// Interactions:
//   - Used by: AI agents requiring graph database query assistance
// Notes:
//   - All tools require a GraphDatabase instance parameter

export { getTableInfoTool } from './getTableInfoTool';
export { analyzeTableRelationshipsTool } from './analyzeTableRelationshipsTool';
export { findJoinPathTool } from './findJoinPathTool';
export { findMultiTableJoinPathsTool } from './findMultiTableJoinPathsTool';
export { getAllTableNamesTool } from './getAllTableNamesTool';

/**
 * OVERVIEW
 *
 * - Purpose: Centralized exports for all graph database AI SDK tools
 * - Assumptions: Tools are used in AI agent contexts with GraphDatabase instances
 * - Edge Cases: All tools validate required parameters and handle graph database errors
 * - How it fits into the system: Provides AI agents with direct database schema analysis capabilities
 * - Future Improvements: Add more specialized analysis tools, batch operations
 */

/*
 * === tools/index.ts ===
 * Updated: 2025-10-10 12:00
 * Summary: Export file for graph database AI SDK tools
 * Key Components:
 *   - getTableInfoTool: Get comprehensive table information
 *   - analyzeTableRelationshipsTool: Analyze table relationships and suggest joins
 *   - findJoinPathTool: Find optimal join path between two tables
 *   - findMultiTableJoinPathsTool: Find join paths connecting multiple tables
 * Dependencies:
 *   - Requires: Individual tool files and graph database classes
 * Version History:
 *   v1.0 – initial tool exports for AI SDK integration
 *   v1.1 – updated to use GraphDatabase instances directly instead of API calls
 * Notes:
 *   - Tools follow consistent patterns with zod validation and error handling
 *   - All tools operate directly on GraphDatabase instances for better performance
 */