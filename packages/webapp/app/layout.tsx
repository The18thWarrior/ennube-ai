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


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Ennube.ai",
  description:
    "Supercharge your CRM with AI Agents",
  icons: ["/logo.png"]
}

export default function RootLayout({ children }: React.PropsWithChildren<{}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} scrollbar`}>
        <ThemeProvider defaultTheme="system" storageKey="theme">
          <div className="flex h-full min-h-screen w-full flex-col justify-between">
            
            <SessionProvider>
              <StripeProvider>
                  <SnackbarProvider>
                    <Header />
                    <main className="mx-auto w-full max-w-4/5 flex-auto px-4 py-4 sm:px-6 md:py-6">
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
