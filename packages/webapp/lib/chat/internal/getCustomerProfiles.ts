// === getCustomerProfile.ts ===
// Created: 2025-07-27
// Purpose: Tool for agents to retrieve all customer profiles for a user
// Exports:
//   - getCustomerProfileTool
// Interactions:
//   - Used by: agent chat tools
// Notes:
//   - Uses getUserCustomerProfiles from customer-profile-storage

// import { getUserCustomerProfiles } from "@/lib/db/customer-profile-storage";
import { tool } from "ai";
import z from "zod/v4";
import { getBaseUrl } from "../helper";
import { buildCalloutWithHeader } from "@/lib/n8n/utils";

/**
 * OVERVIEW
 *
 * - Purpose: Retrieve all customer profiles for a given userId.
 * - Assumptions: userId is a valid string.
 * - Edge Cases: No profiles found, invalid userId.
 * - How it fits: Enables agents to fetch all customer profiles for a user.
 * - Future: Add pagination or filtering if needed.
 */

export const getCustomerProfilesTool = (userId: string) => {
    return tool({
      description: "Retrieve all customer profiles for a user by userId.",
      inputSchema: z.object({}),
      execute: async ({ }) => {
        if (!userId) {
          return { success: false, message: "Unauthorized: userId is required" };
        }

        try {
          const res = await buildCalloutWithHeader(`/api/customer-profile?subId=${encodeURIComponent(userId)}`, null, 'GET');
          if (!res.ok) {
            console.log("API error:", res.status, await res.text());
            return { success: false, message: `API error: ${res.status}` };
          }
          const data = await res.json();
          if (!data || !Array.isArray(data) || data.length === 0) {
            return { profiles: [], message: "No customer profiles found for this user." };
          }
          return { profiles: data };
        } catch (error) {
          console.log("Fetch error:", error);
          return { success: false, message: `Fetch error: ${error instanceof Error ? error.message : String(error)}` };
        }
      }
    });
}

/**
 * === getCustomerProfile.ts ===
 * Updated: 2025-07-27
 * Summary: Tool for retrieving all customer profiles for a user.
 * Key Components:
 *   - getCustomerProfileTool: agent tool
 * Dependencies:
 *   - customer-profile-storage
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Returns all profiles for a userId
 */
