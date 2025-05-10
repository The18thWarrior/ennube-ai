import CustomLink from "./custom-link"
import packageJSON from "next-auth/package.json"

export default function Footer() {
  return (
    <footer className="mx-0 my-4 flex w-full flex-col gap-4 px-4 text-sm sm:mx-auto sm:my-12 sm:h-5 sm:max-w-5xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* <CustomLink href="https://nextjs.authjs.dev">Documentation</CustomLink>
        <CustomLink href="https://www.npmjs.com/package/next-auth">
          NPM
        </CustomLink>
        <CustomLink href="https://github.com/nextauthjs/next-auth/tree/main/apps/examples/nextjs">
          Source on GitHub
        </CustomLink> */}
        <CustomLink href="/privacy">Privacy Policy</CustomLink>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <p className="text-muted-foreground text-center">
          © 2025 Ennube.ai. All rights reserved.
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <img
          className="size-5"
          src="/logo.png"
          alt="Ennube Logo"
        />
        <CustomLink href="https://ennube.ai">
          {/* {packageJSON.version} */}
          Ennube.ai
        </CustomLink>
      </div>
    </footer>
  )
}
