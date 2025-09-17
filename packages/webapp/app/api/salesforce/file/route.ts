import { auth } from "@/auth";
import { getSalesforceCredentialsBySub } from "@/lib/db/salesforce-storage";
import { Readable } from "node:stream";
import { createSalesforceClient } from "@/lib/salesforce";
import { SalesforceAuthResult } from "@/lib/types";
import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";

const mimeByExt: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  txt: "text/plain",
  csv: "text/csv",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // …extend as needed
};

export async function GET(
  _req: NextRequest
) {
  const searchParams = _req.nextUrl.searchParams;
  const _sub = searchParams.get("sub");
  const contentVersionId = searchParams.get("contentVersionId");

  const session = await auth();
  const sub = _sub || session?.user?.auth0?.sub;
  if (!sub) {
    return NextResponse.json(
      { error: "Missing required parameter: sub" },
      { status: 400 }
    );
  }

  // Get Salesforce credentials for the user
  const credentials = await getSalesforceCredentialsBySub(sub);
  if (!credentials) {
    return NextResponse.json(
      { error: "No Salesforce credentials found for this user" },
      { status: 404 }
    );
  }

  // Create a Salesforce client from the stored credentials
  const authResult: SalesforceAuthResult = {
    success: true,
    userId: sub,
    accessToken: credentials.accessToken,
    instanceUrl: credentials.instanceUrl,
    refreshToken: credentials.refreshToken,
    userInfo: credentials.userInfo,
  };
  const client = createSalesforceClient(authResult);

  if (contentVersionId) {
    // Fetch Salesforce record by URL

    const contentVersion = await client.query(
      `SELECT Id, Title, FileExtension FROM ContentVersion WHERE Id = '${contentVersionId}' LIMIT 1`
    );
    console.log("ContentVersion query result:", contentVersion);
    const records = (
      contentVersion as {
        records: Array<{ Id: string; Title: string; FileExtension?: string }>;
      }
    ).records;

    const nodeStream = await client.streamContentVersion(contentVersionId);
    const ext = records[0].FileExtension ?? "";
    const filename = ext ? `${records[0].Title}.${ext}` : records[0].Title;
    const mime = mimeByExt[ext.toLowerCase()] ?? "application/octet-stream";

    // Read the stream into a buffer (workaround for Next.js/Node.js stream incompatibility)
    const chunks: Buffer[] = [];
    for await (const chunk of nodeStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const fileBuffer = Buffer.concat(chunks);

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  return NextResponse.json(
    { error: "Missing contentVersionId parameter" },
    { status: 400 }
  );
}
