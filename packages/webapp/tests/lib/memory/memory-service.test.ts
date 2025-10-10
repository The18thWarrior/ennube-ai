// === tests/lib/memory/memory-service.test.ts ===
// Created: 2024-01-15 10:00
// Purpose: Unit tests for memory service CRUD operations and compression
// Exports: Test suite for MemoryService class
// Interactions: Tests memory-service.ts functionality
// Notes: Mocks database and embedding API calls

import { MemoryService } from '../../../lib/memory/memory-service';
import { AgentMemoryCase, AgentMemoryProfile } from '../../../lib/memory/types';

// Mock the database pool
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    end: jest.fn(),
  })),
}));

// Mock pako compression functions
jest.mock('pako', () => ({
  deflate: jest.fn((data) => Buffer.from(JSON.stringify(data))),
  inflate: jest.fn((data, options) => {
    if (options && options.to === 'string') {
      return data.toString();
    }
    return data;
  }),
}));

describe('MemoryService', () => {
  let memoryService: MemoryService;
  const mockUserSub = 'test-user-123';
  const mockAgentKey = 'test-agent';

  beforeEach(() => {
    jest.clearAllMocks();
    memoryService = new MemoryService();
  });

  describe('createProfile', () => {
    it('should create a new memory profile', async () => {
      const mockProfile: AgentMemoryProfile = {
        id: 'profile-123',
        userSub: mockUserSub,
        agentKey: mockAgentKey,
        windowSize: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [mockProfile] }),
        release: jest.fn(),
      };
      (memoryService as any).pool.connect = jest.fn().mockResolvedValue(mockClient);

      const result = await memoryService.createProfile({
        userSub: mockUserSub,
        agentKey: mockAgentKey,
        windowSize: 100,
      });

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO agent_memory_profiles'),
        [mockUserSub, mockAgentKey, 100]
      );
      expect(result).toEqual(mockProfile);
    });
  });

  describe('getProfile', () => {
    it('should retrieve an existing profile', async () => {
      const mockProfile: AgentMemoryProfile = {
        id: 'profile-123',
        userSub: mockUserSub,
        agentKey: mockAgentKey,
        windowSize: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [mockProfile] }),
        release: jest.fn(),
      };
      (memoryService as any).pool.connect = jest.fn().mockResolvedValue(mockClient);

      const result = await memoryService.getProfile(mockUserSub, mockAgentKey);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, user_sub as "userSub"'),
        [mockUserSub, mockAgentKey]
      );
      expect(result).toEqual(mockProfile);
    });

    it('should return null if profile not found', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn(),
      };
      (memoryService as any).pool.connect = jest.fn().mockResolvedValue(mockClient);

      const result = await memoryService.getProfile(mockUserSub, mockAgentKey);

      expect(result).toBeNull();
    });
  });

  describe('createCase', () => {
    it('should create a new memory case with compression', async () => {
      const mockCase: AgentMemoryCase = {
        id: 'case-123',
        profileId: 'profile-123',
        messageHash: 'hash123',
        promptSnapshot: { messages: ['test prompt'] },
        planSummary: { summary: 'Test plan' },
        toolTraces: { tools: [{ tool: 'test', result: 'success' }] },
        outcome: 'success',
        rewardScore: 0.8,
        tags: ['test'],
        createdAt: new Date(),
        referenceCaseIds: [],
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [mockCase] }) // INSERT
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      (memoryService as any).pool.connect = jest.fn().mockResolvedValue(mockClient);

      const result = await memoryService.createCase({
        profileId: 'profile-123',
        messageHash: 'hash123',
        promptSnapshot: mockCase.promptSnapshot,
        planSummary: mockCase.planSummary,
        toolTraces: mockCase.toolTraces,
        outcome: 'success',
        rewardScore: 0.8,
        tags: ['test'],
        referenceCaseIds: [],
      });

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO agent_memory_cases'),
        expect.arrayContaining([
          'profile-123',
          'hash123',
          expect.any(Buffer), // compressed prompt_snapshot
          expect.any(Buffer), // compressed plan_summary
          expect.any(Buffer), // compressed tool_traces
          'success',
          0.8,
          ['test'],
          [],
        ])
      );
      expect(result).toEqual(mockCase);
    });
  });

  describe('getCasesByProfile', () => {
    it('should retrieve cases with decompression', async () => {
      // Create compressed data for the mock
      const compressedPrompt = Buffer.from(JSON.stringify({ messages: ['test prompt'] }));
      const compressedPlan = Buffer.from(JSON.stringify({ summary: 'Test plan' }));
      const compressedTraces = Buffer.from(JSON.stringify({ tools: [{ tool: 'test', result: 'success' }] }));

      const mockDbRow = {
        id: 'case-123',
        profileId: 'profile-123',
        messageHash: 'hash123',
        prompt_snapshot: compressedPrompt,
        plan_summary: compressedPlan,
        tool_traces: compressedTraces,
        outcome: 'success',
        rewardScore: 0.8,
        tags: ['test'],
        createdAt: new Date(),
        referenceCaseIds: [],
      };

      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [mockDbRow] }),
        release: jest.fn(),
      };
      (memoryService as any).pool.connect = jest.fn().mockResolvedValue(mockClient);

      const result = await memoryService.getCasesByProfile('profile-123', 10);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, profile_id as "profileId"'),
        ['profile-123', 10]
      );
      const [resultCase] = result;
      expect(resultCase.id).toBe('case-123');
      expect(resultCase.profileId).toBe('profile-123');
      expect(resultCase.messageHash).toBe('hash123');
      expect(resultCase.promptSnapshot).toEqual({ messages: ['test prompt'] });
      expect(resultCase.planSummary).toEqual({ summary: 'Test plan' });
      expect(resultCase.toolTraces).toEqual({ tools: [{ tool: 'test', result: 'success' }] });
      expect(resultCase.outcome).toBe('success');
      expect(resultCase.rewardScore).toBe(0.8);
      expect(resultCase.tags).toEqual(['test']);
      expect(resultCase.referenceCaseIds).toEqual([]);
    });
  });
});

/*
 * === tests/lib/memory/memory-service.test.ts ===
 * Updated: 2024-01-15 10:00
 * Summary: Unit tests for MemoryService CRUD operations and compression
 * Key Components:
 *   - createProfile(): Tests profile creation
 *   - getProfile(): Tests profile retrieval
 *   - createCase(): Tests case creation with compression
 *   - getCasesByProfile(): Tests case retrieval with decompression
 * Dependencies:
 *   - Requires: MemoryService, AgentMemoryProfile, AgentMemoryCase types
 *   - Mocks: PostgreSQL pool
 * Version History:
 *   v1.0 – initial unit tests for memory service
 * Notes:
 *   - Uses Jest mocks for database operations
 *   - Tests compression/decompression functionality
 */