// === custom-profile-tool-result.tsx ===
// Created: 2025-07-28
// Purpose: Wrapper to map customer profile tool results to CrmRecordListCard
// Exports:
//   - CustomProfileToolResult
// Interactions:
//   - Used by: chat tools, profile UIs
// Notes:
//   - Maps customer profile API/tool data to CrmRecordListCard format

import React from "react";
import { CrmResultCard } from "../tools/crm-result-card";
import { CrmRecordSummary } from "../tools/crm-record-list-card";
import { User, Briefcase, Check, Timer, Box } from "lucide-react";
import { CustomerProfile } from "@/hooks/useCustomerProfile";
import { nanoid } from "nanoid";

/**
 * OVERVIEW
 *
 * - Purpose: Adapt customer profile tool results to CrmRecordListCard.
 * - Assumptions: Profiles are array of objects with id, name, owner, type, etc.
 * - Edge Cases: Handles empty, missing, or malformed data.
 * - How it fits: Enables chat tools to display profile results in a CRM card/table.
 * - Future: Add richer field mapping, icons, or custom actions.
 */

export interface CustomProfileToolResultProps {
  profiles: CustomerProfile[];
  filterApplied?: string;
  objectType?: string;
  onSelectProfile: (profileId: string) => void;
}

export const CustomProfileToolResult: React.FC<CustomProfileToolResultProps> = ({
  profiles,
  filterApplied,
  objectType = "CustomerProfile",
  onSelectProfile,
}) => {
  // Map customer profiles to CrmRecordSummary[]
  const records: CrmRecordSummary[] = profiles.map((profile) => ({
    id: profile.id || nanoid(),
    objectType,
    fields: [
      {
        icon: Briefcase,
        label: "Name",
        value: profile.customerProfileName,
      },
      {
        icon: Check,
        label: "Active",
        value: profile.active ? "Active" : "Inactive",
      },
      {
        icon: Timer,
        label: "Updated At",
        value: profile.updatedAt || "-",
      },
      ...Object.keys(profile).filter((key) => key !== "customerProfileName" && key !== "updatedAt" && key !== "active").map((field) => ({
        icon: Box, // Default to User icon if not specified
        label: field,
        value: profile[field as keyof CustomerProfile] || "-", // Default to "-" if value is missing
      })),
      // Add more fields as needed
    ],
  }));

  return (
    <CrmResultCard
      records={records}
      filterApplied={filterApplied}
      totalReturned={records.length}
      objectType={objectType}
      customLabel={true}
    />
  );
};

/**
 * === custom-profile-tool-result.tsx ===
 * Updated: 2025-07-28
 * Summary: Wrapper for mapping customer profile tool results to CrmRecordListCard.
 * Key Components:
 *   - CustomProfileToolResult: main wrapper component
 * Dependencies:
 *   - CrmRecordListCard
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Add more field mappings as profile structure evolves
 */
