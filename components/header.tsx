import ExecuteButton from "./agents/data-steward/data-steward-execute-button"
import UsageButton from "./agents/usage-button"
import { MainNav } from "./main-nav"
import { ThemeToggle } from "./theme-toggle"
import UserButton from "./user-button"
import { Button } from "@/components/ui/button"

export default async function Header() {
  return (
    <header className="sticky flex justify-center border-b">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <MainNav />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserButton />
        </div>
      </div>
    </header>
  )
}
