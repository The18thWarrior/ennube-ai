// === jest.config.js ===
// Created: 2025-08-02 15:30
// Purpose: Jest testing configuration for contractReader package
// Exports:
//   - Test configuration for TypeScript and React components
// Notes:
//   - Uses ts-jest for TypeScript compilation

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  setupFilesAfterEnv: [],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  testTimeout: 30000
};

/*
 * === jest.config.js ===
 * Updated: 2025-08-02 15:30
 * Summary: Jest test runner configuration
 * Key Components:
 *   - TypeScript support via ts-jest
 *   - Coverage reporting setup
 *   - Extended timeout for AI operations
 * Dependencies:
 *   - Requires: Jest, ts-jest
 * Version History:
 *   v1.0 – initial Jest setup
 * Notes:
 *   - 30s timeout to accommodate AI processing
 */
