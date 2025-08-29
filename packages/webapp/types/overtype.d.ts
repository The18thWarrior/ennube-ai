// === overtype.d.ts ===
// Created: 2025-08-25 00:00
// Purpose: Provide a minimal type declaration for the untyped `overtype` package
// Exports: default OverType (any)

declare module 'overtype' {
  // Minimal typing to allow usage from TypeScript. The real package is JS-only.
  type OverTypeInstance = {
    destroy?: () => void;
    getValue?: () => string;
    setValue?: (s: string) => void;
    [key: string]: any;
  };

  type InitResult = OverTypeInstance | [OverTypeInstance, ...any[]];

  const OverType: {
    init: (el: HTMLElement | null, opts?: any) => InitResult;
  };

  export default OverType;
}

/*
 * === overtype.d.ts ===
 * Updated: 2025-08-25
 * Summary: Minimal ambient declaration for `overtype` package to satisfy TS compiler
 */
