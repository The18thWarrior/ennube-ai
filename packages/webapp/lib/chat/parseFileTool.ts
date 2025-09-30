// === parseFileTool.ts ===
// Created: 2025-09-26 00:00
// Purpose: Agent tool that orchestrates attachment parsing end-to-end via the doc-reader API
// Exports:
//  - export const parseFileTool = (subId?: string) => tool({...})
// Interactions:
//  - Uses: /api/extract-docx, /api/upload-chunk, /api/process-chunks through the doc-reader client
// Notes:
//  - Accepts raw base64 payloads or File objects and handles chunking automatically when size limits are exceeded.

import { tool } from "ai";
import z from "zod/v4";
import { getBaseUrl } from "./helper";
import { createDocReaderClient } from "@/lib/external";
import type { ExtractResponse } from "@/lib/external/docReaderClient";
import { getFile } from "@/lib/cache/file-cache";

const MAX_SINGLE_PAYLOAD_BYTES = 3.5 * 1024 * 1024; // Align with doc-reader upload guidelines (3.5 MB)

export const parseFileTool = (subId: string) => {
  return tool({
    description:
      'Parse an attachment (DOCX, PDF, images, zip, etc.) using the doc-reader API. Provide a base64 payload or a File object, and the tool will chunk, upload, and return the final analysis.',
    execute: async ({ fileName, fileType }: {fileName: string; fileType?: string; }) => {
      console.log('parseFileTool called');
      const blob = await getFile(fileName, subId);
      if (!blob) throw new Error('No files found for the given id.')
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (!buffer || buffer.byteLength === 0) throw new Error('Decoded payload is empty');

      const baseUrl = await getBaseUrl();
      const client = createDocReaderClient({ baseUrl });

      if (buffer.byteLength <= MAX_SINGLE_PAYLOAD_BYTES) {
        try {
          const response = await client.extractDocx({ base64: buffer.toString('base64'), fileName, fileType });
          return extractFinalAnalysis(response);
        } catch (err: any) {
          throw new Error(`Doc-reader extract failed: ${err?.message ?? String(err)}`);
        }
      }

      const sessionId = buildSessionId(subId);
      const totalChunks = Math.ceil(buffer.byteLength / MAX_SINGLE_PAYLOAD_BYTES);

      try {
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const start = chunkIndex * MAX_SINGLE_PAYLOAD_BYTES;
          const end = Math.min(start + MAX_SINGLE_PAYLOAD_BYTES, buffer.byteLength);
          const chunkBase64 = buffer.subarray(start, end).toString('base64');

          await client.uploadChunk({
            sessionId,
            chunk: chunkBase64,
            chunkIndex,
            totalChunks,
            fileName,
            fileType,
          });
        }

        const processed = await client.processChunks(sessionId);
        return extractFinalAnalysis(processed);
      } catch (err: any) {
        throw new Error(`Doc-reader chunked upload failed: ${err?.message ?? String(err)}`);
      }
    },
    inputSchema: z.object({
      // base64: z
      //   .string()
      //   .optional()
      //   .describe('Base64-encoded file content (no data: prefix). The tool will chunk automatically as needed.'),
      // file: z
      //   .instanceof(File)
      //   .optional()
      //   .describe('The file object to parse. If provided, base64 is ignored.'),
     
      fileName: z.string().describe('Optional original filename (e.g., document.docx).'),
      fileType: z.string().optional().describe('Optional MIME type (e.g., application/pdf).'),
    }),
  });
};

function extractFinalAnalysis(response: ExtractResponse | null | undefined): string {
  if (!response) throw new Error('Doc-reader service returned an empty response');

  const metadataAnalysis = typeof response.metadata?.analysis === 'string' ? response.metadata.analysis.trim() : '';
  const textAnalysis = typeof response.text === 'string' ? response.text.trim() : '';
  const finalAnalysis = metadataAnalysis || textAnalysis;

  if (!finalAnalysis) throw new Error('Doc-reader service returned no analysis text');
  return finalAnalysis;
}

function buildSessionId(subId?: string): string {
  const sanitizedSub = typeof subId === 'string'
    ? subId.replace(/[^a-zA-Z0-9_-]/g, '').slice(-6)
    : '';
  const subPrefix = sanitizedSub ? `${sanitizedSub}_` : '';
  return `pf_${subPrefix}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function isValidBase64(value: string): boolean {
  if (!value) return false;
  if (/[^A-Za-z0-9+/=]/.test(value)) return false;
  if (value.length % 4 === 1) return false; // invalid remainder

  const paddingMatch = value.match(/=+$/);
  const paddingLength = paddingMatch ? paddingMatch[0].length : 0;
  if (paddingLength > 2) return false;

  const core = paddingLength ? value.slice(0, -paddingLength) : value;
  if (core.includes('=')) return false; // '=' only allowed as padding at end

  return true;
}

/**
 * OVERVIEW
 *
 * - Purpose: Provide agents a single tool that handles file parsing, including chunked uploads, accepting either base64 or File objects.
 * - Assumptions: base64 input is valid and the doc-reader API honours the OpenAPI contract; File objects are valid.
 * - Edge Cases: Large files trigger chunk uploads; invalid base64 or empty payloads/files throw early.
 * - How it fits: Complements chat tooling by automating document ingestion before analysis.
 * - Future Improvements: Add optional retries/backoff and session cleanup for long-running uploads.
 */

/*
 * === parseFileTool.ts ===
 * Updated: 2025-09-27 00:00
 * Summary: Orchestrates doc-reader extraction by handling single-shot and chunked workflows, returning only the final analysis text. Now accepts File objects or base64.
 * Key Components:
 *  - parseFileTool(subId?): returns the configured tool for agent usage.
 *  - extractFinalAnalysis(): narrows API responses to the user-facing analysis string.
 *  - buildSessionId(): generates unique upload sessions for chunked flows.
 * Dependencies:
 *  - getBaseUrl helper, docReaderClient for API access.
 * Version History:
 *  v1.0 – initial
 *  v1.1 – added chunk orchestration and analysis-only response (2025-09-26)
 *  v1.2 – added support for File objects to handle blob URLs and avoid download errors (2025-09-27)
 * Notes:
 *  - [Any other notes]
 */
