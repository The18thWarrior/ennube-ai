// === tests/lib/memory/memory-policy.test.ts ===
// Created: 2024-01-15 10:00
// Purpose: Unit tests for soft Q-learning memory policy implementation
// Exports: Test suite for MemoryPolicy class
// Interactions: Tests memory-policy.ts soft Q-learning functionality
// Notes: Mocks database operations and tests Q-function learning

import { MemoryPolicy } from '../../../lib/memory/memory-policy';
import { AgentMemoryPolicy, AgentMemoryCase } from '../../../lib/memory/types';

// Mock the database service
jest.mock('../../../lib/memory/memory-service', () => ({
  MemoryService: jest.fn().mockImplementation(() => ({
    getActivePolicy: jest.fn(),
    createPolicy: jest.fn(),
    createAudit: jest.fn(),
    getCasesByProfile: jest.fn(),
  })),
}));

describe('MemoryPolicy - Soft Q-Learning', () => {
  let memoryPolicy: MemoryPolicy;
  let mockService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = {
      getActivePolicy: jest.fn(),
      createPolicy: jest.fn(),
      createAudit: jest.fn(),
      getCasesByProfile: jest.fn(),
    };
    memoryPolicy = new MemoryPolicy(mockService);
  });

  describe('rankWithPolicy', () => {
    it('should rank cases using Q-function when policy has weights', async () => {
      const policy: AgentMemoryPolicy = {
        id: 'policy-123',
        profileId: 'profile-123',
        version: 1,
        weights: {
          rewardWeight: 2.0,
          outcomeWeight: 1.0,
          recencyWeight: 0.5,
          semanticWeight: 1.5,
          tagWeight: 0.8,
          textWeight: 1.0,
          bias: 0.0,
        },
        status: 'active',
        createdAt: new Date(),
      };

      const cases: AgentMemoryCase[] = [
        {
          id: 'case-1',
          profileId: 'profile-123',
          messageHash: 'hash1',
          outcome: 'success',
          rewardScore: 0.8,
          createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        },
        {
          id: 'case-2',
          profileId: 'profile-123',
          messageHash: 'hash2',
          outcome: 'failure',
          rewardScore: 0.2,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        },
      ];

      const result = await memoryPolicy.rankWithPolicy(cases, 'test query', policy);

      expect(result).toHaveLength(2);
      // Higher reward case should be ranked first
      expect(result[0].id).toBe('case-1');
      expect(result[1].id).toBe('case-2');
    });

    it('should fall back to heuristic ranking when policy has no weights', async () => {
      const policy: AgentMemoryPolicy = {
        id: 'policy-123',
        profileId: 'profile-123',
        version: 1,
        weights: undefined,
        status: 'active',
        createdAt: new Date(),
      };

      const cases: AgentMemoryCase[] = [
        { id: 'case-1', profileId: 'profile-123', messageHash: 'hash1', outcome: 'success', rewardScore: 0.2, createdAt: new Date() },
        { id: 'case-2', profileId: 'profile-123', messageHash: 'hash2', outcome: 'success', rewardScore: 0.8, createdAt: new Date() },
      ];

      const result = await memoryPolicy.rankWithPolicy(cases, 'test query', policy);

      expect(result[0].id).toBe('case-2'); // Higher reward first
      expect(result[1].id).toBe('case-1');
    });
  });

  describe('updatePolicy', () => {
    it('should create initial policy when none exists', async () => {
      mockService.getActivePolicy.mockResolvedValue(null);
      mockService.createPolicy.mockResolvedValue({
        id: 'policy-123',
        version: 1,
        weights: expect.any(Object),
        lossMetrics: { loss: 1.0, accuracy: 0.5 },
        status: 'active',
      });

      const trainingExamples = [
        { caseId: 'case-1', reward: 1, queryText: 'test query' },
      ];

      await memoryPolicy.updatePolicy('profile-123', trainingExamples);

      expect(mockService.createPolicy).toHaveBeenCalledWith({
        profileId: 'profile-123',
        version: 1,
        weights: expect.objectContaining({
          rewardWeight: 2.0,
          outcomeWeight: 1.0,
          bias: 0.0,
        }),
        lossMetrics: { loss: 1.0, accuracy: 0.5 },
        status: 'active',
      });
    });

    it('should train and update existing policy', async () => {
      const existingPolicy: AgentMemoryPolicy = {
        id: 'policy-123',
        profileId: 'profile-123',
        version: 1,
        weights: { 
          rewardWeight: 1.0, 
          outcomeWeight: 1.0, 
          recencyWeight: 0.5,
          semanticWeight: 1.0,
          tagWeight: 0.5,
          textWeight: 0.8,
          bias: 0.0 
        },
        lossMetrics: { loss: 1.0, accuracy: 0.5 },
        status: 'active',
        createdAt: new Date(),
      };

      mockService.getActivePolicy.mockResolvedValue(existingPolicy);
      mockService.getCasesByProfile.mockResolvedValue([
        {
          id: 'case-1',
          profileId: 'profile-123',
          messageHash: 'hash1',
          outcome: 'success',
          rewardScore: 0.8,
          createdAt: new Date(),
        },
      ]);
      mockService.createPolicy.mockResolvedValue({
        id: 'policy-124',
        version: 2,
        weights: { rewardWeight: 1.5, outcomeWeight: 1.2, bias: 0.1 },
        lossMetrics: { loss: 0.3, accuracy: 0.9 },
        status: 'active',
        trainedAt: new Date(),
      });

      const trainingExamples = [
        { caseId: 'case-1', reward: 1, queryText: 'test query' },
      ];

      await memoryPolicy.updatePolicy('profile-123', trainingExamples);

      expect(mockService.createPolicy).toHaveBeenCalledWith({
        profileId: 'profile-123',
        version: 2,
        weights: expect.any(Object),
        lossMetrics: expect.objectContaining({ loss: expect.any(Number), accuracy: expect.any(Number) }),
        trainedAt: expect.any(Date),
        status: 'active',
      });
    });
  });

  describe('extractFeatures', () => {
    it('should extract correct features from case and query', async () => {
      const case_: AgentMemoryCase = {
        id: 'case-1',
        profileId: 'profile-123',
        messageHash: 'hash1',
        promptSnapshot: { user: 'find customers' },
        planSummary: { steps: ['search', 'filter'] },
        outcome: 'success',
        rewardScore: 0.8,
        tags: ['sales', 'search'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      };

      const features = await (memoryPolicy as any).extractFeatures('find customers in sales', case_);

      expect(features.rewardScore).toBe(0.8);
      expect(features.outcomeScore).toBe(1); // success = 1
      expect(features.recencyScore).toBeLessThan(1); // Should decay over time
      expect(features.textSimilarity).toBeGreaterThan(0); // Should find some overlap
    });
  });

  describe('computeQValue', () => {
    it('should compute Q-value using linear model', () => {
      const features = {
        rewardScore: 0.8,
        outcomeScore: 1,
        recencyScore: 0.9,
        semanticSimilarity: 0.7,
        tagOverlap: 0,
        textSimilarity: 0.5,
      };

      const weights = {
        rewardWeight: 2.0,
        outcomeWeight: 1.0,
        recencyWeight: 0.5,
        semanticWeight: 1.5,
        tagWeight: 0.8,
        textWeight: 1.0,
        bias: 0.1,
      };

      const qValue = (memoryPolicy as any).computeQValue(features, weights);

      const expected = (
        2.0 * 0.8 +  // rewardWeight * rewardScore
        1.0 * 1 +    // outcomeWeight * outcomeScore
        0.5 * 0.9 +  // recencyWeight * recencyScore
        1.5 * 0.7 +  // semanticWeight * semanticSimilarity
        0.8 * 0 +    // tagWeight * tagOverlap
        1.0 * 0.5 +  // textWeight * textSimilarity
        0.1          // bias
      );

      expect(qValue).toBeCloseTo(expected, 5);
    });
  });

  describe('trainPolicy', () => {
    it('should train policy when sufficient data exists', async () => {
      const cases: AgentMemoryCase[] = Array.from({ length: 15 }, (_, i) => ({
        id: `case-${i}`,
        profileId: 'profile-123',
        messageHash: `hash${i}`,
        outcome: i % 2 === 0 ? 'success' : 'failure',
        rewardScore: Math.random(),
        createdAt: new Date(),
      }));

      mockService.getCasesByProfile.mockResolvedValue(cases);
      mockService.getActivePolicy.mockResolvedValue(null);
      mockService.createPolicy.mockResolvedValue({ id: 'policy-123', version: 1 });

      await memoryPolicy.trainPolicy('profile-123');

      expect(mockService.createPolicy).toHaveBeenCalled();
    });

    it('should skip training when insufficient data', async () => {
      const cases: AgentMemoryCase[] = [
        { id: 'case-1', profileId: 'profile-123', messageHash: 'hash1', outcome: 'success', rewardScore: 0.8, createdAt: new Date() },
      ];

      mockService.getCasesByProfile.mockResolvedValue(cases);

      await memoryPolicy.trainPolicy('profile-123');

      expect(mockService.createPolicy).not.toHaveBeenCalled();
    });
  });
});

/*
 * === tests/lib/memory/memory-policy.test.ts ===
 * Updated: 2024-01-15 10:00
 * Summary: Unit tests for soft Q-learning memory policy implementation
 * Key Components:
 *   - rankWithPolicy: Tests Q-function ranking
 *   - updatePolicy: Tests policy training and updates
 *   - extractFeatures: Tests feature engineering
 *   - computeQValue: Tests linear Q-function
 *   - trainPolicy: Tests background training logic
 * Dependencies:
 *   - Requires: MemoryPolicy, AgentMemoryPolicy, AgentMemoryCase types
 *   - Mocks: MemoryService for database operations
 * Version History:
 *   v1.0 – initial unit tests for soft Q-learning
 * Notes:
 *   - Tests gradient descent training logic
 *   - Validates feature extraction and Q-computation
 *   - Mocks external dependencies for isolated testing
 */