import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getHubSpotCredentialsById, updateHubSpotTimestampField } from "@/lib/db/hubspot-storage";

/**
 * GET endpoint to retrieve HubSpot settings including timestamp field
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

    // Get HubSpot credentials
    const credentials = await getHubSpotCredentialsById();
    if (!credentials) {
      return NextResponse.json(
        { error: "HubSpot credentials not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      account_timestamp_field: credentials.account_timestamp_field || ""
    });
  } catch (error) {
    console.log("Error fetching HubSpot settings:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 }
    );
  }
}

/**
 * PATCH endpoint to update HubSpot timestamp field setting
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get the current session to ensure the request is authenticated
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    if (!body.account_timestamp_field) {
      return NextResponse.json(
        { error: "account_timestamp_field is required" },
        { status: 400 }
      );
    }

    // Update the timestamp field
    const success = await updateHubSpotTimestampField(body.account_timestamp_field);
    if (!success) {
      return NextResponse.json(
        { error: "Failed to update timestamp field" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("Error updating HubSpot settings:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 }
    );
  }
}
