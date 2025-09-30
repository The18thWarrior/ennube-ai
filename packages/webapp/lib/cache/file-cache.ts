// === file-cache.ts ===
// Created: 2025-09-30 12:00
// Purpose: Handle file blob storage and retrieval for UIMessage attachments using Vercel Blob.
// Exports:
//   - export const storeFilesFromMessages = (messages: UIMessage[], userSub: string) => Promise<void>
//   - export const getFile = (fileName: string, userSub: string) => Promise<Blob | null>
// Interactions:
//   - Used by: chat route for caching user uploads
// Notes:
//   - Assumes fileName is unique per user; skips storage if fileId already cached via head check

/**
 * OVERVIEW
 *
 * - Purpose: Provides utilities to store and retrieve file blobs from UIMessage objects using Vercel Blob storage.
 * - Assumptions: UIMessage content is an array with parts of type 'file' containing fileName, data (Blob), and fileId.
 * - Edge Cases: Skips files without fileName or data; handles blob existence checks to avoid duplicates.
 * - How it fits into the system: Integrated into chat API to cache user-uploaded files persistently.
 * - Future Improvements: Add batch operations, metadata storage, or integration with a database for fileId mapping.
 */

import { put, list } from '@vercel/blob';
import { UIMessage } from 'ai';

export async function storeFilesFromMessages(messages: UIMessage[], userSub: string): Promise<void> {
  //console.log('Storing files from messages for user:', userSub, messages.at(-1));
  if (!messages || messages.length === 0) return;
  if (!userSub) throw new Error('User sub is required to store files.');
  for (const message of messages) {
      for (const part of (message).parts) {
        if (part.type === 'file') {
          const { filename, url, mediaType } = part;
          if (!filename || !url) continue;
          const key = `user-upload:${userSub}:${filename}`;
          try {
            // Check if already cached by listing blobs with exact prefix
            const { blobs } = await list({ prefix: key });
            if (blobs.length > 0) continue; // Already exists
            const data = await fetch(url).then(res => res.blob());
            // Store the file
            await put(key, data, { access: 'public' });
            console.log('Stored file blob with key:', key);
          } catch (error) {
            console.log('Error storing file blob:', error);
            // Handle error, perhaps log
          }
        }
      }
    
  }
}

export async function getFile(fileName: string, userSub: string): Promise<Blob | null> {
  const key = `user-upload:${userSub}:${fileName}`;
  try {
    const { blobs } = await list({ prefix: key });
    if (blobs.length > 0) {
      const response = await fetch(blobs[0].url);
      return await response.blob();
    }
    return null;
  } catch (error) {
    return null;
  }
}

/*
 * === file-cache.ts ===
 * Updated: 2025-09-30 12:00
 * Summary: Implements file caching for chat messages using Vercel Blob.
 * Key Components:
 *   - storeFilesFromMessages(): Iterates through messages, stores unique file blobs.
 *   - getFile(): Retrieves a blob by fileName and userSub.
 * Dependencies:
 *   - Requires: @vercel/blob, ai (for UIMessage type)
 * Version History:
 *   v1.0 – initial implementation with store and retrieve methods
 * Notes:
 *   - Public access set for blobs; adjust if private access needed.
 */