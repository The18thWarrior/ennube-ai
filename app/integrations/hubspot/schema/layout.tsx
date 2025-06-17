import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getHubSpotCredentialsById } from "@/lib/db/hubspot-storage";

export const metadata = {
  title: "HubSpot Schema Mapping",
  description: "Configure HubSpot schema mappings for integration",
};

export default async function HubSpotSchemaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check for authentication
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check for HubSpot credentials
  const credentials = await getHubSpotCredentialsById();
  if (!credentials || !credentials.accessToken) {
    redirect("/integrations/hubspot/connect");
  }

  return (
    <main className="min-h-screen bg-background">
      {children}
    </main>
  );
}
