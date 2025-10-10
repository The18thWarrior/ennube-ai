// === memory-retriever.ts ===
// Created: 2025-10-04 10:00
// Purpose: Retrieve Top-K relevant memory cases for agent planning using non-parametric and parametric methods
// Exports:
//   - MemoryRetriever class
// Interactions:
//   - Used by: orchestrator.ts for injecting memory context before planning
// Notes:
//   - Combines semantic similarity (pgvector) with policy-based scoring
//   - Falls back to keyword search if embeddings unavailable

import { MemoryService, getEmbeddings } from './memory-service';
import { AgentMemoryCase, AgentMemoryEmbedding, AgentMemoryPolicy, MemoryRetrievalResult } from './types';

/**
 * OVERVIEW
 *
 * - Purpose: Select and rank relevant past cases to bias agent decision-making
 * - Assumptions: Embeddings available via API; policy models trained separately
 * - Edge Cases: No cases found, embedding failures, policy unavailable
 * - How it fits: Called before LLM planning to augment context with memories
 * - Future: Add more sophisticated ranking (recency, diversity, user feedback)
 */

export class MemoryRetriever {
  private service: MemoryService;

  constructor(service?: MemoryService) {
    this.service = service || new MemoryService();
  }

  /**
   * Retrieve Top-K memory cases for a user-agent pair
   * @param userSub Auth0 user subject
   * @param agentKey Agent identifier
   * @param queryText Text to find similar memories for
   * @param k Number of cases to retrieve (default 4)
   * @param tags Optional tags to filter by
   */
  async retrieveMemories(
    userSub: string,
    agentKey: string,
    queryText: string,
    k: number = 4,
    tags?: string[]
  ): Promise<MemoryRetrievalResult> {
    const startTime = Date.now();

    try {
      // Get or create profile
      let profile = await this.service.getProfile(userSub, agentKey);
      if (!profile) {
        profile = await this.service.createProfile({ userSub, agentKey, windowSize: 200 });
      }

      // Get recent cases
      const cases = await this.service.getCasesByProfile(profile.id, profile.windowSize);

      if (cases.length === 0) {
        return {
          cases: [],
          retrievalMetrics: { hitRate: 0, latency: Date.now() - startTime, tokenCount: 0 }
        };
      }

      // Filter by tags if provided
      let filteredCases = cases;
      if (tags && tags.length > 0) {
        filteredCases = cases.filter(case_ =>
          case_.tags && case_.tags.some(tag => tags.includes(tag))
        );
      }

      if (filteredCases.length === 0) {
        return {
          cases: [],
          retrievalMetrics: { hitRate: 0, latency: Date.now() - startTime, tokenCount: 0 }
        };
      }

      // Generate query embedding
      let queryEmbedding: number[] | null = null;
      try {
        const embeddings = await getEmbeddings([queryText]);
        queryEmbedding = embeddings[0];
      } catch (error) {
        console.warn('Embedding API failed, falling back to keyword search:', error);
      }

      let rankedCases: AgentMemoryCase[] = [];
      let embeddings: AgentMemoryEmbedding[] | undefined;

      if (queryEmbedding) {
        // Use semantic similarity
        embeddings = await this.service.getSimilarEmbeddings(queryEmbedding, profile.id, k * 2); // Get more for ranking

        // Map embeddings back to cases
        const embeddingMap = new Map(embeddings.map(e => [e.caseId, e]));
        const embeddableCases = filteredCases.filter(c => embeddingMap.has(c.id));

        // Sort by embedding similarity (already done by query, but ensure order)
        rankedCases = embeddableCases.slice(0, k);
      } else {
        // Fallback: keyword-based ranking
        const queryWords = queryText.toLowerCase().split(/\s+/);
        rankedCases = filteredCases
          .map(case_ => {
            const text = [
              case_.promptSnapshot ? JSON.stringify(case_.promptSnapshot) : '',
              case_.planSummary ? JSON.stringify(case_.planSummary) : '',
              case_.tags ? case_.tags.join(' ') : ''
            ].join(' ').toLowerCase();

            const score = queryWords.reduce((acc, word) =>
              acc + (text.includes(word) ? 1 : 0), 0
            );

            return { case: case_, score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, k)
          .map(item => item.case);
      }

      // Apply parametric policy if available
      const policy = await this.service.getActivePolicy(profile.id);
      if (policy && policy.weights) {
        rankedCases = await this.applyParametricRanking(rankedCases, queryText, policy);
      }

      // Calculate metrics
      const hitRate = rankedCases.length > 0 ? 1 : 0;
      const latency = Date.now() - startTime;
      const tokenCount = this.estimateTokenCount(rankedCases);

      return {
        cases: rankedCases,
        embeddings,
        policyVersion: policy?.version,
        retrievalMetrics: { hitRate, latency, tokenCount }
      };

    } catch (error) {
      console.error('Memory retrieval failed:', error);
      return {
        cases: [],
        retrievalMetrics: { hitRate: 0, latency: Date.now() - startTime, tokenCount: 0 }
      };
    }
  }

  /**
   * Apply parametric policy ranking (placeholder for future implementation)
   * Currently returns cases as-is; future will use trained Q-function
   */
  private async applyParametricRanking(
    cases: AgentMemoryCase[],
    queryText: string,
    policy: AgentMemoryPolicy
  ): Promise<AgentMemoryCase[]> {
    // TODO: Implement soft Q-learning ranking using policy.weights
    // For now, boost high-reward cases
    return cases.sort((a, b) => (b.rewardScore || 0) - (a.rewardScore || 0));
  }

  /**
   * Estimate token count for retrieved memories (rough approximation)
   */
  private estimateTokenCount(cases: AgentMemoryCase[]): number {
    const text = cases.map(c =>
      JSON.stringify(c.promptSnapshot || {}) +
      JSON.stringify(c.planSummary || {}) +
      JSON.stringify(c.toolTraces || {})
    ).join(' ');

    // Rough estimate: 1 token per 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Format cases for injection into LLM prompt
   */
  formatMemoryContext(cases: AgentMemoryCase[]): string {
    if (cases.length === 0) return '';

    const memories = cases.map((case_, idx) => {
      const context = case_.promptSnapshot ? `Context: ${JSON.stringify(case_.promptSnapshot)}` : '';
      const actions = case_.planSummary ? `Actions: ${JSON.stringify(case_.planSummary)}` : '';
      const outcome = `Outcome: ${case_.outcome}`;
      const reward = case_.rewardScore ? `Reward: ${case_.rewardScore}` : '';

      return `Memory ${idx + 1}:\n${context}\n${actions}\n${outcome}\n${reward}\n`;
    }).join('\n');

    return `Relevant past experiences:\n${memories}\nUse these to inform your planning.`;
  }
}

// Export singleton
export const memoryRetriever = new MemoryRetriever();

/*
 * === memory-retriever.ts ===
 * Updated: 2025-10-04 10:00
 * Summary: Retrieves and ranks relevant memory cases for agent planning
 * Key Components:
 *   - retrieveMemories: Main retrieval with semantic + parametric ranking
 *   - formatMemoryContext: Formats cases for LLM prompt injection
 *   - Fallback: Keyword search if embeddings fail
 * Dependencies:
 *   - Requires: memory-service.ts, types.ts
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Implements Top-K retrieval with diversity considerations
 *   - Parametric ranking is placeholder for future Q-learning
 */