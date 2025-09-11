// === callWorkflowTool.test.ts ===
// Created: 2025-09-10 00:00
// Purpose: Unit tests for callWorkflowTool (data-steward / prospect-finder / contract-reader)
// Notes: Mocks external dependencies (auth, fetch, nanoid) and the `ai.tool` wrapper.

// global fetch mock
global.fetch = jest.fn();

// Mock ai.tool before importing the module under test so the top-level `tool` import is the mock
jest.mock('ai', () => ({
  tool: jest.fn((config: any) => ({
    execute: config.execute,
    inputSchema: config.inputSchema,
    description: config.description,
  })),
}));

// Mock auth module used by the tool
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

// Mock nanoid to return a stable id
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'usage-123'),
}));

import { getWorkflowTool, callWorkflowToolDataSteward } from '@/lib/chat/callWorkflowTool';
import { auth } from '@/auth';
import { nanoid } from 'nanoid';

// auth is mocked above; relax typing for easier mockResolvedValueOnce usage in tests
const mockAuth = auth as unknown as jest.MockedFunction<any>;
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
const mockNanoid = nanoid as jest.MockedFunction<typeof nanoid>;

// Helper to execute the tool's execute function regardless of wrapper shape
const exec = async (tool: any, args: any) => {
  if (!tool) throw new Error('Tool is undefined');
  if (typeof tool.execute === 'function') return tool.execute(args);
  if (typeof tool === 'function') return tool(args);
  throw new Error('Tool has no execute');
};

describe('callWorkflowTool', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    mockFetch.mockReset();
    mockNanoid.mockReturnValue('usage-123');
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('requires signed-in session', async () => {
    mockAuth.mockResolvedValueOnce(null as any);
    const tool = getWorkflowTool('data-steward');
    await expect(exec(tool, { limit: '5' })).rejects.toThrow('You must be signed in to call a workflow');
  });

  it('requires subId on session', async () => {
    mockAuth.mockResolvedValueOnce({ user: { auth0: {} } } as any);
    const tool = getWorkflowTool('data-steward');
    await expect(exec(tool, { limit: '5' })).rejects.toThrow('subId is required');
  });

  it('requires webhook env to be configured', async () => {
    mockAuth.mockResolvedValueOnce({ user: { auth0: { sub: 'sub-1' } } } as any);
    delete process.env.DATASTEWARD_WEBHOOK_URL;
    const tool = getWorkflowTool('data-steward');
    await expect(exec(tool, { limit: '5' })).rejects.toThrow('Webhook URL is not configured for this agent');
  });

  it('successfully calls the webhook and returns data with usageId', async () => {
    mockAuth.mockResolvedValueOnce({ user: { auth0: { sub: 'sub-42' } } } as any);
    process.env.DATASTEWARD_WEBHOOK_URL = 'https://example.test/data-steward';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, processed: 2 }),
    } as any);

    const tool = getWorkflowTool('data-steward');
    const result = await exec(tool, { limit: '5', accountIds: ['0011', '0012'] });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.processed).toBe(2);
    // usageId injected from nanoid mock
    expect(result.usageId).toBe('usage-123');

    // Verify fetch was called with expected url and headers
    const calledUrl = (mockFetch.mock.calls[0][0] as string);
    expect(calledUrl).toContain('https://example.test/data-steward');
    expect(calledUrl).toContain('limit=5');
    expect(calledUrl).toContain('subId=sub-42');
    expect(calledUrl).toContain('usageId=usage-123');
    expect(calledUrl).toContain('accountIds=0011,0012');

    const calledOptions = mockFetch.mock.calls[0][1] as any;
    expect(calledOptions.method).toBe('GET');
    expect(calledOptions.headers['Content-Type']).toBe('application/json');
  });

  it('throws when webhook returns non-ok response with text', async () => {
    mockAuth.mockResolvedValueOnce({ user: { auth0: { sub: 'sub-42' } } } as any);
    process.env.DATASTEWARD_WEBHOOK_URL = 'https://example.test/data-steward';

    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve('internal error'),
    } as any);

    const tool = callWorkflowToolDataSteward; // direct export
    await expect(exec(tool, { limit: '3' })).rejects.toThrow('Error from agent webhook: internal error');
  });

  it('prospect-finder: requires webhook env and successfully calls webhook', async () => {
    // missing env should throw
    mockAuth.mockResolvedValueOnce({ user: { auth0: { sub: 'sub-77' } } } as any);
    delete process.env.PROSPECTFINDER_WEBHOOK_URL;
    let tool = getWorkflowTool('prospect-finder');
    await expect(exec(tool, { limit: '2' })).rejects.toThrow('Webhook URL is not configured for this agent');

    // provide env and succeed
    mockAuth.mockResolvedValueOnce({ user: { auth0: { sub: 'sub-77' } } } as any);
    process.env.PROSPECTFINDER_WEBHOOK_URL = 'https://example.test/prospect';
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ found: 5 }) } as any);

    tool = getWorkflowTool('prospect-finder');
    const res = await exec(tool, { limit: '7' });
    expect(res.found).toBe(5);
    expect(res.usageId).toBe('usage-123');

    const calledUrl = (mockFetch.mock.calls[mockFetch.mock.calls.length - 1][0] as string);
    expect(calledUrl).toContain('https://example.test/prospect');
    expect(calledUrl).toContain('limit=7');
    expect(calledUrl).toContain('subId=sub-77');
  });

  it('contract-reader: successfully calls webhook and returns usageId', async () => {
    mockAuth.mockResolvedValueOnce({ user: { auth0: { sub: 'sub-cr' } } } as any);
    process.env.CONTRACT_READER_WEBHOOK_URL = 'https://example.test/contract';
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ analyzed: 1 }) } as any);

    const tool = getWorkflowTool('contract-reader');
    const result = await exec(tool, { limit: '4' });
    expect(result.analyzed).toBe(1);
    expect(result.usageId).toBe('usage-123');

    const calledUrl = (mockFetch.mock.calls[mockFetch.mock.calls.length - 1][0] as string);
    expect(calledUrl).toContain('https://example.test/contract');
    expect(calledUrl).toContain('limit=4');
    expect(calledUrl).toContain('subId=sub-cr');
  });
});

/*
 * === callWorkflowTool.test.ts ===
 * Updated: 2025-09-10 00:00
 * Summary: Unit tests for callWorkflowTool exports
 */
