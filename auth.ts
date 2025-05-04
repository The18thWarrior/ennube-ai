import NextAuth from "next-auth"
import "next-auth/jwt"

//import Apple from "next-auth/providers/apple"
// import Atlassian from "next-auth/providers/atlassian"
import Auth0 from "next-auth/providers/auth0"
/*import AzureB2C from "next-auth/providers/azure-ad-b2c"
import BankIDNorway from "next-auth/providers/bankid-no"
import BoxyHQSAML from "next-auth/providers/boxyhq-saml"
import Cognito from "next-auth/providers/cognito"
import Coinbase from "next-auth/providers/coinbase"
import Discord from "next-auth/providers/discord"
import Dropbox from "next-auth/providers/dropbox"
import Facebook from "next-auth/providers/facebook"
import GitHub from "next-auth/providers/github"
import GitLab from "next-auth/providers/gitlab"
import Google from "next-auth/providers/google"
import Hubspot from "next-auth/providers/hubspot"
import Keycloak from "next-auth/providers/keycloak"
import LinkedIn from "next-auth/providers/linkedin"
import MicrosoftEntraId from "next-auth/providers/microsoft-entra-id"
import Netlify from "next-auth/providers/netlify"
import Okta from "next-auth/providers/okta"
import Passage from "next-auth/providers/passage"
import Passkey from "next-auth/providers/passkey"
import Pinterest from "next-auth/providers/pinterest"
import Reddit from "next-auth/providers/reddit"
import Slack from "next-auth/providers/slack"*/
//import Salesforce from "next-auth/providers/salesforce"
/*import Spotify from "next-auth/providers/spotify"
import Twitch from "next-auth/providers/twitch"
import Twitter from "next-auth/providers/twitter"
import Vipps from "next-auth/providers/vipps"
import WorkOS from "next-auth/providers/workos"
import Zoom from "next-auth/providers/zoom"*/
import { createStorage } from "unstorage"
import memoryDriver from "unstorage/drivers/memory"
import vercelKVDriver from "unstorage/drivers/vercel-kv"
import { UnstorageAdapter } from "@auth/unstorage-adapter"

const storage = createStorage({
  driver: process.env.VERCEL
    ? vercelKVDriver({
        url: process.env.AUTH_KV_REST_API_URL,
        token: process.env.AUTH_KV_REST_API_TOKEN,
        env: false,
      })
    : memoryDriver(),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: !!process.env.AUTH_DEBUG,
  theme: { logo: "https://authjs.dev/img/logo-sm.png" },
  adapter: UnstorageAdapter(storage),
  providers: [
    // Apple,
    // Atlassian,
    Auth0,
    // AzureB2C,
    // BankIDNorway,
    // BoxyHQSAML({
    //   clientId: "dummy",
    //   clientSecret: "dummy",
    //   issuer: process.env.AUTH_BOXYHQ_SAML_ISSUER,
    // }),
    // Cognito,
    // Coinbase,
    // Discord,
    // Dropbox,
    // Facebook,
    // GitHub,
    // GitLab,
    // Google,
    // Hubspot,
    // Keycloak({ name: "Keycloak (bob/bob)" }),
    // LinkedIn,
    // MicrosoftEntraId,
    // Netlify,
    // Okta,
    // Passkey({
    //   formFields: {
    //     email: {
    //       label: "Username",
    //       required: true,
    //       autocomplete: "username webauthn",
    //     },
    //   },
    // }),
    // Passage,
    // Pinterest,
    // Reddit,
    //Salesforce,
    // Slack,
    // Spotify,
    // Twitch,
    // Twitter,
    // Vipps({
    //   issuer: "https://apitest.vipps.no/access-management-1.0/access/",
    // }),
    // WorkOS({ connection: process.env.AUTH_WORKOS_CONNECTION! }),
    // Zoom,
  ],
  basePath: "/auth",
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
