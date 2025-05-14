import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Footer from "@/components/footer"
import Header from "@/components/header"
import { StripeProvider } from "@/lib/stripe-context"
import { SessionProvider } from "next-auth/react"
import { Session } from "next-auth"
import { SnackbarProvider } from "../components/snackbar-provider"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Ennube.ai",
  description:
    "Supercharge your CRM with AI Agents",
}

export default function RootLayout({ children, session }: React.PropsWithChildren<{ session: Session | null }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>          <ThemeProvider defaultTheme="system" storageKey="theme">
          <div className="flex h-full min-h-screen w-full flex-col justify-between">
            <SessionProvider session={session}>
              <StripeProvider>
                  <SnackbarProvider>
                    <Header />
                    <main className="mx-auto w-full max-w-6xl flex-auto px-4 py-4 sm:px-6 md:py-6">
                      {children}
                    </main>
                    <Footer />
                  </SnackbarProvider>
              </StripeProvider>
            </SessionProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
