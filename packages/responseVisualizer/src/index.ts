// === src/index.ts ===
// Created: 2025-07-19 16:15
// Purpose: Main package entry point
// Exports:
//   - All components
//   - All types
//   - All tools
//   - All hooks
//   - All utilities
// Interactions:
//   - Used by: Package consumers
// Notes:
//   - Main public API of the package

// Types
export * from './types';

// Components
export * from './components';

// Tools
export * from './tools';

// Hooks
export * from './hooks';

// Utilities
export * from './utils';

// Default export for convenience
export { VisualizerRenderer as default } from './components/core/VisualizerRenderer';

/*
 * === src/index.ts ===
 * Updated: 2025-07-19 16:15
 * Summary: Main package entry point
 * Key Components:
 *   - Complete public API exports
 *   - VisualizerRenderer as default export
 * Dependencies:
 *   - Requires: All package modules
 * Version History:
 *   v1.0 – initial package API
 * Notes:
 *   - Provides complete public interface
 *   - Organized by functional areas
 */
