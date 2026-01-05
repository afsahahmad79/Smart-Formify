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
import { useToast } from "@/components/ui/use-toast"

function CreateWithAICard() {
  const [showPromptBox, setShowPromptBox] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleCreateForm() {
  if (!prompt.trim()) return;

  setLoading(true);
  try {
    const res = await fetch("/api/generate-form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "AI generation failed");
    }

    const schema = JSON.parse(data.text);
    setFormData(schema);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : JSON.stringify(err) || 'Unknown error occurred';
    console.error("Error generating form:", errorMessage);
  } finally {
    setLoading(false);
  }
}


  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => !showPromptBox && setShowPromptBox(true)}
    >
      <CardHeader>
        <CardTitle>Create with AI</CardTitle>
        <CardDescription>Generate forms using AI</CardDescription>
      </CardHeader>
      <CardContent>
        {!showPromptBox && (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-2">Click to create a form with AI</p>
            <Button variant="outline" onClick={() => setShowPromptBox(true)}>
              Start AI Creation
            </Button>
          </div>
        )}

        {showPromptBox && (
          <div className="space-y-4">
            <label htmlFor="ai-prompt-textarea" className="sr-only">
              Describe the form you want to create with AI
            </label>
            <textarea
              id="ai-prompt-textarea"
              className="w-full border rounded p-2 min-h-[100px]"
              placeholder="Describe the form you want (e.g. signup form with name, email, password)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              aria-label="Describe the form you want to create with AI"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleCreateForm}
                disabled={loading || !prompt.trim()}
                className="flex-1"
              >
                {loading ? "Creating..." : "Generate Form"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPromptBox(false);
                  setPrompt("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Render generated form preview */}
        {formData && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-2">Generated Form Preview</h4>
            <form className="space-y-3">
              {(formData as { fields?: Array<any> })?.fields?.map((field: any, i: number) => (
                <div key={i}>
                  <label htmlFor={`field-${i}`} className="block mb-1 text-sm font-medium">
                    {field.label}
                  </label>
                  <input
                    id={`field-${i}`}
                    type={field.type}
                    name={field.name}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder={field.placeholder || field.label}
                    aria-label={field.label}
                  />
                </div>
              ))}
            </form>
            <div className="flex gap-2 mt-4">
              <Button className="flex-1">Use This Form</Button>
              <Button
                variant="outline"
                onClick={() => setFormData(null)}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


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
                <CreateWithAICard />

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
                  <AccountSettings user={user} />
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

function AccountSettings({ user }: { user: any }) {
  const [email, setEmail] = useState(user?.email || "")
  const [name, setName] = useState(user?.name || "")
  const [editing, setEditing] = useState(false)
  const { toast } = useToast()

  const handleSave = () => {
    // Here you would call your API/mutation to update user info
    setEditing(false)
    toast({ title: "Account updated", description: "Your account information has been updated." })
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="email-input" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email-input"
          className="w-full border rounded px-3 py-2 mt-1"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!editing}
          aria-label="Email address"
        />
      </div>
      <div>
        <label htmlFor="name-input" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name-input"
          className="w-full border rounded px-3 py-2 mt-1"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!editing}
          aria-label="Full name"
        />
      </div>
      <div className="flex gap-2 mt-2">
        {editing ? (
          <>
            <Button onClick={handleSave}>Save</Button>
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button onClick={() => setEditing(true)}>Edit</Button>
        )}
      </div>
    </div>
  )
}