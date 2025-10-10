// === memory-writer.ts ===
// Created: 2025-10-04 10:00
// Purpose: Asynchronous queue for writing memory cases and handling reward computation
// Exports:
//   - MemoryWriter class
// Interactions:
//   - Used by: chatAgent.ts for post-response memory persistence
// Notes:
//   - Uses in-memory queue with background flush to avoid blocking responses
//   - Computes heuristic rewards from tool results and user feedback

import { MemoryService, getEmbeddings } from './memory-service';
import { MemoryWriteRequest, AgentMemoryCase } from './types';

/**
 * OVERVIEW
 *
 * - Purpose: Queue and persist memory cases asynchronously to maintain response performance
 * - Assumptions: Memory service handles transactions; rewards computed heuristically
 * - Edge Cases: Queue overflow, service failures, reward computation errors
 * - How it fits: Called after tool execution to capture outcomes without latency impact
 * - Future: Add batching, retry logic, and user feedback integration
 */

export class MemoryWriter {
  private service: MemoryService;
  private queue: MemoryWriteRequest[] = [];
  private isProcessing = false;
  private maxQueueSize = 100; // Prevent memory leaks

  constructor(service?: MemoryService) {
    this.service = service || new MemoryService();
  }

  /**
   * Enqueue a memory write request for asynchronous processing
   */
  async enqueue(request: MemoryWriteRequest): Promise<void> {
    if (this.queue.length >= this.maxQueueSize) {
      console.warn('Memory write queue full, dropping oldest request');
      this.queue.shift();
    }

    this.queue.push(request);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process the queue in background
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const request = this.queue.shift()!;
        await this.writeMemory(request);
      }
    } catch (error) {
      console.error('Memory write processing failed:', error);
      // Continue processing other items
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Write a single memory case to the database
   */
  private async writeMemory(request: MemoryWriteRequest): Promise<void> {
    try {
      // Get or create profile
      let profile = await this.service.getProfile(request.userSub, request.agentKey);
      if (!profile) {
        profile = await this.service.createProfile({
          userSub: request.userSub,
          agentKey: request.agentKey,
          windowSize: 200
        });
      }

      // Compute reward if not provided
      const rewardScore = request.rewardScore ?? this.computeRewardHeuristic(request);

      // Create the case
      const memoryCase: AgentMemoryCase = await this.service.createCase({
        profileId: profile.id,
        messageHash: request.messageHash,
        promptSnapshot: request.promptSnapshot,
        planSummary: request.planSummary,
        toolTraces: request.toolTraces,
        outcome: request.outcome,
        rewardScore,
        tags: request.tags,
        referenceCaseIds: request.referenceCaseIds,
      });

      // Generate and store embedding if possible
      if (request.promptSnapshot) {
        try {
          const textToEmbed = this.extractEmbeddingText(request);
          const embeddings = await getEmbeddings([textToEmbed]);
          await this.service.createEmbedding({
            caseId: memoryCase.id,
            embedding: embeddings[0],
            metadata: { rewardScore, outcome: request.outcome }
          });
        } catch (error) {
          console.warn('Embedding generation failed:', error);
          // Continue without embedding
        }
      }

      // Audit the write
      await this.service.createAudit({
        userSub: request.userSub,
        agentKey: request.agentKey,
        action: 'insert_case',
        payload: {
          caseId: memoryCase.id,
          outcome: request.outcome,
          rewardScore,
          tags: request.tags
        }
      });

      // Prune old cases if needed
      const prunedCount = await this.service.pruneOldCases(profile.id, profile.windowSize);
      if (prunedCount > 0) {
        console.log(`Pruned ${prunedCount} old memory cases for ${request.userSub}:${request.agentKey}`);
      }

    } catch (error) {
      console.error('Failed to write memory case:', error);
      // TODO: Implement retry logic or dead letter queue
    }
  }

  /**
   * Compute heuristic reward score from request data
   */
  private computeRewardHeuristic(request: MemoryWriteRequest): number {
    let score = 0.5; // Neutral default

    // Outcome-based scoring
    switch (request.outcome) {
      case 'success':
        score = 1.0;
        break;
      case 'failure':
        score = 0.0;
        break;
      case 'partial':
        score = 0.5;
        break;
      case 'aborted':
        score = 0.2;
        break;
    }

    // Adjust based on tool traces (if available)
    if (request.toolTraces) {
      const traces = request.toolTraces;
      // Simple heuristic: more successful tool calls = higher score
      const toolCount = Object.keys(traces).length;
      const successRate = this.estimateSuccessRate(traces);
      score = Math.min(1.0, score + (successRate - 0.5) * 0.2);
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Estimate success rate from tool traces
   */
  private estimateSuccessRate(traces: Record<string, any>): number {
    if (!traces || typeof traces !== 'object') return 0.5;

    let total = 0;
    let successful = 0;

    for (const [key, trace] of Object.entries(traces)) {
      if (trace && typeof trace === 'object') {
        total++;
        // Check for success indicators
        if (trace.status === 'success' || trace.success === true || trace.error === undefined) {
          successful++;
        }
      }
    }

    return total > 0 ? successful / total : 0.5;
  }

  /**
   * Extract text for embedding generation
   */
  private extractEmbeddingText(request: MemoryWriteRequest): string {
    const parts = [];

    if (request.promptSnapshot) {
      parts.push(JSON.stringify(request.promptSnapshot));
    }

    if (request.planSummary) {
      parts.push(JSON.stringify(request.planSummary));
    }

    if (request.tags && request.tags.length > 0) {
      parts.push(request.tags.join(' '));
    }

    return parts.join(' ').substring(0, 8000); // Limit text length
  }

  /**
   * Get current queue status for monitoring
   */
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      maxQueueSize: this.maxQueueSize,
    };
  }

  /**
   * Force process remaining queue items (for shutdown)
   */
  async flush(): Promise<void> {
    await this.processQueue();
  }
}

// Export singleton
export const memoryWriter = new MemoryWriter();

/*
 * === memory-writer.ts ===
 * Updated: 2025-10-04 10:00
 * Summary: Asynchronous memory case writer with reward computation and queue management
 * Key Components:
 *   - enqueue: Add requests to background queue
 *   - processQueue: Background processing loop
 *   - computeRewardHeuristic: Derive scores from outcomes
 * Dependencies:
 *   - Requires: memory-service.ts, types.ts
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Non-blocking writes to maintain response performance
 *   - Heuristic rewards based on tool success and outcomes
 */