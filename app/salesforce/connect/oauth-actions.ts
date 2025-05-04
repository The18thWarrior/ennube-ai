"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";

/**
 * Server action for handling Salesforce OAuth2 logout
 */
export async function oauthSalesforceLogout() {
  try {
    // Use NextAuth's signOut function to handle OAuth2 logout
    await signOut({ redirectTo: "/salesforce" });
    
    // Revalidate the Salesforce page
    revalidatePath("/salesforce");
    
    return { success: true };
  } catch (error) {
    console.error("Salesforce OAuth logout error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}
