// === getFileTool.test.ts ===
// Tests for getFileTool: small file, large file (chunking), SF fetch errors, missing creds

// Keep a single global fetch mock (so references stay stable across modules)
global.fetch = jest.fn();

// Register mocks before importing the module under test
jest.mock('@/lib/db/salesforce-storage', () => ({ getSalesforceCredentialsBySub: jest.fn() }));
jest.mock('@/lib/chat/helper', () => ({ getBaseUrl: jest.fn() }));
jest.mock('@/lib/external', () => ({ createDocReaderClient: jest.fn() }));

const { getFileTool } = require('@/lib/chat/sfdc/getFileTool');

describe('getFileTool', () => {
  const subId = 'sub-123';
  const tool = getFileTool(subId);

  let mockGetCreds: jest.Mock;
  let mockGetBase: jest.Mock;
  let mockCreateClient: jest.Mock;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    const storage = require('@/lib/db/salesforce-storage');
    const helper = require('@/lib/chat/helper');
    const external = require('@/lib/external');
    mockGetCreds = storage.getSalesforceCredentialsBySub;
    mockGetBase = helper.getBaseUrl;
    mockCreateClient = external.createDocReaderClient;
  });

  it('extracts text for small file (single-shot)', async () => {
    mockGetCreds.mockResolvedValue({ accessToken: 'a', instanceUrl: 'https://i', refreshToken: 'r', userInfo: { id: 'u' } } as any);
    mockGetBase.mockResolvedValue('https://api.example.com');

    const smallBuffer = Buffer.from('hello');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: async () => smallBuffer.buffer.slice(smallBuffer.byteOffset, smallBuffer.byteOffset + smallBuffer.byteLength),
      headers: { get: (k: string) => (k === 'content-type' ? 'application/pdf' : null) }
    } as unknown as Response);

    const mockClient = { extractDocx: jest.fn().mockResolvedValue({ text: 'extracted small' }) };
    mockCreateClient.mockReturnValue(mockClient as any);

    const res = await tool.execute({ contentVersionId: 'cv1', relatedId: 'r1' });
    expect(res).toEqual('extracted small');
    expect(mockClient.extractDocx).toHaveBeenCalledTimes(1);
  });

  it('uploads chunks for large file and returns extracted text', async () => {
    mockGetCreds.mockResolvedValue({ accessToken: 'a', instanceUrl: 'https://i', refreshToken: 'r', userInfo: { id: 'u' } } as any);
    mockGetBase.mockResolvedValue('https://api.example.com');

    const largeSize = 4 * 1024 * 1024; // 4MB
    const largeBuffer = Buffer.alloc(largeSize, 'a');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: async () => largeBuffer.buffer.slice(largeBuffer.byteOffset, largeBuffer.byteOffset + largeBuffer.byteLength),
      headers: { get: (k: string) => (k === 'content-type' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : null) }
    } as unknown as Response);

    const mockClient = {
      uploadChunk: jest.fn().mockResolvedValue({}),
      processChunks: jest.fn().mockResolvedValue({ text: 'extracted large' })
    };
    mockCreateClient.mockReturnValue(mockClient as any);

    const res = await tool.execute({ contentVersionId: 'cv-big', relatedId: 'r1' });
    expect(res).toEqual('extracted large');
    expect(mockClient.uploadChunk).toHaveBeenCalled();
    expect(mockClient.processChunks).toHaveBeenCalled();
  });

  it('throws an error when Salesforce fetch returns non-ok', async () => {
    mockGetCreds.mockResolvedValue({ accessToken: 'a', instanceUrl: 'https://i', refreshToken: 'r', userInfo: { id: 'u' } } as any);
    mockGetBase.mockResolvedValue('https://api.example.com');

    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found', json: async () => ({ error: 'not found' }) } as any);

    await expect(tool.execute({ contentVersionId: 'cv-missing', relatedId: 'r1' })).rejects.toThrow(/Salesforce file endpoint returned 404/);
  });

  it('throws when credentials missing', async () => {
    mockGetCreds.mockResolvedValue(null as any);
    await expect(tool.execute({ contentVersionId: 'cv1', relatedId: 'r1' })).rejects.toThrow(/Failed to fetch Salesforce credentials/);
  });
});

