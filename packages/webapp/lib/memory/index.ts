// === index.ts ===
// Created: 2025-10-04 10:00
// Purpose: Clean exports for the memory learning system
// Exports:
//   - All memory classes and utilities
// Interactions:
//   - Imported by: orchestrator.ts, chatAgent.ts, route.ts
// Notes:
//   - Single entry point for memory functionality

export * from './types';
export { MemoryService, memoryService, getEmbeddings } from './memory-service';
export { MemoryRetriever, memoryRetriever } from './memory-retriever';
export { MemoryWriter, memoryWriter } from './memory-writer';
export { MemoryPolicy, memoryPolicy } from './memory-policy';
export { MemoryAudit, memoryAudit } from './audit';

/*
 * === index.ts ===
 * Updated: 2025-10-04 10:00
 * Summary: Barrel export for memory system modules
 * Key Components:
 *   - Exports all classes and utilities
 * Dependencies:
 *   - Requires: All memory module files
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Simplifies imports for consumers
 */