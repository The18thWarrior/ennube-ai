"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SalesforceSignOut() {
  const router = useRouter();
  
  const handleSignOut = async () => {
    try {
      // Remove Salesforce credentials via API
      const res = await fetch("/api/salesforce/credentials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        // No body required per API spec
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete credentials");
      }
      // Optionally sign out from NextAuth
      // await signOut({ redirect: true, callbackUrl: "/integrations/salesforce/connect" });
      // Optionally refresh or redirect
      router.push("/integrations/salesforce/connect");
      router.refresh();
    } catch (error) {
      console.log("Error signing out from Salesforce:", error);
      // Optionally show user feedback
    }
  };
  
  return (
    <Button variant="destructive" onClick={handleSignOut}>
      Sign Out from Salesforce
    </Button>
  );
}
