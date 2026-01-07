"use client"

import { VerifyEmailForm } from "@/components/auth/verify-email-form"

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-4">
                <VerifyEmailForm />
            </div>
        </div>
    )
}

