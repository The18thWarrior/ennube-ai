/**
 * tests/helper.test.ts
 *
 * Tests for the helper module in lib/chat/helper.ts
 */

// Mock the system prompt modules so getPrompt returns deterministic values
jest.mock('@/lib/prompts/data-steward-system-prompt', () => ({ DATA_STEWARD_SYSTEM_PROMPT: 'DATA_STEWARD_PROMPT' }));
jest.mock('@/lib/prompts/prospect-finder-system-prompt', () => ({ PROSPECT_FINDER_SYSTEM_PROMPT: 'PROSPECT_PROMPT' }));
jest.mock('@/lib/prompts/contract-reader-system-prompt', () => ({ CONTRACT_READER_SYSTEM_PROMPT: 'CONTRACT_PROMPT' }));

// Provide a controllable mock for next/headers
const mockGetHost: jest.Mock<string | null, [string]> = jest.fn((key: string) => (key === 'host' ? 'localhost:3000' : null));
jest.mock('next/headers', () => ({
  headers: () => ({
    get: (k: string) => mockGetHost(k),
  }),
}));

// Mock internal chat tool modules so importing helper won't pull in heavy deps
jest.mock('@/lib/chat/callWorkflowTool', () => ({ getWorkflowTool: jest.fn(() => jest.fn()) }));
jest.mock('@/lib/chat/getCountTool', () => ({ getCountTool: jest.fn(() => jest.fn()) }));
jest.mock('@/lib/chat/postgres/getDataTool', () => ({ getPostgresDataTool: jest.fn(() => jest.fn()) }));
jest.mock('@/lib/chat/sfdc/getCredentialsTool', () => ({ getCredentialsTool: jest.fn(() => jest.fn()) }));
jest.mock('@/lib/chat/sfdc/getDataTool', () => ({ getSFDCDataTool: jest.fn(() => jest.fn()) }));
jest.mock('@/lib/chat/sfdc/generateQueryTool', () => ({ generateQueryTool: jest.fn(() => jest.fn()) }));
jest.mock('@/lib/chat/sfdc/proposeUpdateDataTool', () => ({ proposeUpdateDataTool: jest.fn(() => jest.fn()) }));
jest.mock('@/lib/chat/internal/getCustomerProfiles', () => ({ getCustomerProfilesTool: jest.fn(() => jest.fn()) }));
jest.mock('@/lib/chat/internal/createCustomerProfile', () => ({ createCustomerProfileTool: jest.fn(() => jest.fn()) }));
jest.mock('@/lib/chat/internal/updateCustomerProfile', () => ({ updateCustomerProfileTool: jest.fn(() => jest.fn()) }));
jest.mock('@/lib/db/customer-profile-storage', () => ({ updateCustomerProfile: jest.fn() }));

import { getPrompt, getBaseUrl } from '@/lib/chat/helper';

describe('lib/chat/helper', () => {
  describe('getPrompt', () => {
    it('returns the data-steward system prompt', () => {
      expect(getPrompt('data-steward')).toBe('DATA_STEWARD_PROMPT');
    });

    it('returns the contract-reader system prompt', () => {
      expect(getPrompt('contract-reader')).toBe('CONTRACT_PROMPT');
    });

    it('returns the prospect-finder system prompt', () => {
      expect(getPrompt('prospect-finder')).toBe('PROSPECT_PROMPT');
    });
  });

  describe('getBaseUrl', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.resetModules();
      // reset keys into process.env without replacing the object reference
      Object.assign(process.env, OLD_ENV);
      mockGetHost.mockClear();
      mockGetHost.mockImplementation((k: string) => (k === 'host' ? 'localhost:3000' : null));
    });

    afterAll(() => {
      Object.assign(process.env, OLD_ENV);
    });

    it('returns http://host when NODE_ENV is not production', async () => {
      (process.env as any).NODE_ENV = 'development';
      mockGetHost.mockImplementation((k: string) => (k === 'host' ? 'localhost:3000' : null));
      const url = await getBaseUrl();
      expect(url).toBe('http://localhost:3000');
    });

    it('returns https://host when NODE_ENV is production', async () => {
      (process.env as any).NODE_ENV = 'production';
      mockGetHost.mockImplementation((k: string) => (k === 'host' ? 'example.com' : null));
      const url = await getBaseUrl();
      expect(url).toBe('https://example.com');
    });
  });
});
