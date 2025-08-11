// === JsonRecordView.tsx ===
// Created: 2025-08-10 00:00
// Purpose: Presentational component that renders an object (or array) as labeled read-only fields.
// Exports:
//   - JsonRecordView
// Notes:
//   - Stateless; delegates drill-down actions to parent via callbacks.

"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldRow } from "./FieldRow";
import { summarizeObject, isPlainObject, isPrimitive, isPrimitiveArray, isObjectArray } from "./object-summary";
import { Separator } from "@/components/ui/separator";

/**
 * OVERVIEW
 * - Purpose: Render key/value pairs for current JSON node.
 * - Assumptions: data is object or array; root arrays treated like object with index keys.
 * - Edge Cases: Large arrays show toggle for extra items.
 * - Future Improvements: Virtualization for very large collections.
 */

export interface JsonRecordViewProps {
  data: any;
  onDrill: (label: string, value: any) => void;
  arrayPreviewCount?: number;
  renderValue?: (key: string, value: any, path: string[]) => React.ReactNode;
  path: string[]; // full path to current node (excluding key being rendered)
}

const DEFAULT_PREVIEW = 25;

export const JsonRecordView: React.FC<JsonRecordViewProps> = ({
  data,
  onDrill,
  arrayPreviewCount = DEFAULT_PREVIEW,
  renderValue,
  path,
}) => {
  const [expandedArrays, setExpandedArrays] = useState<Record<string, boolean>>({});

  const toggleArray = (key: string) => setExpandedArrays(s => ({ ...s, [key]: !s[key] }));

  const entries: [string, any][] = Array.isArray(data)
    ? data.map((v, i) => [String(i), v])
    : isPlainObject(data)
      ? Object.entries(data)
      : [];

  if (!entries.length) {
    return <div className="text-sm text-muted-foreground">(empty)</div>;
  }

  return (
    <div className="space-y-4">
      {entries.map(([key, value]) => {
        // Primitive value row
        if (isPrimitive(value)) {
          return (
            <FieldRow key={key} label={key}>
              {renderValue ? renderValue(key, value, path) : String(value)}
            </FieldRow>
          );
        }

        // Array of primitives
        if (isPrimitiveArray(value)) {
          const chips = value as any[];
            return (
              <FieldRow key={key} label={key}>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {chips.length === 0 && <span className="text-muted-foreground">(empty)</span>}
                  {chips.map((c, i) => (
                    <Badge key={i} variant="secondary" className="max-w-[160px] truncate" title={String(c)}>
                      {String(c)}
                    </Badge>
                  ))}
                </div>
              </FieldRow>
            );
        }

        // Array of objects
        if (isObjectArray(value)) {
          const arr = value as Record<string, any>[];
          const expanded = expandedArrays[key];
          const preview = expanded ? arr : arr.slice(0, arrayPreviewCount);
          return (
            <FieldRow key={key} label={key}>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {arr.length === 0 && <span className="text-muted-foreground">(empty)</span>}
                {preview.map((obj, i) => {
                  const emptyObj = Object.keys(obj || {}).length === 0;
                  if (emptyObj) {
                    return (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="max-w-[200px] truncate"
                        title="(empty object)"
                      >
                        (empty object)
                      </Badge>
                    );
                  }
                  const label = summarizeObject(obj, i);
                  return (
                    <Badge
                      key={i}
                      variant="default"
                      className="cursor-pointer hover:bg-muted/70 transition-colors max-w-[200px] truncate"
                      onClick={() => onDrill(`${key}[${i}]`, obj)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && onDrill(`${key}[${i}]`, obj)}
                      title={label}
                    >
                      {label}
                    </Badge>
                  );
                })}
                {arr.length > arrayPreviewCount && (
                  <Badge
                    variant="default"
                    className="cursor-pointer hover:bg-muted/70"
                    onClick={() => toggleArray(key)}
                  >
                    {expanded ? "Show Less" : `+${arr.length - arrayPreviewCount} more`}
                  </Badge>
                )}
              </div>
            </FieldRow>
          );
        }

        // Mixed arrays (fallback): treat like generic list; attempt drill if element is object
        if (Array.isArray(value)) {
          const arr = value as any[];
          return (
            <FieldRow key={key} label={key}>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {arr.length === 0 && <span className="text-muted-foreground">(empty)</span>}
                {arr.map((el, i) => {
                  if (isPlainObject(el)) {
                    const emptyObj = Object.keys(el || {}).length === 0;
                    if (emptyObj) {
                      return (
                        <Badge key={i} variant="secondary" className="max-w-[200px] truncate" title="(empty object)">
                          (empty object)
                        </Badge>
                      );
                    }
                    return (
                      <Badge
                        key={i}
                        variant="default"
                        className="cursor-pointer hover:bg-muted/70 max-w-[200px] truncate"
                        onClick={() => onDrill(`${key}[${i}]`, el)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && onDrill(`${key}[${i}]`, el)}
                      >
                        {summarizeObject(el, i)}
                      </Badge>
                    );
                  }
                  return (
                    <Badge key={i} variant="secondary" className="max-w-[160px] truncate">
                      {String(el)}
                    </Badge>
                  );
                })}
              </div>
            </FieldRow>
          );
        }

        // Nested object: clickable badge (default) unless empty
        if (isPlainObject(value)) {
          const emptyObj = Object.keys(value || {}).length === 0;
          return (
            <FieldRow key={key} label={key}>
              {emptyObj ? (
                <Badge variant="secondary" className="max-w-[200px] truncate">(empty object)</Badge>
              ) : (
                <Badge
                  variant="default"
                  className="cursor-pointer hover:bg-muted/70 hover:text-muted max-w-[200px] truncate"
                  onClick={() => onDrill(key, value)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onDrill(key, value)}
                >
                  {summarizeObject(value)}
                </Badge>
              )}
            </FieldRow>
          );
        }

        // Fallback catch-all
        return (
          <FieldRow key={key} label={key}>
            {renderValue ? renderValue(key, value, path) : String(value)}
          </FieldRow>
        );
      })}
      <Separator />
    </div>
  );
};

/*
 * === JsonRecordView.tsx ===
 * Updated: 2025-08-10 00:00
 * Summary: Stateless rendering of current JSON node with drill cues.
 * Key Components: JsonRecordView
 * Dependencies: FieldRow, Badge, Button.
 * Version History:
 *   v1.0 – initial
 */
