
import { auth } from "@/auth"
import ExecuteButton from "./agents/data-steward/data-steward-execute-button"
import UsageButton from "./agents/usage-button"
import CustomLink from "./custom-link"
import { MainNav } from "./main-nav"
import { ThemeToggle } from "./theme-toggle"
import UserButton from "./user-button"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { isAdmin } from "@/lib/admin"
import Link from "next/link"
import AdminDropdown from "./admin-dropdown"


export default async function Header() {

  const session = await auth();
  if (!session?.user) return <header className="sticky flex justify-center bg-transparent"><div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6"></div></header>;
  
  const checkAdmin = isAdmin(session?.user?.auth0?.sub || '')

  return (
    <header className="sticky flex justify-center border-b bg-transparent">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
        <CustomLink href="/">
          <Button variant="none" className="p-0 text-lg font-bold content-end flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Home"
              width="48"
              height="48"
              className="min-w-8"
            />
            Ennube.ai
          </Button>
        </CustomLink>
        {checkAdmin && (
          <div className="flex items-center gap-4">
            <AdminDropdown />
          </div>
        )}
        </div>
        <MainNav />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserButton />
        </div>
      </div>
    </header>
  )
}
