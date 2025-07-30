import ExecuteButton from "./agents/data-steward/data-steward-execute-button"
import UsageButton from "./agents/usage-button"
import CustomLink from "./custom-link"
import { MainNav } from "./main-nav"
import { ThemeToggle } from "./theme-toggle"
import UserButton from "./user-button"
import { Button } from "@/components/ui/button"
import Image from "next/image"


export default async function Header() {
  return (
    <header className="sticky flex justify-center border-b bg-transparent">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
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
        <MainNav />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserButton />
        </div>
      </div>
    </header>
  )
}
