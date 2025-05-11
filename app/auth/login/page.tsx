"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { signIn, auth } from "@/auth"
import { useSearchParams } from "next/navigation"

export default async function LoginPage() {
    const searchParams = useSearchParams();

  // Sign in state
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [error, setError] = useState("")
//   const [loading, setLoading] = useState(false)

//   // Sign up state
//   const [signupName, setSignupName] = useState("")
//   const [signupEmail, setSignupEmail] = useState("")
//   const [signupPassword, setSignupPassword] = useState("")
//   const [signupError, setSignupError] = useState("")
//   const [signupLoading, setSignupLoading] = useState(false)

//   async function handleSignIn(e: { preventDefault: () => void }) {
//     e.preventDefault()
//     setLoading(true)
//     setError("")

//     try {
//       // Hardcoded demo login
//       if (email === "demo@example.com" && password === "password123") {
//         // Store in localStorage
//         localStorage.setItem(
//           "user",
//           JSON.stringify({
//             name: "Demo User",
//             email: "demo@example.com",
//           }),
//         )

//         // Redirect
//         window.location.href = "/simple-dashboard"
//         return
//       }

//       setError("Invalid email or password")
//     } catch (err) {
//       setError("An error occurred")
//       console.error(err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   async function handleSignUp(e: { preventDefault: () => void }) {
//     e.preventDefault()
//     setSignupLoading(true)
//     setSignupError("")

//     try {
//       // Validate inputs
//       if (!signupName || !signupEmail || !signupPassword) {
//         setSignupError("All fields are required")
//         setSignupLoading(false)
//         return
//       }

//       if (signupPassword.length < 6) {
//         setSignupError("Password must be at least 6 characters")
//         setSignupLoading(false)
//         return
//       }

//       // For demo purposes, we'll just create a user in localStorage
//       localStorage.setItem(
//         "user",
//         JSON.stringify({
//           name: signupName,
//           email: signupEmail,
//         }),
//       )

//       // Redirect to dashboard
//       window.location.href = "/simple-dashboard"
//     } catch (err) {
//       setSignupError("An error occurred during sign up")
//       console.error(err)
//     } finally {
//       setSignupLoading(false)
//     }
//   }
    const providerMap = [{ id: "google", name: "Google" }];
    async function handleSignIn(e: { preventDefault: () => void }) {
        signIn(providerMap[0].id, {
            redirectTo: searchParams.get("callbackUrl") ?? "",
            authorizationParams: {
                prompt:{
                    value:"select_account"
                }
            }
        })
    }
  return (
    <div className="container flex justify-center py-20">
      <Card className="w-full max-w-md">
        <Tabs defaultValue="signin" className="w-full">
          {/* <CardHeader>
            <div className="flex justify-center">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader> */}

            <CardContent>
                <CardDescription className="text-center mb-4 pt-4">Enter your email and password to sign in</CardDescription>
                <Button onClick={handleSignIn} className="w-full" >
                    {"Sign in"}
                </Button>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
                <div className="text-sm text-center text-gray-500">
                <p>
                    By signing in, you agree to our{" "}
                    <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">
                    Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">
                    Privacy Policy
                    </Link>
                </p>
                </div>
            </CardFooter>

          {/* <TabsContent value="signup">
            <CardContent>
              <CardDescription className="text-center mb-4">Create a new account to get started</CardDescription>
              <form onSubmit={handleSignUp} className="space-y-4">
                {signupError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{signupError}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={signupLoading}>
                  {signupLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-center text-gray-500">
                <p>
                  By signing up, you agree to our{" "}
                  <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </CardFooter>
          </TabsContent> */}
        </Tabs>
      </Card>
    </div>
  )
}
