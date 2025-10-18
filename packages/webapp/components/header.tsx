
import { auth } from "@/auth"
import { isAdmin } from "@/lib/admin"
import HeaderClient from "./header-client"

interface SessionUser { name: string | undefined | null; email: string | undefined | null; image: string | undefined | null};

export default async function Header() {
  const session = await auth();

  // If there's no authenticated user, preserve the previous minimal header.
  if (!session?.user) {
    return null;
  }

  const checkAdmin = isAdmin(session?.user.sub || '')

  // Render a client component that will read the current pathname and
  // manage the sticky positioning, floating button, and page padding.
  return <HeaderClient checkAdmin={checkAdmin} user={{...session.user, image: session.user.picture} as SessionUser | null} />
}
