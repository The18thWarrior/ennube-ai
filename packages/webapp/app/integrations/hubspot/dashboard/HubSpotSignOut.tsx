"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HubSpotSignOut() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    
    try {
      const response = await fetch("/api/hubspot/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      router.push("/integrations/hubspot/connect");
      router.refresh();
    } catch (error) {
      console.log("Failed to sign out:", error);
      setIsSigningOut(false);
    }
  };

  return (
    <Button 
      onClick={handleSignOut}
      variant="outline" 
      disabled={isSigningOut}
    >
      {isSigningOut ? "Signing out..." : "Disconnect HubSpot"}
    </Button>
  );
}
