"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function GoogleLoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleOAuthLogin = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      router.push('/api/gsuite/oauth2/authorize');
      // With redirect: true, we should not reach this code
      // as the browser will be redirected to Google
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}
      
      <Button 
        onClick={handleOAuthLogin} 
        className="w-full flex items-center justify-center gap-2" 
        disabled={isSubmitting}
        variant="outline"
      >
        <img src="/gmail-logo.webp" alt="Google Logo" className="h-5 w-5" />
        {isSubmitting ? "Redirecting..." : "Connect with Google Workspace"}
      </Button>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>
          You will be redirected to Google to authorize this application.
          No credentials are stored in this application when using OAuth.
        </p>
      </div>
    </div>
  );
}
