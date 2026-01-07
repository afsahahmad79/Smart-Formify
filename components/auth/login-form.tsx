"use client"

import React, { useState } from "react"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { signIn, isLoaded, setActive } = useSignIn()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoaded) return // Clerk not ready yet

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Step 1: Attempt sign-in
      const result = await signIn.create({
        identifier: email,
        password: password,
      })

      // Step 2: Handle different sign-in statuses
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        toast({
          title: "Login Successful",
          description: "Redirecting to your dashboard...",
          variant: "default",
        })
        router.push("/dashboard")
      } else if (result.status === "needs_first_factor") {
        // Email verification might be required
        toast({
          title: "Verification Required",
          description: "Please verify your email address to continue.",
          variant: "destructive",
        })
        router.push("/auth/verify-email")
      } else if (result.status === "needs_identifier") {
        toast({
          title: "Sign-in Incomplete",
          description: "Please provide your email address.",
          variant: "destructive",
        })
      } else if (result.status === "needs_new_password") {
        toast({
          title: "Password Reset Required",
          description: "Please set a new password to continue.",
          variant: "destructive",
        })
      } else {
        console.log("Sign-in response status:", result.status)
        toast({
          title: "Sign-in Incomplete",
          description: `Sign-in status: ${result.status}. Please try again.`,
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("Login Error:", err)
      toast({
        title: "Login Failed",
        description: err.errors?.[0]?.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
