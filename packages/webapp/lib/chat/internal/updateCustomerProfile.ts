// === updateCustomerProfile.ts ===
// Created: 2025-07-27
// Purpose: Tool for agents to update a customer profile by ID
// Exports:
//   - updateCustomerProfileTool
// Interactions:
//   - Used by: agent chat tools
// Notes:
//   - Uses updateCustomerProfile from customer-profile-storage

// import { updateCustomerProfile } from "@/lib/db/customer-profile-storage";
import { tool } from "ai";
import z from "zod/v4";
import { getBaseUrl } from "../helper";
import { buildCalloutWithHeader } from "@/lib/n8n/utils";

/**
 * OVERVIEW
 *
 * - Purpose: Update a customer profile by ID with provided fields.
 * - Assumptions: id is valid, updates are partial and validated.
 * - Edge Cases: No fields to update, invalid id, update fails.
 * - How it fits: Enables agents to update customer profile records.
 * - Future: Add field-level validation, audit logging.
 */

export const updateCustomerProfileTool = (userId: string) => {
    return tool({
        description: "Update a customer profile by ID. Accepts partial fields to update.",
        inputSchema: z.object({
            id: z.string().min(1, "id is required"),
            updates: z.record(z.any()).refine(obj => Object.keys(obj).length > 0, {
            message: "At least one field to update is required."
            })
        }),
        execute: async ({ id, updates }) => {
            if (!userId) {
                return { success: false, message: "Unauthorized: userId is required" };
            }
            if (!id) throw new Error("id is required");
            if (!updates || Object.keys(updates).length === 0) throw new Error("No update fields provided");
            try {
                const res = await buildCalloutWithHeader(`/api/customer-profile?subId=${encodeURIComponent(userId)}`, { id, updates }, 'PUT');
                
                if (!res.ok) {
                    return { success: false, message: `API error: ${res.status}` };
                }
                const data = await res.json();
                if (!data || !data.success) {
                    return { success: false, message: data?.message || 'Failed to update customer profile.' };
                }
                return { success: true };
            } catch (error) {
                return { success: false, message: `Fetch error: ${error instanceof Error ? error.message : String(error)}` };
            }
        }
    });
}

/**
 * === updateCustomerProfile.ts ===
 * Updated: 2025-07-27
 * Summary: Tool for updating a customer profile by ID.
 * Key Components:
 *   - updateCustomerProfileTool: agent tool
 * Dependencies:
 *   - customer-profile-storage
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Accepts partial updates for any profile field
 */
