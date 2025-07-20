// === page.tsx ===
// Created: 2025-07-19
// Purpose: Demo/test page for dataValidation package with mock data
// Exports:
//   - default TestDataValidationPage (Next.js page component)
// Interactions:
//   - Used by: /test route
// Notes:
//   - Uses mock data and both SingleRecordValidator and MultiRowValidator
'use client'

import dynamic from 'next/dynamic'
import React, { useState } from 'react';
import { SingleRecordValidator, MultiRowValidator, matchRows, detectAnomalies, ModernComparisonTable } from '@ennube-ai/data-validation';

/**
 * OVERVIEW
 *
 * - Purpose: Showcases the dataValidation package with mock data and UI components.
 * - Assumptions: dataValidation exports React components and utility functions.
 * - Edge Cases: Handles empty, invalid, and edge-case mock data.
 * - How it fits: Used for dev/demo/testing, not production.
 * - Future: Could be extended for live data or more complex scenarios.
 */


// Mock data for two sources
type MockRecord = { id: string; name: string; age: number; email: string };

const sourceA: MockRecord[] = [
  { id: '1', name: 'Alice', age: 30, email: 'alice@example.com' },
  { id: '2', name: 'Bob', age: 25, email: 'bob@example.com' },
  { id: '3', name: 'Eve', age: 999, email: 'not-an-email' },
  { id: '4', name: 'Charlie', age: 35, email: 'charlie@example.com' },
  { id: '5', name: 'David', age: 28, email: 'david@example.com' },
  { id: '6', name: 'Emma', age: 32, email: 'emma@example.com' },
];
const sourceB: MockRecord[] = [
  { id: '1', name: 'Alice', age: 30, email: 'alice@company.com' },
  { id: '2', name: 'Bobby', age: 25, email: 'bob@example.com' },
  { id: '3', name: 'Eve', age: 999, email: 'eve@example.com' },
  { id: '4', name: 'Charlie Brown', age: 35, email: 'charlie@company.com' },
  { id: '5', name: 'Dave', age: 28, email: 'david@company.com' },
  { id: '6', name: 'Emma Watson', age: 32, email: 'emma@company.com' },
];

const sourceC: MockRecord[] = [
  { id: '1', name: 'Alice', age: 28, email: 'alice@ennube.ai' },
  { id: '2', name: 'Bobby', age: 25, email: 'bob@example.com' },
  { id: '3', name: 'Eve', age: 999, email: 'eve@example.com' },
  { id: '4', name: 'Charlie Brown', age: 35, email: 'charlie@company.com' },
  { id: '5', name: 'Dave', age: 28, email: 'david@company.com' },
  { id: '6', name: 'Emma Watson', age: 32, email: 'emma@company.com' },
];

const TestDataValidationPage = () => {
  //const [currentView, setCurrentView] = useState<'classic' | 'modern'>('modern');
  
  // Example: matchRows usage
  const matchedGroups = matchRows([sourceA, sourceB, sourceC], 'id');
  // Example: detectAnomalies usage (for first group)
  const anomalies = matchedGroups.length > 0 ? detectAnomalies(matchedGroups[0], 0.8) : null;

  // Submit handlers for demonstration
  const handleSingleRecordSubmit = (resolvedRecord: MockRecord) => {
    console.log('Single record resolved:', resolvedRecord);
    alert(`Single record resolved for ID: ${resolvedRecord.id}`);
  };

  const handleMultiRecordSubmit = (resolvedRecord: MockRecord) => {
    console.log('Multi record resolved:', resolvedRecord);
    alert(`Multi record resolved for ID: ${resolvedRecord.id}`);
  };

  const handleModernSubmit = (resolvedRecord: MockRecord) => {
    console.log('Modern interface resolved:', resolvedRecord);
    alert(`Modern interface resolved for ID: ${resolvedRecord.id}`);
  };

  if (matchedGroups.length > 0) {
    return (
      <div className="relative">
        {/* <button
          onClick={() => setCurrentView('classic')}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-white text-black rounded-lg shadow-lg hover:bg-gray-100"
        >
          ← Back to Classic View
        </button> */}
        <ModernComparisonTable 
          group={matchedGroups[0]} 
          threshold={0.8} 
          onSubmit={handleModernSubmit}
        />
      </div>
    );
  }

//   return (
//     <main className="p-8 max-w-4xl mx-auto">
//       <div className="flex items-center justify-between mb-6">
//         <h1 className="text-2xl font-bold">Data Validation Demo</h1>
//         <button
//           onClick={() => setCurrentView('modern')}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//         >
//           🚀 Try Modern Interface
//         </button>
//       </div>
      
//       <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
//         <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🎨 New Modern Design Available!</h3>
//         <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
//           We've implemented a complete modern redesign based on the provided feedback with:
//         </p>
//         <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
//           <li>• Card-based layout with value chips and source provenance</li>
//           <li>• Progress tracking and conflict indicators</li>
//           <li>• Undo/redo functionality and sticky footer controls</li>
//           <li>• Full-screen interface with modern dark theme</li>
//           <li>• Enhanced UX with confidence scoring and status indicators</li>
//         </ul>
//       </div>

//       <section className="mb-8">
//         <h2 className="text-xl font-semibold mb-2">Single Record Validator</h2>
//         <p className="text-sm text-gray-600 mb-4">
//           Select values or enter custom values, then submit to resolve the record.
//         </p>
//         <SingleRecordValidator 
//           sources={[sourceA, sourceB]} 
//           idKey="id" 
//           threshold={0.8} 
//           onSubmit={handleSingleRecordSubmit}
//         />
//       </section>
//       <section className="mb-8">
//         <h2 className="text-xl font-semibold mb-2">Multi Row Validator</h2>
//         <p className="text-sm text-gray-600 mb-4">
//           Browse through multiple records with pagination. Each record can be individually resolved.
//         </p>
//         <MultiRowValidator 
//           sources={[sourceA, sourceB]} 
//           idKey="id" 
//           threshold={0.8} 
//           onSubmit={handleMultiRecordSubmit}
//           pageSize={2}
//         />
//       </section>
//       <section className="mb-8">
//         <h2 className="text-xl font-semibold mb-2">matchRows Example</h2>
//         <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto">{JSON.stringify(matchedGroups, null, 2)}</pre>
//       </section>
//       <section>
//         <h2 className="text-xl font-semibold mb-2">detectAnomalies Example (First Group)</h2>
//         <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto">{JSON.stringify(anomalies, null, 2)}</pre>
//       </section>
//     </main>
//   );
};

export default dynamic(() => Promise.resolve(TestDataValidationPage), {
  ssr: false
})

/*
 * === page.tsx ===
 * Updated: 2025-07-19
 * Summary: Demo page for dataValidation package with mock data, user selection, and submit functionality
 * Key Components:
 *   - TestDataValidationPage: Main page with submit handlers
 *   - SingleRecordValidator, MultiRowValidator: Interactive components with submit callbacks
 * Dependencies:
 *   - dataValidation package (local import)
 * Version History:
 *   v1.0 – initial
 *   v1.1 – added submit handlers and expanded test data for pagination demo
 * Notes:
 *   - For dev/demo only
 *   - Shows user selection, custom inputs, and submit functionality
 */
