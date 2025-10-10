/**
 * tests/updateCustomerProfile.test.ts
 * Tests for lib/chat/internal/updateCustomerProfile.ts
 */

// Mock helper and n8n utils before importing the tool to avoid heavy imports
jest.mock('@/lib/chat/helper', () => ({ getBaseUrl: jest.fn(() => 'http://localhost:3000') }));
jest.mock('@/lib/n8n/utils', () => ({ buildCalloutWithHeader: jest.fn() }));

import { updateCustomerProfileTool } from '@/lib/chat/internal/updateCustomerProfile';
import { buildCalloutWithHeader } from '@/lib/n8n/utils';

describe('updateCustomerProfileTool', () => {
  const userId = 'user-123';

  it('exposes an execute function and inputSchema', () => {
    const tool = updateCustomerProfileTool(userId) as any;
    expect(tool).toBeDefined();
    expect(typeof tool.execute).toBe('function');
    expect(tool.inputSchema).toBeDefined();
  });

  it('exposes an inputSchema object with parse function', () => {
    const tool = updateCustomerProfileTool(userId) as any;
    expect(tool.inputSchema).toBeDefined();
    // avoid calling parse directly (environment zod wrapper can be brittle in tests)
    expect(typeof tool.inputSchema.parse).toBe('function');
    expect(typeof tool.inputSchema.safeParse).toBe('function');
  });

  it('execute returns success when API responds with success', async () => {
    const tool = updateCustomerProfileTool(userId) as any;
    const payload = { id: 'cp-1', updates: { customerProfileName: 'Updated' } };

    (buildCalloutWithHeader as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });

    const res = await tool.execute(payload);
    expect(res).toEqual({ success: true });
    expect(buildCalloutWithHeader).toHaveBeenCalled();
  });

  it('execute returns API error when response not ok', async () => {
    const tool = updateCustomerProfileTool(userId) as any;
    const payload = { id: 'cp-1', updates: { customerProfileName: 'Updated' } };

    (buildCalloutWithHeader as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

    const res = await tool.execute(payload);
    expect(res).toEqual({ success: false, message: 'API error: 500' });
  });

  it('execute returns failure when API responds with success=false', async () => {
    const tool = updateCustomerProfileTool(userId) as any;
    const payload = { id: 'cp-1', updates: { customerProfileName: 'Updated' } };

    (buildCalloutWithHeader as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, message: 'update failed' })
    });

    const res = await tool.execute(payload);
    expect(res).toEqual({ success: false, message: 'update failed' });
  });

  it('execute catches thrown errors and returns fetch error', async () => {
    const tool = updateCustomerProfileTool(userId) as any;
    const payload = { id: 'cp-1', updates: { customerProfileName: 'Updated' } };

    (buildCalloutWithHeader as jest.Mock).mockImplementation(() => { throw new Error('network fail'); });

    const res = await tool.execute(payload);
    expect(res.success).toBe(false);
    expect(typeof res.message).toBe('string');
    expect((res.message as string).toLowerCase()).toContain('network fail');
  });

  it('returns unauthorized when userId is falsy', async () => {
    const tool = updateCustomerProfileTool('') as any;
    const payload = { id: 'cp-1', updates: { customerProfileName: 'Updated' } };

    const res = await tool.execute(payload);
    expect(res).toEqual({ success: false, message: 'Unauthorized: userId is required' });
  });
});
