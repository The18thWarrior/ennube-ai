import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SignIn } from "@/components/auth-components"
import { CrmDataLoaderCard } from "@/components/chat/tools/crm-data-loader-card"

export default function LandingPage() {
  return (
    <>
    <CrmDataLoaderCard records={undefined}/>
    </>
  )
}
