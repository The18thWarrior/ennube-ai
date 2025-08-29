
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

/**
 * Convenience function to embed text using global embedder
 * @param text Text to embed
 * @returns Promise resolving to embedding vector
 */
export async function embedText(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) return [];

  try {
  // embedMany returns an array of vectors for the provided values.
  // Use a standard embedding model identifier so the embedder can resolve the proper provider.
  const res = await embedMany({ model: 'openai/text-embedding-3-small', values: [text] });
    if (Array.isArray(res) && res.length > 0) return res[0] as number[];
    return [];
  } catch (error) {
    // Normalize errors to be easy to catch by callers/tests
    throw new Error(`Embedding failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create embedding-optimized text from Salesforce field
 * @param field Salesforce field metadata
 * @returns Text representation for embedding
 */
export function createFieldText(field: {
  sobjectType: string;
  fieldName: string;
  label: string;
  type: string;
  helpText?: string;
  picklistValues?: string[];
}): string {
  const parts: string[] = [];

  // Basic identity
  parts.push(`${field.sobjectType}.${field.fieldName} (${field.label})`);

  // Type information
  parts.push(`type: ${field.type}`);

  // Help text if present
  if (field.helpText && field.helpText.trim().length > 0) {
    parts.push(`help: ${field.helpText.trim()}`);
  }

  // Picklist values if present
  if (field.picklistValues && field.picklistValues.length > 0) {
    parts.push(`picklist: ${field.picklistValues.join(', ')}`);
  }

  // Join with separator optimized for embeddings
  return parts.join(' — ');
}

