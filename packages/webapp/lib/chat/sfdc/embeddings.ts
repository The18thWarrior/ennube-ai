// === embeddings.ts ===
// Created: 2025-08-27 00:00
// Purpose: Embedding utilities for Salesforce field metadata using HuggingFaceTransformersEmbeddings
// Exports:
//   - embedText: Convert text to embedding vector
//   - EmbeddingConfig: Configuration interface
//   - SalesforceEmbedder: Class for consistent embedding operations
// Interactions:
//   - Used by: generateQueryTool, vectorStore for semantic search
// Notes:
//   - Uses @langchain/community's HuggingFaceTransformersEmbeddings with Xenova transformers backend
//   - Lazy-loads the LangChain community embedding class to avoid ESM import issues in some test environments

/**
 * Configuration for embedding operations
 */
export interface EmbeddingConfig {
  model?: string;
  maxLength?: number;
  normalize?: boolean;
}

/**
 * Default embedding configuration
 */
const DEFAULT_CONFIG: EmbeddingConfig = {
  model: 'Xenova/all-MiniLM-L6-v2', // recommended Xenova variant of MiniLM
  maxLength: 512,
  normalize: true
};

/**
 * Salesforce-specific embedder class for consistent operations
 */
export class SalesforceEmbedder {
  private embeddings: any;
  private config: EmbeddingConfig;
  private isInitialized = false;

  constructor(config: EmbeddingConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the embeddings model (lazy loading)
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Lazy-load LangChain's HuggingFaceTransformersEmbeddings to avoid ESM import/time issues
      // We import dynamically so tests or environments that can't resolve the module at parse time won't fail.
      // @ts-ignore
      const mod = await import('@langchain/community/embeddings/huggingface_transformers');

  // Prefer the explicit named export
  const HF = mod && mod.HuggingFaceTransformersEmbeddings;
  if (!HF) throw new Error('HuggingFaceTransformersEmbeddings not found in @langchain/community package');

  // Instantiate with model name from config. The LangChain wrapper exposes embedQuery/embedDocuments.
  this.embeddings = new HF({ model: this.config.model });

      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize embeddings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Convert text to embedding vector
   * @param text Input text to embed
   * @returns Promise resolving to embedding vector
   */
  async embedText(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }
    await this.initialize();

    try {
      // Truncate text if too long
      const truncatedText = this.config.maxLength
        ? text.slice(0, this.config.maxLength)
        : text;

      // Prefer embedQuery if available (single input). Fall back to embedDocuments with single element.
      if (this.embeddings && typeof this.embeddings.embedQuery === 'function') {
        const res = await this.embeddings.embedQuery(truncatedText);
        if (Array.isArray(res)) return res;
        // Some implementations may return {embedding: [...]}
        if (res && Array.isArray(res.embedding)) return res.embedding;
        throw new Error('Unexpected embedding result format from embedQuery');
      }

      if (this.embeddings && typeof this.embeddings.embedDocuments === 'function') {
        const r = await this.embeddings.embedDocuments([truncatedText]);
        if (Array.isArray(r) && r.length > 0) return r[0];
      }

      throw new Error('Embeddings instance does not expose embedQuery or embedDocuments');
    } catch (error) {
      throw new Error(`Failed to embed text: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Resolve a callable embed function from the normalized embeddings object.
   */
  private getEmbedFunction(): (text: string) => Promise<any> {
  // Legacy adapter removed. This method is retained for backwards compatibility but now errors.
  throw new Error('getEmbedFunction is no longer used — embedQuery/embedDocuments are used instead');
  }

  /**
   * Embed multiple texts in batch
   * @param texts Array of texts to embed
   * @returns Promise resolving to array of embedding vectors
   */
  async embedTexts(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) return [];

    await this.initialize();

    try {
      if (this.embeddings && typeof this.embeddings.embedDocuments === 'function') {
        const res = await this.embeddings.embedDocuments(texts);
        if (Array.isArray(res)) return res as number[][];
        // Unexpected format
        throw new Error('Unexpected response from embedDocuments');
      }

      // Fallback to embedding one-by-one
      const out: number[][] = [];
      for (const t of texts) {
        try {
          out.push(await this.embedText(t));
        } catch (e) {
          console.warn(`Failed to embed text chunk: ${String(e)}`);
          out.push([]);
        }
      }
      return out;
    } catch (error) {
      throw new Error(`Failed to embed texts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create text representation for Salesforce field embedding
   * @param field Salesforce field metadata
   * @returns Text representation optimized for embedding
   */
  createFieldText(field: {
    sobjectType: string;
    fieldName: string;
    label: string;
    type: string;
    helpText?: string;
    picklistValues?: string[];
  }): string {
    const parts: string[] = [
      `${field.sobjectType} ${field.fieldName}`,
      field.label,
      `type ${field.type}`
    ];

    if (field.helpText) {
      parts.push(field.helpText);
    }

    if (field.picklistValues && field.picklistValues.length > 0) {
      parts.push(`options: ${field.picklistValues.slice(0, 10).join(' ')}`);
    }

    return parts.join(' ');
  }

  /**
   * Check if embedder is ready to use
   */
  get ready(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current configuration
   */
  get configuration(): EmbeddingConfig {
    return { ...this.config };
  }
}

// Global instance for convenience
let globalEmbedder: SalesforceEmbedder | null = null;

/**
 * Get or create global embedder instance
 * @param config Optional configuration for new instance
 * @returns Global SalesforceEmbedder instance
 */
export function getGlobalEmbedder(config?: EmbeddingConfig): SalesforceEmbedder {
  if (!globalEmbedder || config) {
    globalEmbedder = new SalesforceEmbedder(config);
  }
  return globalEmbedder;
}

/**
 * Convenience function to embed text using global embedder
 * @param text Text to embed
 * @returns Promise resolving to embedding vector
 */
export async function embedText(text: string): Promise<number[]> {
  const embedder = getGlobalEmbedder();
  return await embedder.embedText(text);
}

/**
 * Convenience function to embed multiple texts using global embedder
 * @param texts Array of texts to embed
 * @returns Promise resolving to array of embedding vectors
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const embedder = getGlobalEmbedder();
  return await embedder.embedTexts(texts);
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
  const embedder = getGlobalEmbedder();
  return embedder.createFieldText(field);
}

/**
 * OVERVIEW
 *
 * - Purpose: Provide consistent text embedding functionality for Salesforce field metadata
 * - Assumptions: Uses @themaximalist/embeddings.js with @xenova/transformers for vector generation
 * - Edge Cases: Handles empty text, initialization failures, and batch processing errors gracefully
 * - How it fits into the system: Enables semantic search in vectorStore and generateQueryTool
 * - Future Improvements:
 *   - Add embedding caching for frequently embedded texts
 *   - Support for different embedding models based on use case
 *   - Implement similarity threshold tuning
 *   - Add embedding dimension validation
 */

/*
 * === embeddings.ts ===
 * Updated: 2025-08-27 00:00
 * Summary: Text embedding utilities for Salesforce semantic search using Embeddings.js
 * Key Components:
 *   - SalesforceEmbedder: Main class for embedding operations with lazy loading
 *   - embedText: Convenience function for single text embedding
 *   - createFieldText: Optimized text creation for Salesforce fields
 * Dependencies:
 *   - Requires: @themaximalist/embeddings.js, @xenova/transformers
 * Version History:
 *   v1.0 – initial implementation with embeddings.js integration
 * Notes:
 *   - Uses lightweight all-MiniLM-L6-v2 model for balance of speed and accuracy
 *   - Global embedder instance for performance and memory efficiency
 */