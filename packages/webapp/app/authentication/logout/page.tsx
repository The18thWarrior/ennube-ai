'use client'
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export default function LogoutPage() {
  async function doLogout() {
    await signOut({ redirectTo: "/auth/login" })
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-10">
      <h1 className="text-2xl font-semibold">Sign out</h1>
      <p className="text-muted-foreground">Are you sure you want to sign out?</p>
      <form action={doLogout}>
        <Button type="submit" className="w-full">Sign out</Button>
      </form>
    </div>
  )
}
