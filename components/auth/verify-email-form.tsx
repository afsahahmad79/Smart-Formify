"use client"

import React, { useState, useEffect } from "react"
import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle } from "lucide-react"

export function VerifyEmailForm() {
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)
    const { isLoaded, signUp, setActive } = useSignUp()
    const { toast } = useToast()
    const router = useRouter()

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendCooldown])

    // Check if signUp is in a state that requires verification
    useEffect(() => {
        if (isLoaded && signUp && signUp.emailAddress) {
            // Try to prepare verification if needed
            signUp.prepareEmailAddressVerification({ strategy: "email_code" }).catch((err) => {
                console.error("Failed to prepare verification:", err)
            })
        }
    }, [isLoaded, signUp])

    const handleVerification = async () => {
        if (!isLoaded || !signUp) {
            toast({
                title: "Error",
                description: "Please complete signup first",
                variant: "destructive",
            })
            router.push("/auth/sign-up")
            return
        }

        if (code.length !== 6) {
            toast({
                title: "Invalid Code",
                description: "Please enter the 6-digit verification code",
                variant: "destructive",
            })
            return
        }

        try {
            setLoading(true)

            // Attempt to verify the code
            const result = await signUp.attemptEmailAddressVerification({
                code,
            })

            if (result.status === "complete") {
                // Set the active session
                await setActive({ session: result.createdSessionId })

                toast({
                    title: "Email Verified!",
                    description: "Your account has been verified successfully.",
                    variant: "default",
                })

                // Redirect to dashboard
                router.push("/dashboard")
            } else {
                toast({
                    title: "Verification Incomplete",
                    description: `Status: ${result.status}. Please try again.`,
                    variant: "destructive",
                })
            }
        } catch (err: any) {
            console.error("Verification Error:", err)
            toast({
                title: "Verification Failed",
                description: err.errors?.[0]?.message || "Invalid verification code. Please try again.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleResendCode = async () => {
        if (!isLoaded || !signUp) {
            toast({
                title: "Error",
                description: "Please complete signup first",
                variant: "destructive",
            })
            router.push("/auth/sign-up")
            return
        }

        try {
            setResendLoading(true)
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
            setResendCooldown(60) // 60 second cooldown
            toast({
                title: "Code Resent",
                description: "A new verification code has been sent to your email.",
                variant: "default",
            })
        } catch (err: any) {
            console.error("Resend Error:", err)
            toast({
                title: "Failed to Resend",
                description: err.errors?.[0]?.message || "Could not resend verification code.",
                variant: "destructive",
            })
        } finally {
            setResendLoading(false)
        }
    }

    if (!isLoaded) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Loading...</CardTitle>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Verify Your Email</CardTitle>
                <CardDescription className="text-center">
                    Enter the 6-digit code sent to your email address
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {signUp?.emailAddress && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Code sent to <strong>{signUp.emailAddress}</strong>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-col items-center space-y-4">
                    <InputOTP
                        maxLength={6}
                        value={code}
                        onChange={setCode}
                        onComplete={handleVerification}
                    >
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>

                    <Button
                        onClick={handleVerification}
                        className="w-full"
                        disabled={loading || code.length !== 6}
                    >
                        {loading ? "Verifying..." : "Verify Email"}
                    </Button>
                </div>

                <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Didn't receive the code?
                    </p>
                    <Button
                        variant="outline"
                        onClick={handleResendCode}
                        disabled={resendLoading || resendCooldown > 0}
                        className="w-full"
                    >
                        {resendLoading
                            ? "Sending..."
                            : resendCooldown > 0
                                ? `Resend in ${resendCooldown}s`
                                : "Resend Code"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

