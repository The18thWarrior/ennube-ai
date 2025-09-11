/**
 * getDataTool.test.ts
 * Created: 2025-09-10
 * Purpose: Unit tests for the getPostgresDataTool() wrapper in lib/chat/postgres/getDataTool.ts
 *
 * Tests cover:
 *  - error when subId is missing
 *  - error when sql is missing
 *  - successful fetch path
 *  - failed fetch path (res.ok === false)
 */

// Mock the helper module used by the tool before importing the module under test
jest.mock('@/lib/chat/helper', () => ({
  getBaseUrl: jest.fn(),
}));

import { getBaseUrl } from '@/lib/chat/helper';
import { getPostgresDataTool } from '@/lib/chat/postgres/getDataTool';

const mockedGetBaseUrl = getBaseUrl as jest.MockedFunction<typeof getBaseUrl>;

describe('getPostgresDataTool', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns error when subId is missing', async () => {
    const tool: any = getPostgresDataTool('');
    const result = await tool.execute({ sql: 'SELECT 1' } as any, undefined);
    expect(result).toEqual({ error: 'subId is required' });
  });

  test('returns error when sql is missing', async () => {
    const tool: any = getPostgresDataTool('sub-123');
    const result = await tool.execute({ sql: '' } as any, undefined);
    expect(result).toEqual({ error: 'SQL query is required' });
  });

  test('successful fetch returns parsed json', async () => {
    mockedGetBaseUrl.mockResolvedValue('http://localhost');

    const fakeResponse = {
      ok: true,
      json: async () => ({ rows: [{ id: 1, name: 'Alice' }] }),
    } as any;

    (global as any).fetch = jest.fn().mockResolvedValue(fakeResponse);

  const tool: any = getPostgresDataTool('sub-123');
    const payload = { sql: 'SELECT * FROM users WHERE id = $1', params: [1] };

  const result = await tool.execute(payload as any, undefined);

    expect((global as any).fetch).toHaveBeenCalled();
    expect(result).toEqual({ rows: [{ id: 1, name: 'Alice' }] });
  });

  test('fetch failure returns error with details', async () => {
    mockedGetBaseUrl.mockResolvedValue('http://localhost');

    const fakeResponse = {
      ok: false,
      text: async () => 'internal server error',
    } as any;

    (global as any).fetch = jest.fn().mockResolvedValue(fakeResponse);

  const tool: any = getPostgresDataTool('sub-123');
    const payload = { sql: 'SELECT * FROM users' };

  const result = await tool.execute(payload as any, undefined);

    expect(result).toHaveProperty('error', 'Failed to fetch data');
    expect(result).toHaveProperty('details', 'internal server error');
  });
});
