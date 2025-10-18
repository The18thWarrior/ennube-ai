'use client'
import Link from "next/link"
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const AuthErrorPage: React.FC = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      {error && <p className="text-red-500 mb-2">{friendlyError(error)}</p>}
      <p className="mb-4">There was a problem signing you in. Please try again or contact support.</p>
      <a href="/auth" className="text-blue-500 underline">Back to Login</a>
    </div>
  );
};

function friendlyError(code?: string) {
  switch (code) {
    case "Configuration":
      return "There is a problem with the server configuration."
    case "AccessDenied":
      return "Access denied. Please try a different account."
    case "Verification":
      return "The sign in link is no longer valid. Please request a new one."
    default:
      return "Something went wrong. Please try again."
  }
}


export default function LoginPageWrap() {
  return (
    <Suspense><AuthErrorPage /></Suspense>
  )
}
