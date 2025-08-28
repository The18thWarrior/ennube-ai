// === embeddings.ts ===
// Created: 2025-08-27 00:00
// Purpose: Embedding utilities for Salesforce field metadata using @themaximalist/embeddings.js
// Exports:
//   - embedText: Convert text to embedding vector
//   - EmbeddingConfig: Configuration interface
//   - SalesforceEmbedder: Class for consistent embedding operations
// Interactions:
//   - Used by: generateQueryTool, vectorStore for semantic search
// Notes:
//   - Uses @themaximalist/embeddings.js with @xenova/transformers backend
//   - Caches embeddings model for performance

// Note: we lazy-load @themaximalist/embeddings.js at runtime to avoid ESM import errors
// when Jest loads the test environment. The module is imported inside initialize().

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
  model: 'all-MiniLM-L6-v2', // Lightweight but effective model
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
      // Dynamic import to avoid ESM parsing issues during test discovery
      // @ts-ignore
      const mod = await import('@themaximalist/embeddings.js');

      // The embeddings package may export different shapes depending on version / bundler:
      // - a constructor/class (new Embeddings()) with an instance.embed(text)
      // - an object with an embed function (exports.embed)
      // - a default function that directly embeds (async function embed(text))
      // Normalize all possibilities into an object with an async embed(text) method.
      const candidate = mod && (mod.default || mod.Embeddings || mod);

      const makeAdapter = (impl: any) => {
        const wrap = (fn: Function, ctx?: any) => ({ embed: async (text: string) => {
          // Normalize return shapes: single vector or { embedding: [...]} or array
          const res = await fn.call(ctx, text);
          return Array.isArray(res) ? res : (res && Array.isArray(res.embedding) ? res.embedding : (res && Array.isArray(res.data) ? res.data : res));
        }});
        // If already an object with embed-like methods
        if (impl && typeof impl === 'object') {
          if (typeof impl.embed === 'function') return { embed: impl.embed.bind(impl) };
          if (typeof impl.embedText === 'function') return { embed: impl.embedText.bind(impl) };
          if (typeof impl.encode === 'function') return { embed: impl.encode.bind(impl) };
          if (typeof impl.embed_many === 'function') return { embed: async (text: string) => { const r = await impl.embed_many([text]); return Array.isArray(r) ? r[0] : r; } };
          if (typeof impl.embedTexts === 'function') return { embed: async (text: string) => { const r = await impl.embedTexts([text]); return Array.isArray(r) ? r[0] : r; } };
        }

        // If it's a constructor/class
        if (typeof impl === 'function') {
          // Try to instantiate
          try {
            const instance = new impl({ normalize: this.config.normalize });
            if (instance && typeof instance.embed === 'function') {
              return { embed: instance.embed.bind(instance) };
            }
            if (instance && typeof instance.embedText === 'function') {
              return { embed: instance.embedText.bind(instance) };
            }
            if (instance && typeof instance.encode === 'function') {
              return { embed: instance.encode.bind(instance) };
            }
          } catch (e) {
            // Not constructable; treat as plain function
          }

          // If the function itself performs embedding (async fn text => vector)
          try {
            return wrap(impl as Function, null);
          } catch (e) {
            // fallthrough
          }
        }

        // Check module-level named exports
        if (mod && typeof mod.embed === 'function') return { embed: mod.embed.bind(mod) };
        if (mod && typeof mod.embedText === 'function') return { embed: mod.embedText.bind(mod) };

        throw new Error('Unsupported embeddings module shape');
      };

      this.embeddings = makeAdapter(candidate as any);
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

  // Resolve available embed function on the embeddings implementation.
  const embedFn = this.getEmbedFunction();
  const result = await embedFn(truncatedText);
      
      // Handle different response formats from embeddings.js
      if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.embedding)) {
        return result.embedding;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      } else {
        throw new Error('Unexpected embedding result format');
      }
    } catch (error) {
      throw new Error(`Failed to embed text: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Resolve a callable embed function from the normalized embeddings object.
   */
  private getEmbedFunction(): (text: string) => Promise<any> {
    const e = this.embeddings as any;
    if (!e) throw new Error('Embeddings implementation is not available');

    if (typeof e.embed === 'function') return (t: string) => Promise.resolve(e.embed(t));
    if (typeof e.embedText === 'function') return (t: string) => Promise.resolve(e.embedText(t));
    if (typeof e.encode === 'function') return (t: string) => Promise.resolve(e.encode(t));
    if (typeof e.embedTexts === 'function') return async (t: string) => {
      const r = await e.embedTexts([t]);
      return Array.isArray(r) ? r[0] : r;
    };
    if (typeof e.embed_many === 'function') return async (t: string) => {
      const r = await e.embed_many([t]);
      return Array.isArray(r) ? r[0] : r;
    };

    throw new Error('No embed function found on embeddings implementation');
  }

  /**
   * Embed multiple texts in batch
   * @param texts Array of texts to embed
   * @returns Promise resolving to array of embedding vectors
   */
  async embedTexts(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      try {
        const embedding = await this.embedText(text);
        embeddings.push(embedding);
      } catch (error) {
        console.warn(`Failed to embed text "${text.slice(0, 50)}...":`, error);
        // Use zero vector as fallback
        embeddings.push([]);
      }
    }
    
    return embeddings;
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