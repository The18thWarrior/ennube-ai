// === JsonRecord.tsx ===
// Created: 2025-08-10 00:00
// Purpose: Stateful drill-down viewer for arbitrary JSON values using read-only form style rows.
// Exports:
//   - JsonRecord (top-level component)
// Notes:
//   - Maintains navigation stack & breadcrumbs.

"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JsonBreadcrumbs } from "./JsonBreadcrumbs";
import { JsonRecordView } from "./JsonRecordView";
import { isPlainObject } from "./object-summary";

/**
 * OVERVIEW
 * - Purpose: Provide interactive navigation through nested JSON objects & arrays.
 * - Assumptions: Incoming data is JSON-like; circular references possible (handled by detection token).
 * - Edge Cases: Root primitive -> displayed directly; circular -> labeled [Circular].
 * - How it fits: Generalized result visualization consistent with execution detail styling.
 * - Future Improvements: Persist expanded state across navigation; search/filter fields.
 */

export interface JsonRecordProps {
  data: any;
  rootLabel?: string;
  className?: string;
  maxArrayPreview?: number;
  onNavigatePathChange?: (path: string[]) => void;
  renderValue?: (key: string, value: any, path: string[]) => React.ReactNode;
}

interface StackItem { label: string; data: any; }

export const JsonRecord: React.FC<JsonRecordProps> = ({
  data,
  rootLabel = "Root",
  className,
  maxArrayPreview,
  onNavigatePathChange,
  renderValue
}) => {
  const [stack, setStack] = useState<StackItem[]>([{ label: rootLabel, data }]);

  // Circular reference guard when deriving display object
  const safeData = useMemo(() => {
    const seen = new WeakSet();
    const transform = (val: any): any => {
      if (val && typeof val === 'object') {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
        if (Array.isArray(val)) return val.map(transform);
        const out: Record<string, any> = {};
        Object.keys(val).forEach(k => { out[k] = transform(val[k]); });
        return out;
      }
      return val;
    };
    return transform(stack[stack.length - 1].data);
  }, [stack]);

  const currentPath = useMemo(() => stack.map(s => s.label), [stack]);

  const drill = useCallback((label: string, value: any) => {
    setStack(s => [...s, { label, data: value }]);
  }, []);

  const navigateTo = useCallback((index: number) => {
    setStack(s => s.slice(0, index + 1));
  }, []);

  React.useEffect(() => {
    onNavigatePathChange?.(currentPath);
  }, [currentPath, onNavigatePathChange]);

  const goBack = () => {
    if (stack.length > 1) setStack(s => s.slice(0, s.length - 1));
  };

  const active = stack[stack.length - 1];
  const isObjectLike = isPlainObject(active.data) || Array.isArray(active.data);

  return (
    <Card className={`my-2 border-purple-500 w-full flex flex-col ${className || ''}`}>
      <CardHeader className="pb-3 space-y-2">
        <div className="flex items-center justify-between">
          {stack.length > 1 ? (
            <Button variant='ghost' size="sm" className='w-fit' onClick={goBack}>Back</Button>
          ) : <span />}
        </div>
        <CardTitle className="text-xl flex items-center gap-2">
          <span className="truncate">{rootLabel}</span>
        </CardTitle>
        {stack.length > 1 && (
          <JsonBreadcrumbs path={stack.map(s => ({ label: s.label }))} onNavigate={navigateTo} />
        )}
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        {isObjectLike ? (
          <JsonRecordView
            data={active.data}
            onDrill={drill}
            arrayPreviewCount={maxArrayPreview}
            renderValue={renderValue}
            path={currentPath}
          />
        ) : (
          <div className="text-sm font-medium break-words">{String(active.data)}</div>
        )}
      </CardContent>
    </Card>
  );
};

/*
 * === JsonRecord.tsx ===
 * Updated: 2025-08-10 00:00
 * Summary: Top-level interactive JSON drill-down component.
 * Key Components: JsonRecord
 * Dependencies: Card UI primitives, JsonBreadcrumbs, JsonRecordView.
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Keeps minimal state (stack) for navigation.
 */
