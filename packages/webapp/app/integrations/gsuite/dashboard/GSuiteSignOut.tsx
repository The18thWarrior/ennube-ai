"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function GSuiteSignOut() {
  const router = useRouter();
  
  const handleSignOut = async () => {
    try {
      // Call the API to logout from GSuite first
      await fetch('/api/gsuite/logout', { method: 'POST' });
      
      // Then use NextAuth's signOut function
      await signOut({ 
        redirect: true,
        callbackUrl: "/integrations/gsuite/connect" 
      });
      
      // If redirect is false, manually redirect
      // router.push("/integrations/gsuite/connect");
      // router.refresh();
    } catch (error) {
      console.error("Error signing out from Google Workspace:", error);
    }
  };
  
  return (
    <Button variant="destructive" onClick={handleSignOut}>
      Sign Out from Google Workspace
    </Button>
  );
}
