"use client";

// === render-get-data-tool page.tsx ===
// Created: 2025-09-10 12:00
// Purpose: Example/demo page that shows several sample usages of the
//          RenderGetDataToolCallComponent with different result shapes.
// Exports:
//  - default React component for the example route
// Notes:
//  - This page is a client component because the demo component uses hooks.
//  - Located at: /app/examples/render-get-data-tool

import React from "react";
import RenderGetDataToolCallComponent from "../../../components/chat/tools/render-get-data-tool-call";

export default function Page() {
  const args = { sobject: "Account", filter: "Active = true" };

  const exampleNoData = {
    results: { records: [], totalSize: 0 },
    query: { sql: "SELECT Id, Name FROM Account WHERE Active = true" },
  };

  const exampleTotalOnly = {
    results: { records: [], totalSize: 42 },
    query: { sql: "SELECT COUNT() FROM Account WHERE Active = true" },
  };

  const exampleSingleRecord = {
    results: {
      records: [
        {
          Id: "001xx000003NGsYAAW",
          Name: "Acme Corporation",
          Phone: "+1 (555) 123-4567",
          Website: "https://acme.example",
          attributes: { type: "Account" },
        },
      ],
      totalSize: 1,
    },
    query: { sql: "SELECT Id, Name, Phone, Website FROM Account WHERE Id = '001xx...'" },
  };

  const exampleMultipleRecords = {
    results: {
      records: [
        { Id: "001A", Name: "Alpha LLC", Industry: "Software", attributes: { type: "Account" } },
        { Id: "001B", Name: "Beta Inc.", Industry: "Finance", attributes: { type: "Account" } },
        { Id: "001C", Name: "Gamma Co.", Industry: "Retail", attributes: { type: "Account" } },
      ],
      totalSize: 3,
    },
    query: { sql: "SELECT Id, Name, Industry FROM Account LIMIT 3" },
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">RenderGetDataToolCall — Examples</h1>

      <section className="space-y-2">
        <h2 className="text-lg">No data (empty result)</h2>
        <div className="max-w-xl">
          <RenderGetDataToolCallComponent args={args} result={exampleNoData} theme="light" />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg">Total count only</h2>
        <div className="max-w-xl">
          <RenderGetDataToolCallComponent args={args} result={exampleTotalOnly} theme="light" />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg">Single record (detail view)</h2>
        <div className="max-w-xl">
          <RenderGetDataToolCallComponent args={args} result={exampleSingleRecord} theme="light" />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg">Multiple records (list view)</h2>
        <div className="max-w-3xl">
          <RenderGetDataToolCallComponent args={{ sobject: "Account", filter: null }} result={exampleMultipleRecords} theme="light" />
        </div>
      </section>
    </div>
  );
}

/*
 * === render-get-data-tool page.tsx ===
 * Updated: 2025-09-10 12:00
 * Summary: Demo route for the RenderGetDataToolCallComponent.
 */
