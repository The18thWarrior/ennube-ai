// === jest.config.js ===
// Created: 2025-08-27 00:00
// Purpose: Jest testing configuration for webapp package
// Exports:
//   - Test configuration for TypeScript and Next.js components
// Notes:
//   - Uses ts-jest for TypeScript compilation
//   - Configured for Next.js environment

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/lib'],
  testMatch: [
    '**/tests/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    '!lib/**/*.d.ts',
    '!lib/**/index.ts'
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
  testTimeout: 30000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  // Mock Next.js modules
  modulePathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/'
  ]
};

/*
 * === jest.config.js ===
 * Updated: 2025-08-27 00:00
 * Summary: Jest test runner configuration for Next.js webapp
 * Key Components:
 *   - TypeScript support via ts-jest
 *   - Next.js path mapping support (@/ alias)
 *   - Extended timeout for AI operations
 * Dependencies:
 *   - Requires: Jest, ts-jest
 * Version History:
 *   v1.0 – initial Jest setup for webapp
 * Notes:
 *   - 30s timeout to accommodate AI and embedding operations
 *   - Ignores Next.js build artifacts
 */