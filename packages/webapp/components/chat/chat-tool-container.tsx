"use client"

import React, { useEffect, useRef, useState } from "react";
import { X, Eye, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ChatToolContainer.tsx
 * Created: 2025-09-10
 * Purpose: Demonstrates a sophisticated container component for displaying tool results
 * Exports: ChatToolContainer (default)
 * Notes: Single-file implementation that contains OverflowContainer, ToolResultCard and a demo.
 */

type PropsWithChildren = React.PropsWithChildren<{}>;

/**
 * OverflowContainer
 * - Renders children horizontally in a small fixed-height box (collapsed)
 * - Shows a bottom vertical fade when content actually overflows
 * - Shows a "View All" button top-right
 */
export function OverflowContainer({ children, onViewAll }: { children: React.ReactNode; onViewAll: () => void; }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [showGradient, setShowGradient] = useState(false);

  // Detect overflow (content taller than container)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      // when content height greater than client height -> overflow
      setShowGradient(el.scrollHeight > el.clientHeight + 1);
    };

    check();

    // Resize observer to detect content/width changes
    const ro = new ResizeObserver(check);
    ro.observe(el);

    // Also observe children since they may reflow
    let mo: MutationObserver | null = null;
    try {
      mo = new MutationObserver(check);
      mo.observe(el, { childList: true, subtree: true });
    } catch (e) {}

    window.addEventListener("resize", check);
    return () => {
      ro.disconnect();
      mo?.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [children]);

  return (
    <div className="relative w-full">
      <div className="flex justify-end px-2">
        <button
          onClick={onViewAll}
          className="text-sm px-2 py-1 bg-transparent hover:underline text-primary"
          aria-label="View all tool results"
        >
          View All
        </button>
      </div>

      <div
        ref={ref}
        className={cn(
          // NOTE: using h-16 as a conservative, small fixed height; some projects include h-15.
          "h-16 overflow-y-hidden overflow-x-auto px-3 py-2 rounded-lg border border-transparent bg-transparent transition-all",
          "flex flex-row flex-wrap gap-3 items-start"
        )}
      >
        {children}
      </div>

      {/* Gradient overlay at the bottom, only visible when overflowing */}
      {showGradient && (
        <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-8">
          <div className="h-full bg-gradient-to-b from-transparent to-white dark:to-black opacity-80"></div>
        </div>
      )}
    </div>
  );
}

/**
 * ToolResultCard
 * - Minimal card component that accepts children as detailed content
 * - Exposes a Details button which is used by the modal to expand
 */
export function ToolResultCard({
  id,
  title,
  summary,
  children,
  onDetails,
  compact = false,
}: {
  id: string;
  title: string;
  summary?: string;
  children?: React.ReactNode;
  onDetails?: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex-shrink-0   border rounded-md shadow-sm",
        compact ? "w-full px-3 py-2 flex items-start gap-2" : "w-60 px-3 py-3"
      )}
      data-card-id={id}
    >
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium truncate">{title}</h4>
          <button
            onClick={() => onDetails?.(id)}
            className="text-xs px-2 py-1 rounded hover:bg-muted "
            aria-label={`View details for ${title}`}
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
        {summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{summary}</p>}
        {!compact && (
          <div className="mt-3 text-xs text-muted-foreground">{children}</div>
        )}
      </div>
    </div>
  );
}

/**
 * ChatToolContainer
 * - Entry point that renders an OverflowContainer with demo ToolResultCard children
 * - Manages modal open state and selected card for expanded detail view
 */
export default function ChatToolContainer(_: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Example data to render several cards
  const examples = [
    {
      id: "card-1",
      title: "Customer record",
      summary: "3 fields changed — email, phone, industry",
      body: <div className="text-xs">Name: Acme Corp<br/>Status: Active</div>,
    },
    {
      id: "card-2",
      title: "Query Results",
      summary: "42 records matched",
      body: <div className="text-xs">Top record: John Doe</div>,
    },
    {
      id: "card-3",
      title: "Postgres Snapshot",
      summary: "Schema: public.users",
      body: <div className="text-xs">Columns: id, email, created_at</div>,
    },
    {
      id: "card-4",
      title: "Workflow Run",
      summary: "Succeeded — usageId: abc123",
      body: <div className="text-xs">Executed: update-contact</div>,
    },
    {
      id: "card-5",
      title: "Profile Match",
      summary: "Confidence 92%",
      body: <div className="text-xs">Matched profile: Prospective CFO</div>,
    },
    {
      id: "card-6",
      title: "Count Result",
      summary: "Total: 128",
      body: <div className="text-xs">Filters applied: last_30_days</div>,
    },
  ];

  // open modal
  const handleViewAll = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSelectedId(null);
  };

  // select card to show expanded detail
  const handleSelect = (id: string) => setSelectedId(id);
  const handleBackToAll = () => setSelectedId(null);

  return (
    <div>
      <OverflowContainer onViewAll={handleViewAll}>
        {examples.map((e) => (
          <ToolResultCard key={e.id} id={e.id} title={e.title} summary={e.summary} onDetails={handleSelect}>
            {e.body}
          </ToolResultCard>
        ))}
      </OverflowContainer>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={handleClose}
            aria-hidden
          />

          <div className="relative z-10 w-full h-full flex flex-col">
            <div className="flex items-center justify-between p-4">
              <div />
              <button
                onClick={handleClose}
                className="p-2 rounded-md hover:bg-muted "
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden px-6 pb-6">
              {/* Default grid view when no selection */}
              {!selectedId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-full overflow-auto p-2">
                  {examples.map((e) => (
                    <div key={e.id} className="p-2">
                      <ToolResultCard id={e.id} title={e.title} summary={e.summary} onDetails={handleSelect}>
                        {e.body}
                      </ToolResultCard>
                    </div>
                  ))}
                </div>
              )}

              {/* Expanded/detail view */}
              {selectedId && (
                <div className="flex h-full gap-4">
                  <div className="w-3/4   rounded p-4 overflow-auto transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={handleBackToAll}
                        className="inline-flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-muted "
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to all
                      </button>
                      <div className="text-sm font-medium">Details</div>
                    </div>

                    {/* Enlarged selected card content */}
                    {examples.filter((e) => e.id === selectedId).map((e) => (
                      <div key={e.id} className="space-y-3">
                        <h3 className="text-lg font-semibold">{e.title}</h3>
                        <p className="text-sm text-muted-foreground">{e.summary}</p>
                        <div className="mt-3 bg-muted  p-4 rounded">
                          {e.body}
                        </div>
                      </div>
                    ))}
                  </div>

                  <aside className="w-1/4 overflow-auto space-y-2">
                    {examples.filter((e) => e.id !== selectedId).map((e) => (
                      <div key={e.id} className="p-2">
                        <ToolResultCard id={e.id} title={e.title} summary={e.summary} compact onDetails={handleSelect}>
                          {e.body}
                        </ToolResultCard>
                      </div>
                    ))}
                  </aside>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/*
 * Footer notes
 * - OVERVIEW: ChatToolContainer demonstrates an OverflowContainer that collapses its children
 *   and a modal that can show all children in a grid and an expanded detail view for a selected child.
 * - Assumptions: Tailwind classes like h-16 are available; some projects may include custom sizes (h-15).
 */
