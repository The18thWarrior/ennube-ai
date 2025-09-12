// === docReaderClient.ts ===
// Created: 2025-09-11 00:00
// Purpose: Typed client for the public doc-reader API (wraps endpoints described in doc-reader.yml)
// Exports:
//  - createDocReaderClient(baseUrl?: string)
// Notes:
//  - Uses global fetch. Provide a baseUrl or the default production URL will be used.

/**
 * OVERVIEW
 *
 * - Purpose: Provide a small, typed wrapper around the public doc-reader API endpoints
 *   so other parts of the app can call them with proper types and simple error handling.
 * - Assumptions: Server follows the shapes in the included OpenAPI spec. fetch is available
 *   (Node 18+ / modern browsers). The client does not attempt to refresh auth tokens.
 * - Edge Cases: Non-JSON responses are handled gracefully; HTTP errors throw a structured Error
 *   with details parsed from the body when possible.
 * - Future Improvements: Add retry/backoff, request cancellation, and optional logging.
 */

export type AdobeAuthSuccess = {
  success: boolean;
  message?: string;
  tokenReceived?: boolean;
  tokenLength?: number;
  expiresIn?: number;
  tokenType?: string;
};

export type ErrorResponse = {
  error: string;
  details?: Record<string, any>;
};

export type ExtractRequest = {
  base64: string | string[];
  fileName?: string;
  fileType?: string;
};

export type ExtractResponse = {
  status?: number;
  text?: string;
  pages?: number;
  metadata?: Record<string, any>;
};

export type UploadChunkRequest = {
  sessionId: string;
  chunk: string;
  chunkIndex: number;
  totalChunks: number;
  fileName?: string;
  fileType?: string;
};

export type UploadChunkResponse = {
  success: boolean;
  chunkIndex: number;
  receivedChunks: number;
  totalChunks: number;
  isComplete: boolean;
  sessionId: string;
  traceId?: string;
};

export type CleanupResult = {
  success: boolean;
  deletedSessions?: number;
  currentStats?: Record<string, any>;
  stats?: Record<string, any>;
  timestamp?: string;
  message?: string;
  traceId?: string;
};

export type HealthResponse = {
  status: string;
  timestamp: string;
  database?: string;
  traceId?: string;
};

type ClientOptions = {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number; // not implemented, placeholder for future
};

function buildUrl(base: string, path: string) {
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
}

async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    return null;
  }
}

/**
 * Factory that returns a client with methods for each public endpoint.
 */
export function createDocReaderClient(opts: ClientOptions = {}) {
  const baseUrl = opts.baseUrl ?? process.env.DOC_READER_BASE_URL ?? 'https://agent-doc-tool.vercel.app';
  const defaultHeaders = opts.defaultHeaders ?? { 'Content-Type': 'application/json' };

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = buildUrl(baseUrl, path);
    const headers = { ...(init.headers as Record<string, string> || {}), ...defaultHeaders };
    const res = await fetch(url, { ...init, headers });
    const json = await parseJsonSafe<any>(res);
    if (!res.ok) {
      const err: Error & { status?: number; details?: any } = new Error(
        json?.error ?? json?.message ?? `HTTP ${res.status} ${res.statusText}`
      );
      err.status = res.status;
      err.details = json ?? textOrNull(res);
      throw err;
    }
    return (json ?? null) as T;
  }

  // helper for when body might be non-json and we already consumed it; keep a fallback
  function textOrNull(res: Response) {
    // can't re-read body here; return null since parseJsonSafe consumed it earlier
    return null;
  }

  return {
    baseUrl,

    // async adobeAuth(): Promise<AdobeAuthSuccess> {
    //   return request<AdobeAuthSuccess>('/api/adobe-auth', { method: 'POST' });
    // },

    // async cleanupCron(bearerToken: string): Promise<CleanupResult> {
    //   if (!bearerToken) throw new Error('bearerToken is required for cleanupCron');
    //   return request<CleanupResult>('/api/cleanup', {
    //     method: 'POST',
    //     headers: { Authorization: `Bearer ${bearerToken}` },
    //   });
    // },

    async manualCleanup(): Promise<CleanupResult> {
      return request<CleanupResult>('/api/cleanup', { method: 'GET' });
    },

    async extractDocx(payload: ExtractRequest): Promise<ExtractResponse> {
      if (!payload || !payload.base64) throw new Error('base64 is required in payload');
      return request<ExtractResponse>('/api/extract-docx', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async health(): Promise<HealthResponse> {
      return request<HealthResponse>('/api/health', { method: 'GET' });
    },

    // async initDb(bearerToken?: string): Promise<{ success: boolean; message?: string }> {
    //   const headers: Record<string, string> = {};
    //   if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;
    //   return request<{ success: boolean; message?: string }>('/api/init-db', {
    //     method: 'POST',
    //     headers,
    //   });
    // },

    // async manualInitDb(): Promise<{ success: boolean; message?: string }> {
    //   return request<{ success: boolean; message?: string }>('/api/init-db', { method: 'GET' });
    // },

    async processChunks(sessionId: string): Promise<ExtractResponse> {
      if (!sessionId) throw new Error('sessionId is required');
      return request<ExtractResponse>('/api/process-chunks', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });
    },

    async uploadChunk(req: UploadChunkRequest): Promise<UploadChunkResponse> {
      if (!req || !req.sessionId || req.chunkIndex == null || req.totalChunks == null || !req.chunk) {
        throw new Error('sessionId, chunk, chunkIndex and totalChunks are required');
      }
      return request<UploadChunkResponse>('/api/upload-chunk', {
        method: 'POST',
        body: JSON.stringify(req),
      });
    },

    async deleteSession(sessionId?: string): Promise<{ success: boolean; message?: string; traceId?: string }> {
      const body = sessionId ? JSON.stringify({ sessionId }) : undefined;
      return request<{ success: boolean; message?: string; traceId?: string }>('/api/upload-chunk', {
        method: 'DELETE',
        body,
      });
    },
  } as const;
}

/*
 * === docReaderClient.ts ===
 * Updated: 2025-09-11 00:00
 * Summary: Small typed client for doc-reader public API
 * Key Components:
 *  - createDocReaderClient: returns methods for endpoints
 * Dependencies:
 *  - global fetch
 * Version History:
 *  v1.0 – initial
 */
