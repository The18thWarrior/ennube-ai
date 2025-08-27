// === createCustomerProfile.ts ===
// Created: 2025-07-27
// Purpose: Tool for agents to create a new customer profile
// Exports:
//   - createCustomerProfileTool
// Interactions:
//   - Used by: agent chat tools
// Notes:
//   - Uses saveCustomerProfile from customer-profile-storage

// import { saveCustomerProfile } from "@/lib/db/customer-profile-storage";
import { tool } from "ai";
import z from "zod";
import { getBaseUrl } from "../helper";
import { buildCalloutWithHeader } from "@/lib/n8n/utils";

/**
 * OVERVIEW
 *
 * - Purpose: Create a new customer profile with required and optional fields.
 * - Assumptions: All required fields are provided and valid.
 * - Edge Cases: Missing required fields, invalid data types, DB errors.
 * - How it fits: Enables agents to create new customer profile records.
 * - Future: Add field-level validation, duplicate checks.
 */

export const createCustomerProfileTool = (userId: string) => {
    return tool({
        description: "Create a new customer profile. Requires userId, customerProfileName, commonIndustries, frequentlyPurchasedProducts, geographicRegions, averageDaysToClose, and active.",
        inputSchema: z.object({
            customerProfileName: z.string().min(1, "customerProfileName is required"),
            commonIndustries: z.string().min(1, "commonIndustries is required"),
            frequentlyPurchasedProducts: z.string().min(1, "frequentlyPurchasedProducts is required"),
            geographicRegions: z.string().min(1, "geographicRegions is required"),
            averageDaysToClose: z.number().int().min(0, "averageDaysToClose must be a non-negative integer"),
            active: z.boolean(),
            socialMediaPresence: z.string().optional(),
            channelRecommendation: z.string().optional(),
            accountStrategy: z.string().optional(),
            accountEmployeeSize: z.string().optional(),
            accountLifecycle: z.string().optional()
        }),
        execute: async (profile) => {
            // Get userId from session (if needed) or expect it to be provided elsewhere
            try {
                const res = await buildCalloutWithHeader(`/api/customer-profile?subId=${encodeURIComponent(userId)}`, profile);
                if (!res.ok) {
                    return { success: false, message: `API error: ${res.status}` };
                }
                const data = await res.json();
                if (!data || !data.success) {
                    return { success: false, message: data?.message || 'Failed to create customer profile.' };
                }
                return { success: true, id: data.id };
            } catch (error) {
                return { success: false, message: `Fetch error: ${error instanceof Error ? error.message : String(error)}` };
            }
        }
        });
}

/**
 * === createCustomerProfile.ts ===
 * Updated: 2025-07-27
 * Summary: Tool for creating a new customer profile.
 * Key Components:
 *   - createCustomerProfileTool: agent tool
 * Dependencies:
 *   - customer-profile-storage
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Requires all required fields for creation
 */
