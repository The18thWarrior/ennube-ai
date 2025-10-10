/**
 * tests/createCustomerProfile.test.ts
 * Tests for lib/chat/internal/createCustomerProfile.ts
 */

// Mock helper and n8n utils before importing the tool to avoid heavy imports
jest.mock('@/lib/chat/helper', () => ({ getBaseUrl: jest.fn(() => 'http://localhost:3000') }));
jest.mock('@/lib/n8n/utils', () => ({ buildCalloutWithHeader: jest.fn() }));

import { createCustomerProfileTool } from '@/lib/chat/internal/createCustomerProfile';
import { buildCalloutWithHeader } from '@/lib/n8n/utils';

describe('createCustomerProfileTool', () => {
  const userId = 'user-123';

  it('exposes an execute function and inputSchema', () => {
    const tool = createCustomerProfileTool(userId) as any;
    expect(tool).toBeDefined();
    expect(typeof tool.execute).toBe('function');
    expect(tool.inputSchema).toBeDefined();
  });

  it('validates input schema (happy path)', () => {
    const tool = createCustomerProfileTool(userId) as any;
    const valid = {
      customerProfileName: 'Enterprise Tech',
      commonIndustries: 'Technology',
      frequentlyPurchasedProducts: 'SaaS Suite',
      geographicRegions: 'North America',
      averageDaysToClose: 30,
      active: true
    };
    expect(() => tool.inputSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid input schema', () => {
    const tool = createCustomerProfileTool(userId) as any;
    const invalid = {
      // missing required fields
      customerProfileName: '',
      averageDaysToClose: -1,
      active: true
    };
    const result = tool.inputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('execute returns success when API responds with success', async () => {
    const tool = createCustomerProfileTool(userId) as any;
    const payload = {
      customerProfileName: 'Enterprise Tech',
      commonIndustries: 'Technology',
      frequentlyPurchasedProducts: 'SaaS Suite',
      geographicRegions: 'North America',
      averageDaysToClose: 30,
      active: true
    };

    (buildCalloutWithHeader as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, id: 'cp-1' })
    });

    const res = await tool.execute(payload);
    expect(res).toEqual({ success: true, id: 'cp-1' });
    expect(buildCalloutWithHeader).toHaveBeenCalled();
  });

  it('execute returns API error when response not ok', async () => {
    const tool = createCustomerProfileTool(userId) as any;
    const payload = {
      customerProfileName: 'Enterprise Tech',
      commonIndustries: 'Technology',
      frequentlyPurchasedProducts: 'SaaS Suite',
      geographicRegions: 'North America',
      averageDaysToClose: 30,
      active: true
    };

    (buildCalloutWithHeader as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

    const res = await tool.execute(payload);
    expect(res).toEqual({ success: false, message: 'API error: 500' });
  });

  it('execute returns failure when API responds with success=false', async () => {
    const tool = createCustomerProfileTool(userId) as any;
    const payload = {
      customerProfileName: 'Enterprise Tech',
      commonIndustries: 'Technology',
      frequentlyPurchasedProducts: 'SaaS Suite',
      geographicRegions: 'North America',
      averageDaysToClose: 30,
      active: true
    };

    (buildCalloutWithHeader as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, message: 'creation failed' })
    });

    const res = await tool.execute(payload);
    expect(res).toEqual({ success: false, message: 'creation failed' });
  });

  it('execute catches thrown errors and returns fetch error', async () => {
    const tool = createCustomerProfileTool(userId) as any;
    const payload = {
      customerProfileName: 'Enterprise Tech',
      commonIndustries: 'Technology',
      frequentlyPurchasedProducts: 'SaaS Suite',
      geographicRegions: 'North America',
      averageDaysToClose: 30,
      active: true
    };

    (buildCalloutWithHeader as jest.Mock).mockImplementation(() => { throw new Error('network fail'); });

    const res = await tool.execute(payload);
    expect(res.success).toBe(false);
    expect(typeof res.message).toBe('string');
    expect((res.message as string).toLowerCase()).toContain('network fail');
  });
});
