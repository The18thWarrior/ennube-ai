// === JsonBreadcrumbs.tsx ===
// Created: 2025-08-10 00:00
// Purpose: Breadcrumb navigation for nested JSON drill-down hierarchy.
// Exports:
//   - JsonBreadcrumbs
// Notes:
//   - Wraps existing breadcrumb primitives.

"use client";

import React from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbPage,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";

/**
 * OVERVIEW
 * - Purpose: Provide a simple reuse wrapper to map a stack of path segments into clickable breadcrumbs.
 * - Assumptions: Path entries contain a label.
 * - Edge Cases: Deep paths -> horizontal wrapping; root only -> shows single page.
 */

export interface JsonBreadcrumbsProps {
  path: { label: string }[];
  onNavigate: (index: number) => void; // navigate to stack index
  className?: string;
}

export const JsonBreadcrumbs: React.FC<JsonBreadcrumbsProps> = ({ path, onNavigate, className }) => {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {path.map((p, i) => (
          <React.Fragment key={i}>
            <BreadcrumbItem>
              {i === path.length - 1 ? (
                <BreadcrumbPage>{p.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href="#" onClick={(e) => { e.preventDefault(); onNavigate(i); }}>
                  {p.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {i < path.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

/*
 * === JsonBreadcrumbs.tsx ===
 * Updated: 2025-08-10 00:00
 * Summary: Renders clickable breadcrumbs for the current JSON path stack.
 * Key Components: JsonBreadcrumbs
 * Dependencies: breadcrumb UI primitives.
 * Version History:
 *   v1.0 – initial
 */
