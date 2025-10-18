
import { auth } from "@/auth"
import { isAdmin } from "@/lib/admin"
import HeaderClient from "./header-client"
import { SignIn } from "./auth-components";

interface SessionUser { name: string | undefined | null; email: string | undefined | null; image: string | undefined | null};

export default async function Header() {
  const session = await auth();

  // If there's no authenticated user, preserve the previous minimal header.
  if (!session?.user) {
    return null;
    // return (
    //   <header className="fixed top-0 left-0 right-0 z-40 bg-transparent">
    //     <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
    //       <SignIn provider={'auth0'} />
    //     </div>
    //   </header>
    // )
  }

  const checkAdmin = isAdmin(session?.user.sub || '')

  // Render a client component that will read the current pathname and
  // manage the sticky positioning, floating button, and page padding.
  return <HeaderClient checkAdmin={checkAdmin} user={{...session.user, image: session.user.image} as SessionUser | null} />
}
