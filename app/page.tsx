import CustomLink from "@/components/custom-link"
import { auth } from "auth"

export default async function Index() {
  const session = await auth()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">NextAuth.js Example</h1>
      <div>
        WebAuthn users are reset on every deploy, don't expect your test user(s)
        to still be available after a few days. It is designed to only
        demonstrate registration, login, and logout briefly.
      </div>
      <div className="flex flex-col rounded-md border border-gray-300 dark:border-gray-700">
        <div className="rounded-t-md border-b border-gray-300 dark:border-gray-700 p-4 font-bold">
          Current Session
        </div>
        <pre className="whitespace-pre-wrap break-all px-4 py-6">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
    </div>
  )
}
