"use client"

import React, { useState, useEffect } from "react"
import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [browserWarning, setBrowserWarning] = useState<string | null>(null)
  const { toast } = useToast()
  const { isLoaded, signUp, setActive } = useSignUp()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkBrowserCompatibility = () => {
      const issues: string[] = []

      if (window.navigator.userAgent.includes("Chrome")) {
        const extensionPatterns = ["ublock", "adblock", "privacy badger", "https everywhere"]
        extensionPatterns.forEach((pattern) => {
          if (window.navigator.userAgent.toLowerCase().includes(pattern)) {
            issues.push(`Potential extension conflict detected: ${pattern}`)
          }
        })
      }

      if (!window.navigator.cookieEnabled) {
        issues.push("Cookies are disabled - required for signup")
      }

      if (!window.navigator.onLine) {
        issues.push("No internet connection detected")
      }

      if (
        window.navigator.userAgent.includes("Headless") ||
        window.navigator.userAgent.includes("Phantom") ||
        window.navigator.webdriver
      ) {
        issues.push("Automated browser detected - may cause issues")
      }

      if (issues.length > 0) {
        setBrowserWarning(issues.join("; "))
      }
    }

    checkBrowserCompatibility()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    if (!email || !password || !name) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Step 1: Create Clerk sign-up
      const signUpResult = await signUp.create({
        emailAddress: email,
        password: password,
        firstName: name,
      })

      // Step 2: Check if email verification is required
      if (signUpResult.status === "missing_requirements") {
        // If email verification is required, prepare it and redirect to verification page
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox to verify your account.",
          variant: "default",
        })
        // Redirect to verification page
        router.push("/auth/verify-email")
      } else if (signUpResult.status === "complete") {
        // Account created and verified immediately (if email verification is disabled)
        await setActive({ session: signUpResult.createdSessionId })
        toast({
          title: "Account Created Successfully!",
          description: "Redirecting to dashboard...",
          variant: "default",
        })
        router.push("/dashboard")
      } else {
        toast({
          title: "Account Created",
          description: "Please check your email to verify your account before signing in.",
          variant: "default",
        })
        // Redirect to verification page as fallback
        router.push("/auth/verify-email")
      }
    } catch (err: any) {
      console.error("Signup Error:", err)
      toast({
        title: "Signup Failed",
        description: err.errors?.[0]?.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Sign up to start building amazing forms
        </CardDescription>
      </CardHeader>
      <CardContent>
        {browserWarning && (
          <Alert className="mb-4" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Browser Compatibility Warning:</strong> {browserWarning}
              <br />
              <small className="text-xs">
                This may cause signup issues. Consider the solutions above.
              </small>
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
              placeholder="Create a password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div id="clerk-captcha"></div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
