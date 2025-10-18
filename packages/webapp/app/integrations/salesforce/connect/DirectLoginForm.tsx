"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

type OAuth2LoginFormProps = {
  onSubmit?: (formData: FormData) => Promise<{
    success: boolean;
    sessionId?: string;
    error?: string;
  }>;
};

export default function DirectLoginForm({ onSubmit }: OAuth2LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instanceUrl, setInstanceUrl] = useState<string>("https://login.salesforce.com");
  const router = useRouter();

  const handleOAuthLogin = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      //await fetch("/api/salesforce/oauth2?loginUrl=" + instanceUrl);
      router.push('/api/salesforce/oauth2?loginUrl=' + instanceUrl);
      // With redirect: true, we should not reach this code
      // as the browser will be redirected to Salesforce
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="loginUrl">
          Salesforce Instance URL <span className="text-sm text-muted-foreground">(Optional)</span>
        </Label>
        <Input
          id="loginUrl"
          name="loginUrl"
          type="text"
          placeholder="https://login.salesforce.com"
          defaultValue="https://login.salesforce.com"
          onChange={(e) => setInstanceUrl(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Use test.salesforce.com for sandboxes
        </p>
      </div>
      
      {error && (
        <div className="p-3 text-sm bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}
      
      <Button 
        onClick={handleOAuthLogin} 
        className="w-full" 
        disabled={isSubmitting}
      >
        <img src="/salesforce-logo.png" alt="Salesforce Logo" className="h-5 w-5" />
        {isSubmitting ? "Redirecting..." : "Connect with Salesforce"}
      </Button>
      
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>
          You will be redirected to Salesforce to authorize this application.
          No credentials are stored in this application when using OAuth.
        </p>
      </div>
    </div>
  );
}
