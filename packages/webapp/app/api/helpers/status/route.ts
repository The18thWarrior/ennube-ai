import { NextRequest, NextResponse } from "next/server";
import { getSalesforceCredentialsById } from "@/lib/db/salesforce-storage";
import { getGSuiteCredentialsById } from "@/lib/db/gsuite-storage";
import { getHubSpotCredentialsById } from "@/lib/db/hubspot-storage";
import { auth } from "@/auth";
import { ProviderType } from "@/lib/db/agent-settings-storage";

/**
 * GET endpoint to retrieve connection status for all integrations
 * Returns a boolean value for each integration type defined in ProviderType
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current session to ensure the request is authenticated
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch credentials for each integration type
    const sfCredential = await getSalesforceCredentialsById();
    const gsCredential = await getGSuiteCredentialsById();
    const hsCredential = await getHubSpotCredentialsById();
    
    // Determine connection status based on existence of access tokens
    const hasSalesforce = Boolean(sfCredential && sfCredential.accessToken);
    const hasGSuite = Boolean(gsCredential && gsCredential.accessToken);
    const hasHubSpot = Boolean(hsCredential && hsCredential.accessToken);
    const hasMSOffice = false; // Placeholder for future Microsoft Office integration
    
    // Create response that aligns with ProviderType in agent-settings-storage.ts
    const response: Record<ProviderType, boolean> = {
      sfdc: hasSalesforce,
      gmail: hasGSuite,
      hubspot: hasHubSpot,
      msoffice: hasMSOffice
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching integration status:", error);
    return NextResponse.json(
      { error: "Failed to retrieve integration status" },
      { status: 500 }
    );
  }
}
