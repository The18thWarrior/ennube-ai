import NextAuth from "next-auth"
import "next-auth/jwt"

import Auth0 from "next-auth/providers/auth0"
import Google from "next-auth/providers/google"
import { createStorage } from "unstorage"
import memoryDriver from "unstorage/drivers/memory"
import vercelKVDriver from "unstorage/drivers/vercel-kv"
import upstashDriver from "unstorage/drivers/upstash"
import { UnstorageAdapter } from "@auth/unstorage-adapter"

const storage = createStorage({
  driver: process.env.VERCEL
    ? vercelKVDriver({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
        env: false,
      })
    : memoryDriver(),
})
const providers = [Auth0({ authorization: { prompt: "consent" }})];
// export const providerMap = providers
//   .map((provider) => {
//     return { id:  provider.id, name: provider.name }
//   })

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: !!process.env.AUTH_DEBUG,
  theme: { logo: "https://authjs.dev/img/logo-sm.png" },
  adapter: UnstorageAdapter(storage),
  providers: providers,
  //basePath: "/auth",
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl
      if (pathname === "/middleware-example") return !!auth
      return true
    },
    jwt({ token, trigger, session, account }) {
      if (trigger === "update") token.name = session.user.name
      
      // Handle Keycloak token
      if (account?.provider === "keycloak") {
        return { ...token, accessToken: account.access_token }
      }
      
      // Handle Auth0 token and user data
      if (account?.provider === "auth0" && account.access_token) {
        return { 
          ...token, 
          accessToken: account.access_token,
          auth0: {
            sub: account.providerAccountId // Auth0 user ID is stored in providerAccountId
          }
        }
      }
      
      // Handle Salesforce token and data
      if (account?.provider === "salesforce" && account.access_token) {
        return { 
          ...token, 
          accessToken: account.access_token,
          salesforce: {
            instanceUrl: account.instance_url as string,
            id: account.id as string,
            organization_id: account.organization_id as string,
          }
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token?.accessToken) session.accessToken = token.accessToken
      
      // Add Auth0 data to session
      if (token?.auth0) {
        session.user = {
          ...session.user,
          id: token.auth0.sub, // Add user ID directly on the user object
          auth0: token.auth0
        }
      }
      
      if (token?.salesforce) {
        session.user = {
          ...session.user,
          salesforce: token.salesforce
        }
      }

      return session
    },
  },
  experimental: { enableWebAuthn: true },
})

declare module "next-auth" {
  interface Session {
    accessToken?: string
    user?: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      auth0?: {
        sub: string
      }
      salesforce?: {
        instanceUrl: string
        id: string
        organization_id: string
      }
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    auth0?: {
      sub: string
    }
    salesforce?: {
      instanceUrl: string
      id: string
      organization_id: string
    }
  }
}
