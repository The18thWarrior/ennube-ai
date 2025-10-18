'use client'
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu"
// import { SignIn, SignOut } from "./auth-components"
//mport { signOut } from "next-auth/react"
import Link from "next/link"

export default function UserButton({user}: { user: { name: string | undefined | null, email: string | undefined | null, picture: string | undefined | null } | null }) {
  //const session = await auth()
  async function doLogout() {
    //await signOut({ redirectTo: "/auth/login" })
    redirect('/auth/logout')
  }
  if (!user) return null;
  return (
    <div className="flex items-center gap-2">
      {/* <span className="hidden text-md sm:inline-flex">
        {session.user.email}
      </span> */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={
                  user.picture ||
                  `https://api.dicebear.com/9.x/thumbs/svg?seed=1`
                }
                alt={user.name ?? "User"}
              />
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.name}
              </p>
              <p className="text-muted-foreground text-xs leading-none">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/account" className="cursor-pointer">
              Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/api-key" className="cursor-pointer">
              API Keys
            </Link>
          </DropdownMenuItem>
          {/* <DropdownMenuSeparator />          
          <DropdownMenuItem asChild>
            <Link href="/subscription" className="cursor-pointer">
              Billing
            </Link>
          </DropdownMenuItem> */}
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <form action={doLogout}>
              <Button type="submit" className="w-full">Sign out</Button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
