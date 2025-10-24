// === getFileTool.ts ===
// Created: 2025-09-11 00:00
// Purpose: Tool to fetch a Salesforce file by ContentVersion id and related object id,
// convert to base64 and forward to doc-reader service (single-shot or chunked upload)

import { tool } from 'ai';
import z from 'zod/v4';
import { getBaseUrl } from '../helper';
import { getSalesforceCredentialsBySub, StoredSalesforceCredentials } from '@/lib/db/salesforce-storage';
import { createDocReaderClient } from '@/lib/external';

const MAX_BYTES = 1 * 1024 * 1024; // 3.5 MB

export const GetFileInputSchema = z.object({
  contentVersionId: z.string().min(1).describe('Salesforce ContentVersion id for the file'),
  relatedId: z.string().min(1).describe('Related Salesforce object id (where file is attached)'),
});

export const getFileTool = (subId: string) => {
  return tool({
    description: 'Fetch a file from Salesforce and extract text using the doc-reader service. Do not use this tool if you already have the file contents from a previous tool call. Do not call this if the file is directly uploaded by the user.',
    inputSchema: GetFileInputSchema,
    execute: async ({ contentVersionId, relatedId }: z.infer<typeof GetFileInputSchema>) => {
      if (!subId) throw new Error('subId is required for Salesforce authentication');
      if (!contentVersionId) throw new Error('contentVersionId is required');
      if (!relatedId) throw new Error('relatedId is required');

      // Confirm credentials exist
      const credentials: StoredSalesforceCredentials | null = await getSalesforceCredentialsBySub(subId);
      if (!credentials) throw new Error('Failed to fetch Salesforce credentials for the current user');

      const baseUrl = await getBaseUrl();
      const fileUrl = `${baseUrl}/api/salesforce/file?contentVersionId=${encodeURIComponent(contentVersionId)}&relatedId=${encodeURIComponent(relatedId)}&sub=${encodeURIComponent(subId)}`;

      let res: Response;
      try {
        res = await fetch(fileUrl);
      } catch (err: any) {
        throw new Error(`Failed to fetch file from Salesforce: ${err?.message || String(err)}`);
      }

      if (!res.ok) {
        const body = await (async () => {
          try { return await res.json(); } catch { return { status: res.status, statusText: res.statusText }; }
        })();
        throw new Error(`Salesforce file endpoint returned ${res.status}: ${body?.error ?? body?.message ?? JSON.stringify(body)}`);
      }

      // Read binary and convert to base64
      const buffer = Buffer.from(await res.arrayBuffer());
      const fileName = (() => {
        const cd = res.headers.get('content-disposition');
        if (!cd) return undefined;
        const match = /filename\*?=([^;]+)/i.exec(cd);
        if (!match) return undefined;
        return match[1].replace(/UTF-8''/, '').replace(/"/g, '').trim();
      })();
      const contentType = res.headers.get('content-type') ?? undefined;
      console.log('getFileTool - fetched file:', { fileName, contentType, byteLength: buffer.byteLength, bufferLength: buffer.toString('base64').length });
      const client = createDocReaderClient();

      const base64 = buffer.toString('base64');
      // If small, send single request
      if (base64.length <= MAX_BYTES) {
        console.log('getFileTool - sending single-shot extractDocx request to doc-reader');
        try {
          const result = await client.extractDocx({ base64, fileName, fileType: contentType });
          return result.text ?? result;
        } catch (err: any) {
          throw new Error(`doc-reader extract failed: ${err?.message ?? String(err)}`);
        }
      }

      // Otherwise, chunk and upload
      console.log('getFileTool - sending chunked upload to doc-reader');
      const sessionId = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
      const chunks: string[] = [];
      // for (let offset = 0; offset < base64.length; offset += MAX_BYTES) {
      //   const slice = buffer.slice(offset, Math.min(offset + MAX_BYTES, buffer.byteLength));
      //   chunks.push(Buffer.from(slice).toString('base64'));
      // }
      // Split base64 data into chunks
      for (let i = 0; i < base64.length; i += MAX_BYTES) {
        chunks.push(base64.slice(i, i + MAX_BYTES))
      }

      try {
        const chunkPromises = chunks.map((chunk, index) => {
          console.log(`getFileTool - preparing chunk ${index + 1}/${chunks.length}`);
          return client.uploadChunk({
            sessionId,
            chunk,
            chunkIndex: index,
            totalChunks: chunks.length,
            fileName,
            fileType: contentType,
          });
        });
        await Promise.all(chunkPromises);
        const processed = await client.processChunks(sessionId);
        console.log('getFileTool - chunked upload processing complete', processed);
        return processed.text ?? processed;
      } catch (err: any) {
        throw new Error(`doc-reader chunked upload failed: ${err?.message ?? String(err)}`);
      }
    },
  });
};

/*
 * === getFileTool.ts ===
 * Updated: 2025-09-11 00:00
 * Summary: Tool to fetch a file from Salesforce and extract text via doc-reader service.
 */
