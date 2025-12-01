"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth/auth-context"
import { LogoutDialog } from "@/components/auth/logout-dialog"
import { PlusCircle, FileText, BarChart3, Settings, LogOut, Inbox } from "lucide-react"
import { FormBuilder } from "@/components/form-builder/form-builder"
import { SubmissionsDashboard } from "@/components/submissions/submissions-dashboard"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"

export function DashboardLayout() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("forms")
  const [showFormBuilder, setShowFormBuilder] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  if (showFormBuilder) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setShowFormBuilder(false)}>
                ← Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-primary">FormCraft</h1>
              <span className="text-sm text-muted-foreground">Form Builder</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-foreground">Welcome, {user?.name}</span>
              <Button variant="outline" size="sm" onClick={() => setShowLogoutDialog(true)}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>
        <div className="h-[calc(100vh-4rem)]">
          <FormBuilder />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">Smart Formify</h1>
            <span className="text-sm text-muted-foreground">Dynamic Form Builder</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-foreground">Welcome, {user?.name}</span>
            <Button variant="outline" size="sm" onClick={() => setShowLogoutDialog(true)}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-sidebar min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            <Button
              variant={activeTab === "forms" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("forms")}
            >
              <FileText className="h-4 w-4 mr-2" />
              My Forms
            </Button>

            <Button
              variant={activeTab === "submissions" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("submissions")}
            >
              <Inbox className="h-4 w-4 mr-2" />
              Submissions
            </Button>

            <Button
              variant={activeTab === "analytics" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("analytics")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>

            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === "forms" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-foreground">My Forms</h2>
                  <p className="text-base text-muted-foreground">Create and manage your forms</p>
                </div>
                <Button onClick={() => setShowFormBuilder(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Form
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle>Business Form</CardTitle>
                  </CardHeader>
                  <CardContent />
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle>Survey Form</CardTitle>
                  </CardHeader>
                  <CardContent />
                </Card>

                <Card
                  className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => setShowFormBuilder(true)}
                >
                  <CardContent className="flex flex-col items-center justify-center h-32 text-center">
                    <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Create your first form</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "submissions" && <SubmissionsDashboard />}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Settings</h2>
                <p className="text-base text-muted-foreground">Manage your account preferences</p>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Update your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <p className="text-sm text-muted-foreground">{user?.name}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      <LogoutDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} />
    </div>
  )
}
