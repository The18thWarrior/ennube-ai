// // === proposeUpdateDataTool.test.ts ===
// // Created: 2025-09-10 00:00
// // Purpose: Unit tests for proposeUpdateDataTool
// // Coverage:
// //   - Happy path proposal generation
// //   - Validation of required inputs (subId, nlRequest)
// //   - Error handling for API failures
// // Notes:
// //   - Mocks external dependencies (fetch, getBaseUrl, ai.tool)

// Global fetch mock
global.fetch = jest.fn();

// Mock external dependencies before importing modules under test
jest.mock('@/lib/chat/helper', () => ({
  getBaseUrl: jest.fn()
}));

jest.mock('ai', () => ({
  tool: jest.fn((config: any) => config)
}));

// Now import the module under test
import { proposeUpdateDataTool } from '@/lib/chat/sfdc/proposeUpdateDataTool';

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
const helper = require('@/lib/chat/helper');

describe('proposeUpdateDataTool', () => {
  const testSubId = 'test-sub-123';
  const baseUrl = 'https://api.test.example';

  beforeEach(() => {
    jest.clearAllMocks();
    helper.getBaseUrl.mockResolvedValue(baseUrl);
  });

  it('should call proposal API and return parsed JSON on success', async () => {
    const mockResponse = { proposal: { changes: [{ field: 'Name', from: 'Old', to: 'New' }] }, validation: [] };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as any);

    const tool = proposeUpdateDataTool(testSubId);

  const result = await (tool as any).execute({ nlRequest: 'Change name to New', mode: 'propose', context: { sobject: 'Account', recordId: '001' } } as any);

    expect(result).toEqual(mockResponse);

    const expectedUrl = `${baseUrl}/api/salesforce/propose?sub=${encodeURIComponent(testSubId)}`;
    expect(mockFetch).toHaveBeenCalledWith(expectedUrl, expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nlRequest: 'Change name to New', context: { sobject: 'Account', recordId: '001' } })
    }));
  });

  it('should reject when subId is empty', async () => {
    const tool = proposeUpdateDataTool('');
  await expect((tool as any).execute({ nlRequest: 'x', mode: 'propose' } as any)).rejects.toThrow('subId is required');
  });

  it('should require nlRequest in propose mode', async () => {
    const tool = proposeUpdateDataTool(testSubId);
  await expect((tool as any).execute({ mode: 'propose' } as any)).rejects.toThrow('nlRequest is required for propose mode');
  });

  it('should throw when API responds with non-ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'bad things' })
    } as any);

    const tool = proposeUpdateDataTool(testSubId);
  await expect((tool as any).execute({ nlRequest: 'Do it', mode: 'propose' } as any)).rejects.toThrow('Failed to generate proposal: bad things');
  });
});

/*
 * === proposeUpdateDataTool.test.ts ===
 * Updated: 2025-09-10 00:00
 * Summary: Unit tests for proposeUpdateDataTool
 */
