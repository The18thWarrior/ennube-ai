import Link from "next/link"

export default function AuthErrorPage({ searchParams }: { searchParams?: { error?: string } }) {
  const error = searchParams?.error
  return (
    <div className="mx-auto max-w-lg space-y-4 py-10">
      <h1 className="text-2xl font-semibold">Authentication error</h1>
      <p className="text-muted-foreground">{friendlyError(error)}</p>
      <div className="pt-4">
        <Link href="/auth/login" className="underline">Back to sign in</Link>
      </div>
    </div>
  )
}

function friendlyError(code?: string) {
  switch (code) {
    case "Configuration":
      return "There is a problem with the server configuration."
    case "AccessDenied":
      return "Access denied. Please try a different account."
    case "Verification":
      return "The sign in link is no longer valid. Please request a new one."
    default:
      return "Something went wrong. Please try again."
  }
}
