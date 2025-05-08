import ExecuteButton from "./agents/data-steward/execute-button"
import UsageButton from "./agents/usage-button"
import { MainNav } from "./main-nav"
import UserButton from "./user-button"
import { Button } from "@/components/ui/button"

export default async function Header() {
  return (
    <header className="sticky flex justify-center border-b">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
        <MainNav />
        <div className="flex items-center gap-4">
          <UserButton />
        </div>
      </div>
    </header>
  )
}
