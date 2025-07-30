import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getHubSpotCredentialsById } from "@/lib/db/hubspot-storage";
import { HubSpotClient } from "@/lib/hubspot";

/**
 * GET endpoint to retrieve schema information for HubSpot objects
 * @param request - The incoming request
 * @returns Schema information for the specified object type
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

    // Get object type from query parameters
    const { searchParams } = new URL(request.url);
    const objectType = searchParams.get("objectType");

    if (!objectType) {
      return NextResponse.json(
        { error: "Object type is required" },
        { status: 400 }
      );
    }

    // Get HubSpot credentials
    const credentials = await getHubSpotCredentialsById();
    if (!credentials || !credentials.accessToken) {
      return NextResponse.json(
        { error: "HubSpot credentials not found" },
        { status: 404 }
      );
    }

    // Initialize HubSpot client
    const hubspotClient = new HubSpotClient(
      credentials.accessToken,
      credentials.refreshToken,
      process.env.HUBSPOT_CLIENT_ID,
      process.env.HUBSPOT_CLIENT_SECRET,
      credentials.expiresAt,
      credentials
    );

    // Get schema information using the describe method
    const schemaInfo = await hubspotClient.describe(objectType);
    
    return NextResponse.json(schemaInfo);
  } catch (error) {
    console.error("Error fetching HubSpot schema:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 }
    );
  }
}