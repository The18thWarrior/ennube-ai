import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SignIn } from "@/components/auth-components"

export default async function LandingPage() {
  const session = await auth()
  
  if (session && session.accessToken) {
    redirect("/apps")
  } else {
    redirect("/auth/login")
  }
  return <></>
 
}
