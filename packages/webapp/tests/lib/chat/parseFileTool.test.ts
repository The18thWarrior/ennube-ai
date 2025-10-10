// === parseFileTool.test.ts ===
// Tests for parseFileTool: validates single-shot extraction, chunked uploads, and error handling

jest.mock('@/lib/chat/helper', () => ({ getBaseUrl: jest.fn() }));
jest.mock('@/lib/external', () => ({ createDocReaderClient: jest.fn() }));

const { parseFileTool } = require('@/lib/chat/parseFileTool');

describe('parseFileTool', () => {
  let mockGetBase: jest.Mock;
  let mockCreateClient: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const helper = require('@/lib/chat/helper');
    const external = require('@/lib/external');
    mockGetBase = helper.getBaseUrl;
    mockCreateClient = external.createDocReaderClient;
    mockGetBase.mockResolvedValue('https://doc-reader.example.com');
  });

  it('returns final text for small payloads via extractDocx', async () => {
    const tool = parseFileTool('customer-001');
    const mockClient = {
      extractDocx: jest.fn().mockResolvedValue({ text: 'analysis text' }),
      uploadChunk: jest.fn(),
      processChunks: jest.fn(),
    };
    mockCreateClient.mockReturnValue(mockClient);

    const payload = Buffer.from('hello world').toString('base64');
    const result = await tool.execute({ base64: payload, fileName: 'hello.txt', fileType: 'text/plain' });

    expect(result).toBe('analysis text');
    expect(mockClient.extractDocx).toHaveBeenCalledWith({
      base64: payload,
      fileName: 'hello.txt',
      fileType: 'text/plain',
    });
    expect(mockCreateClient).toHaveBeenCalledWith({ baseUrl: 'https://doc-reader.example.com' });
    expect(mockClient.uploadChunk).not.toHaveBeenCalled();
    expect(mockClient.processChunks).not.toHaveBeenCalled();
  });

  it('uploads chunks for large payloads and returns metadata analysis', async () => {
    const tool = parseFileTool();
    const largeBuffer = Buffer.alloc(4 * 1024 * 1024, 'a');
    const largeBase64 = largeBuffer.toString('base64');

    const uploadChunk = jest.fn().mockResolvedValue({ success: true });
    const processChunks = jest.fn().mockResolvedValue({ metadata: { analysis: 'chunk analysis text' } });
    const extractDocx = jest.fn();

    mockCreateClient.mockReturnValue({ extractDocx, uploadChunk, processChunks });

    const result = await tool.execute({ base64: largeBase64, fileName: 'large.pdf', fileType: 'application/pdf' });

    expect(result).toBe('chunk analysis text');
    expect(extractDocx).not.toHaveBeenCalled();
    expect(uploadChunk).toHaveBeenCalledTimes(2);
    expect(processChunks).toHaveBeenCalledTimes(1);

    const firstCallArgs = uploadChunk.mock.calls[0][0];
    expect(firstCallArgs.totalChunks).toBeGreaterThan(1);
    expect(typeof firstCallArgs.sessionId).toBe('string');
    expect(firstCallArgs.sessionId.startsWith('pf_')).toBe(true);
  });

  it('handles File objects correctly', async () => {
    const tool = parseFileTool('customer-001');
    const mockClient = {
      extractDocx: jest.fn().mockResolvedValue({ text: 'file analysis text' }),
      uploadChunk: jest.fn(),
      processChunks: jest.fn(),
    };
    mockCreateClient.mockReturnValue(mockClient);

    // Mock File object
    const mockFile = {
      name: 'test.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('file content')),
    };

    const result = await tool.execute({ file: mockFile as any });

    expect(result).toBe('file analysis text');
    expect(mockFile.arrayBuffer).toHaveBeenCalled();
    expect(mockClient.extractDocx).toHaveBeenCalledWith({
      base64: Buffer.from('file content').toString('base64'),
      fileName: 'test.docx',
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  });

  it('throws error if neither base64 nor file is provided', async () => {
    const tool = parseFileTool();
    await expect(tool.execute({})).rejects.toThrow(/Either base64 or file must be provided/);
  });

  it('throws a descriptive error for invalid base64 payloads', async () => {
    const tool = parseFileTool();
    await expect(tool.execute({ base64: 'not-base64!' })).rejects.toThrow(/Invalid base64 payload/);
  });
});