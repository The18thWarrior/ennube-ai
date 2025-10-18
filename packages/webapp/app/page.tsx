//import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SignIn } from "@/components/auth-components"
import { auth0 } from "@/lib/auth0Client"

export default async function LandingPage() {
  //const session = await auth()

  const session2 = await auth0.getSession();
  
  if (session2 && session2.user?.sub) {
    redirect("/apps")
  } else {
    redirect("/authorization/login")
  }
  return <></>
 
}
