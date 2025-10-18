"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Server action for handling HubSpot OAuth2 logout
 */
export async function oauthHubspotLogout() {
  try {
    // Use NextAuth's signOut function to handle OAuth2 logout
    // await signOut({ redirectTo: "/integrations/hubspot" });

    // Revalidate the HubSpot page
    revalidatePath("/integrations/hubspot");

    return { success: true };
  } catch (error) {
    console.log("HubSpot OAuth logout error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}
