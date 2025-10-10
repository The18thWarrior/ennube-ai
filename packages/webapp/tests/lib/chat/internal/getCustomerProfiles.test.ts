/**
 * tests/getCustomerProfiles.test.ts
 * Tests for lib/chat/internal/getCustomerProfiles.ts
 */

// Mock helper and n8n utils before importing the tool to avoid heavy imports
jest.mock('@/lib/chat/helper', () => ({ getBaseUrl: jest.fn(() => 'http://localhost:3000') }));
jest.mock('@/lib/n8n/utils', () => ({ buildCalloutWithHeader: jest.fn() }));

import { getCustomerProfilesTool } from '@/lib/chat/internal/getCustomerProfiles';
import { buildCalloutWithHeader } from '@/lib/n8n/utils';

describe('getCustomerProfilesTool', () => {
  const userId = 'user-abc';

  it('exposes execute and inputSchema', () => {
    const tool = getCustomerProfilesTool(userId) as any;
    expect(tool).toBeDefined();
    expect(typeof tool.execute).toBe('function');
    expect(tool.inputSchema).toBeDefined();
  });

  it('returns unauthorized when userId is empty', async () => {
    const tool = getCustomerProfilesTool('') as any;
    const res = await tool.execute({});
    expect(res).toEqual({ success: false, message: 'Unauthorized: userId is required' });
  });

  it('returns profiles when API responds with array', async () => {
    const tool = getCustomerProfilesTool(userId) as any;
    const profiles = [{ id: 'cp1' }, { id: 'cp2' }];
    (buildCalloutWithHeader as jest.Mock).mockResolvedValue({ ok: true, json: async () => profiles });

    const res = await tool.execute({});
    expect(res).toEqual({ profiles });
    expect(buildCalloutWithHeader).toHaveBeenCalled();
  });

  it('returns empty profiles with message when API returns empty array', async () => {
    const tool = getCustomerProfilesTool(userId) as any;
    (buildCalloutWithHeader as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] });

    const res = await tool.execute({});
    expect(res).toEqual({ profiles: [], message: 'No customer profiles found for this user.' });
  });

  it('returns API error when response not ok', async () => {
    const tool = getCustomerProfilesTool(userId) as any;
    (buildCalloutWithHeader as jest.Mock).mockResolvedValue({ ok: false, status: 500, text: async () => 'err' });

    const res = await tool.execute({});
    expect(res).toEqual({ success: false, message: 'API error: 500' });
  });

  it('catches thrown errors and returns fetch error', async () => {
    const tool = getCustomerProfilesTool(userId) as any;
    (buildCalloutWithHeader as jest.Mock).mockImplementation(() => { throw new Error('boom'); });

    const res = await tool.execute({});
    expect(res.success).toBe(false);
    expect(String(res.message)).toContain('boom');
  });
});
