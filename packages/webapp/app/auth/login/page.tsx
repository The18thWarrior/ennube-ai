'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import Link from "next/link"
//import { signIn } from "@/auth"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

type PageProps = {
  searchParams?: { callbackUrl?: string; error?: string }
}

function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  async function signInWithGoogle() {
    await signIn("auth0", { redirectTo: callbackUrl })
  }

  async function signInWithEmail(formData: FormData) {
    const email = String(formData.get("email") || "").trim()
    if (!email) return
    await signIn("email", { email, redirectTo: callbackUrl })
  }

  return (
    <div className="flex min-h-[80vh] w-full items-stretch overflow-hidden rounded-xl border bg-background">
      {/* Left: Login form */}
      <div className="flex w-full max-w-xl flex-col justify-center gap-6 p-8 sm:p-10">
        <div className="mb-2">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-1 text-sm">Sign in to continue to Ennube.ai</p>
        </div>

        {error ? (
          <div className="text-sm text-red-600" role="alert">
            {friendlyError(error)}
          </div>
        ) : null}

        <form action={signInWithGoogle} className="space-y-4">
          <Button type="submit" variant="default" className="w-full">
            Login
          </Button>
        </form>
        {/* 
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-muted-foreground text-xs">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        
          <Card className="shadow-none">
            <CardHeader>
              <CardDescription>We’ll email you a magic link for passwordless sign in.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={signInWithEmail} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                </div>
                <Button type="submit" className="w-full">Send magic link</Button>
              </form>
            </CardContent>
            <CardFooter className="justify-between text-xs text-muted-foreground">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </CardFooter>
          </Card>

          <p className="text-muted-foreground mt-2 text-xs">
            New to Ennube.ai? <Link href="/" className="underline">Learn more</Link>
          </p> 
        */}
      </div>

      {/* Right: Hero panel to match screenshot-style layout */}
      <div className="relative hidden flex-1 items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-500 p-10 text-white md:flex">
        <div className="max-w-md">
          <p className="text-xs/5 ">🚀🔥📱💯✨🤩👍</p>
          <h2 className="mt-2 text-3xl font-bold leading-tight">Ready to transform your CRM experience?</h2>
          <p className="mt-3 text-sm/6 opacity-90">
            Join the growing number of businesses using AI agents to enhance their customer relationship management.
          </p>
          <div className="mt-6">
            <Link href="https://ennube.ai" className="inline-flex items-center rounded-md bg-white/90 px-4 py-2 text-sm font-medium text-indigo-700 shadow hover:bg-white">
              Explore Ennube.ai
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10" />
      </div>
    </div>
  )
}

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
    <Suspense><LoginPage /></Suspense>
  )
}