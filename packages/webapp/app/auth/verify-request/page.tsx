import Link from "next/link"

export default function VerifyRequestPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 py-10 text-center">
      <h1 className="text-2xl font-semibold">Check your email</h1>
      <p className="text-muted-foreground">
        A sign in link has been sent to your email address. Click the link to finish signing in.
      </p>
      <p className="text-sm text-muted-foreground">
        Didn’t get an email? Check your spam folder or try again.
      </p>
      <div>
        <Link href="/auth/login" className="underline">Back to sign in</Link>
      </div>
    </div>
  )
}
