// === audit.ts ===
// Created: 2025-10-04 10:00
// Purpose: Structured logging for memory operations and telemetry
// Exports:
//   - MemoryAudit class
// Interactions:
//   - Used by: memory-service.ts, memory-writer.ts for operation tracking
// Notes:
//   - Logs all mutations for debugging and analytics
//   - Structured format for easy querying

import { MemoryService } from './memory-service';

/**
 * OVERVIEW
 *
 * - Purpose: Provide audit trail for memory system operations
 * - Assumptions: Audit table exists; operations are logged post-commit
 * - Edge Cases: Logging failures don't block operations
 * - How it fits: Called after successful operations for observability
 * - Future: Add metrics export, alerting on anomalies
 */

export class MemoryAudit {
  private service: MemoryService;

  constructor(service?: MemoryService) {
    this.service = service || new MemoryService();
  }

  /**
   * Log a memory operation
   */
  async logOperation(
    userSub: string,
    agentKey: string,
    action: 'insert_case' | 'update_case' | 'prune_case' | 'retrieve_cases' | 'train_policy',
    payload: Record<string, any>
  ): Promise<void> {
    try {
      await this.service.createAudit({
        userSub,
        agentKey,
        action,
        payload: {
          ...payload,
          timestamp: Date.now(),
        }
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
      // Don't throw - audit failures shouldn't break operations
    }
  }

  /**
   * Log retrieval operation with metrics
   */
  async logRetrieval(
    userSub: string,
    agentKey: string,
    queryText: string,
    resultCount: number,
    latency: number,
    tokenCount: number,
    policyVersion?: number
  ): Promise<void> {
    await this.logOperation(userSub, agentKey, 'retrieve_cases', {
      queryText: queryText.substring(0, 200), // Truncate for storage
      resultCount,
      latency,
      tokenCount,
      policyVersion,
    });
  }

  /**
   * Log case insertion
   */
  async logCaseInsertion(
    userSub: string,
    agentKey: string,
    caseId: string,
    outcome: string,
    rewardScore?: number
  ): Promise<void> {
    await this.logOperation(userSub, agentKey, 'insert_case', {
      caseId,
      outcome,
      rewardScore,
    });
  }

  /**
   * Log pruning operation
   */
  async logPruning(
    userSub: string,
    agentKey: string,
    prunedCount: number,
    windowSize: number
  ): Promise<void> {
    await this.logOperation(userSub, agentKey, 'prune_case', {
      prunedCount,
      windowSize,
    });
  }

  /**
   * Log policy training
   */
  async logPolicyTraining(
    userSub: string,
    agentKey: string,
    profileId: string,
    examplesCount: number,
    newVersion: number
  ): Promise<void> {
    await this.logOperation(userSub, agentKey, 'train_policy', {
      profileId,
      examplesCount,
      newVersion,
    });
  }
}

// Export singleton
export const memoryAudit = new MemoryAudit();

/*
 * === audit.ts ===
 * Updated: 2025-10-04 10:00
 * Summary: Audit logging for memory system operations
 * Key Components:
 *   - logOperation: Generic audit logging
 *   - logRetrieval: Retrieval-specific logging with metrics
 *   - logCaseInsertion: Case creation logging
 * Dependencies:
 *   - Requires: memory-service.ts
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Non-blocking logging to avoid impacting performance
 *   - Structured payloads for analytics
 */