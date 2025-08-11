// === object-summary.ts ===
// Created: 2025-08-10 00:00
// Purpose: Utility helpers for summarizing arbitrary JSON values for display in chips or headings.
// Exports:
//   - summarizeObject
//   - isPrimitive
//   - isPlainObject
//   - isPrimitiveArray
//   - isObjectArray
// Notes:
//   - Used by JsonRecord drill-down viewer.

/**
 * OVERVIEW
 *
 * - Purpose: Provide type guard utilities and a heuristic summarizer for objects when rendering chips.
 * - Assumptions: Values can be anything JSON-serializable; circular references are possible (guarded).
 * - Edge Cases: Empty objects, arrays with mixed types, circular references.
 * - Future Improvements: i18n for placeholder strings; size-based truncation customization.
 */

export type Primitive = string | number | boolean | null;

export const isPrimitive = (v: unknown): v is Primitive =>
  v === null || ["string", "number", "boolean"].includes(typeof v);

export const isPlainObject = (v: unknown): v is Record<string, any> =>
  Object.prototype.toString.call(v) === "[object Object]";

export const isPrimitiveArray = (v: unknown): v is Primitive[] =>
  Array.isArray(v) && v.every(isPrimitive);

export const isObjectArray = (v: unknown): v is Record<string, any>[] =>
  Array.isArray(v) && v.length > 0 && v.every(isPlainObject);

const CANDIDATE_KEYS = [
  "name",
  "Name",
  "title",
  "Title",
  "label",
  "Label",
  "id",
  "Id",
  "key",
  "Key"
];

/** Summarize an object for chip label */
export function summarizeObject(obj: Record<string, any>, fallbackIndex?: number): string {
  for (const k of CANDIDATE_KEYS) {
    if (k in obj && isPrimitive(obj[k])) return String(obj[k]);
  }
  // pick first primitive value
  for (const k of Object.keys(obj)) {
    if (isPrimitive(obj[k])) return String(obj[k]);
  }
  const json = JSON.stringify(obj);
  if (json.length <= 40) return json;
  return (fallbackIndex !== undefined ? `Item ${fallbackIndex}` : "Object") +
    (json ? ` (${json.slice(0, 30)}…)` : "");
}

/*
 * === object-summary.ts ===
 * Updated: 2025-08-10 00:00
 * Summary: Type guards and summarization helpers for the JsonRecord component.
 * Key Components:
 *   - summarizeObject(): returns a short human-friendly description.
 *   - isPrimitive(): primitive test.
 *   - isPlainObject(): object test.
 * Dependencies: none
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Keep functions pure & side-effect free.
 */
