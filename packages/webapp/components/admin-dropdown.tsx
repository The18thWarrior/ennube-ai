"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

// === admin-dropdown.tsx ===
// Created: 2025-09-16
// Purpose: Small client-side dropdown for admin links used in the Header.
// Exports:
//   - default AdminDropdown component
// Notes:
//   - Keeps behavior minimal and accessible (aria attributes, Escape to close,
//     click outside to close). No external deps.

export default function AdminDropdown(): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Admin
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Admin menu"
          className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-900"
        >
          <ul className="py-1">
            <li role="none">
              <Link
                role="menuitem"
                href="/admin/prompts"
                className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setOpen(false)}
              >
                Edit Prompts
              </Link>
            </li>
            <li role="none">
              <Link
                role="menuitem"
                href="/admin/benchmark"
                className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setOpen(false)}
              >
                Benchmark
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

/*
 * === admin-dropdown.tsx ===
 * Updated: 2025-09-16
 * Summary: Small accessible dropdown for admin links. Client component so it
 * can manage UI state in the header (server component).
 */
