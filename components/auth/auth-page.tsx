"use client"

import { useState } from "react"
import { LoginForm } from "./login-form"
import { SignupForm } from "./signup-form"

export function AuthPage() {
  const [isLogin] = useState(true)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        {isLogin ? (
          <LoginForm />
        ) : (
          <SignupForm />
        )}
      </div>
    </div>
  )
}
