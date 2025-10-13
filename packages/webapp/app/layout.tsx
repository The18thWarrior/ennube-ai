import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Footer from "@/components/footer"
import Header from "@/components/header"
import { StripeProvider } from "@/lib/stripe-context"
import { SessionProvider } from "next-auth/react"
//import { Session } from "next-auth"
import { SnackbarProvider } from "../components/snackbar-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@vercel/analytics/next"
import { headers } from "next/headers"

const inter = Inter({ subsets: ["latin"] })

// export const metadata: Metadata = {
//   title: "Ennube.ai",
//   description:
//     "Supercharge your CRM with AI Agents",
//   icons: ["/logo.png"]
// }
export async function generateMetadata() {
  const headersList = await headers();
  //const theme = headersList.get('x-theme') || 'light'; // Get theme from headers, or default to light
  const host = headersList.get('host');
  const faviconPath = host ? (host?.includes('localhost') ? '/logo-dev.png' : host.includes('app') ? '/logo.png' : '/logo-dev.png') : '/logo.png'; // Default favicon path

  return {
    title: "Ennube.ai",
    description:
      "Supercharge your CRM with AI Agents",
    icons: {
      icon: faviconPath,
    },
  } as Metadata;
}

export default function RootLayout({ children }: React.PropsWithChildren<{}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} scrollbar`}>
        <ThemeProvider defaultTheme="light" storageKey="theme">
          <div className="flex h-full min-h-screen w-full flex-col justify-between">
            
            <SessionProvider>
              <StripeProvider>
                  <SnackbarProvider>
                    <Header />
                    <main className="mx-auto w-full max-w-4/5 flex-auto px-4 pt-2 sm:px-6 ">
                      {children}
                    </main>
                    {/* <Footer /> */}
                    <Analytics />
                  </SnackbarProvider>
              </StripeProvider>
            </SessionProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
