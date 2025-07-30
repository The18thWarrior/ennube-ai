// === global.d.ts ===
// Ambient declarations for testing modules

declare module '@testing-library/react' {
  import React from 'react';
  export function render(ui: React.ReactElement, options?: any): any;
  export const screen: any;
}

declare module '@testing-library/jest-dom/extend-expect';

// Jest globals
declare function describe(description: string, callback: () => void): void;
declare function it(description: string, callback: () => void): void;
declare function expect(value: any): any;
