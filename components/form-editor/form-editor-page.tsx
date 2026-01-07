"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { LogoutDialog } from "@/components/auth/logout-dialog"
import { FormBuilder } from "@/components/form-builder/form-builder"
import { useState } from "react"
import type { Id } from "@/convex/_generated/dataModel"

interface FormEditorPageProps {
  formId?: Id<"forms">
}

export function FormEditorPage({ formId }: FormEditorPageProps) {
  const router = useRouter()
  const { user } = useUser()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/dashboard")}
            >
              ← Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-primary">Smart Formify</h1>
            <span className="text-sm text-muted-foreground">
              Form Editor - {formId ? "Edit Form" : "New Form"}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-foreground">Welcome, {user?.fullName || user?.firstName || "User"}</span>
            <Button variant="outline" size="sm" onClick={() => setShowLogoutDialog(true)}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <div className="h-[calc(100vh-4rem)]">
        <FormBuilder initialFormId={formId} />
      </div>
      <LogoutDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} />
    </div>
  )
}

