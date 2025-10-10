import { createDocReaderClient, ExtractResponse, UploadChunkResponse, CleanupResult } from '../lib/external/docReaderClient';

describe('docReaderClient', () => {
  const origFetch = (global as any).fetch;

  afterEach(() => {
    (global as any).fetch = origFetch;
    jest.resetAllMocks();
  });

  it('extractDocx - success', async () => {
    const mockBody: ExtractResponse = { status: 200, text: 'hello world', pages: 1 };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify(mockBody),
    });

    const client = createDocReaderClient({ baseUrl: 'https://example.com' });
    const res = await client.extractDocx({ base64: 'Zm9v' });
    expect(res).toEqual(mockBody);
    expect((global as any).fetch).toHaveBeenCalled();
  });

  it('manualCleanup - success', async () => {
    const mockBody: CleanupResult = { success: true, deletedSessions: 2, timestamp: new Date().toISOString() };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify(mockBody),
    });

    const client = createDocReaderClient();
    const res = await client.manualCleanup();
    expect(res).toEqual(mockBody);
  });

  it('processChunks - success', async () => {
    const mockBody: ExtractResponse = { status: 200, text: 'assembled text', pages: 3 };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify(mockBody),
    });

    const client = createDocReaderClient();
    const res = await client.processChunks('session-123');
    expect(res).toEqual(mockBody);
  });

  it('uploadChunk - success', async () => {
    const mockBody: UploadChunkResponse = {
      success: true,
      chunkIndex: 0,
      receivedChunks: 1,
      totalChunks: 1,
      isComplete: true,
      sessionId: 's1',
    };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify(mockBody),
    });

    const client = createDocReaderClient();
    const res = await client.uploadChunk({ sessionId: 's1', chunk: 'abc', chunkIndex: 0, totalChunks: 1 });
    expect(res).toEqual(mockBody);
  });

  it('deleteSession - success without sessionId', async () => {
    const mockBody = { success: true, message: 'deleted expired' };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify(mockBody),
    });

    const client = createDocReaderClient();
    const res = await client.deleteSession();
    expect(res).toEqual(mockBody);
  });

  it('health - success', async () => {
    const mockBody = { status: 'ok', timestamp: new Date().toISOString() };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify(mockBody),
    });

    const client = createDocReaderClient();
    const res = await client.health();
    expect(res).toEqual(mockBody);
  });

  it('extractDocx - server error response throws', async () => {
    const mockBody = { error: 'invalid base64' };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => JSON.stringify(mockBody),
    });

    const client = createDocReaderClient();
    await expect(client.extractDocx({ base64: 'bad' })).rejects.toMatchObject({
      message: mockBody.error,
      status: 400,
    });
  });

  it('extractDocx - validation error when missing base64', async () => {
    const client = createDocReaderClient();
    // @ts-ignore - deliberately pass bad payload
    await expect(client.extractDocx({})).rejects.toThrow('base64 is required in payload');
  });
});
