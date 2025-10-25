// === page.tsx ===
// Created: 2025-10-25 12:00
// Purpose: Admin page to display the PlanningComponent with mock data
// Exports:
//   - Default: React component for the page
// Interactions:
//   - Renders PlanningComponent
// Notes:
//   - Uses mock data for demonstration

import PlanningComponent from "@/components/chat/default/planning-component";

/**
 * OVERVIEW
 *
 * - Purpose: Displays the PlanningComponent with mock data for testing/admin purposes
 * - Assumptions: PlanningComponent is available and functional
 * - Edge Cases: None specific
 * - How it fits into the system: Part of admin interface for component previews
 * - Future Improvements: Add dynamic data or multiple instances
 */

export default function Page() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Planning Component Demo</h1>
      <PlanningComponent level="info" message="Working on it" />
    </div>
  );
}

/*
 * === page.tsx ===
 * Updated: 2025-10-25 12:00
 * Summary: Renders a page with PlanningComponent using mock data
 * Key Components:
 *   - Page: Main component exporting the page
 * Dependencies:
 *   - Requires: PlanningComponent from @/components/chat/default/planning-component
 * Version History:
 *   v1.0 – initial creation
 * Notes:
 *   - Mock data used: level="info", message="This is a mock planning message for demonstration."
 */
