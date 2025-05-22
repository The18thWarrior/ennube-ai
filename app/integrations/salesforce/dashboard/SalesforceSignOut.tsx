"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function SalesforceSignOut() {
  const router = useRouter();
  
  const handleSignOut = async () => {
    try {
      // Use NextAuth's signOut function for OAuth2 logout
      await signOut({ 
        redirect: true,
        callbackUrl: "/integrations/salesforce/connect" 
      });
      
      // If redirect is false, manually redirect
      // router.push("/salesforce/connect");
      // router.refresh();
    } catch (error) {
      console.error("Error signing out from Salesforce:", error);
    }
  };
  
  return (
    <Button variant="destructive" onClick={handleSignOut}>
      Sign Out from Salesforce
    </Button>
  );
}
