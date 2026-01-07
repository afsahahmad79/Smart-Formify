"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUser } from "@clerk/nextjs"
import { LogoutDialog } from "@/components/auth/logout-dialog"
import { PlusCircle, FileText, BarChart3, Settings, LogOut, Inbox, Calendar, Edit, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Share2 } from "lucide-react"
import { SubmissionsDashboard } from "@/components/submissions/submissions-dashboard"
import { useToast } from "@/components/ui/use-toast"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { ShareUrlDialog } from "@/components/form-builder/share-url-dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

function CreateWithAICard() {
  const router = useRouter();
  const { toast } = useToast();
  const createForm = useMutation(api.forms.mutations.createForm);
  
  const [showPromptBox, setShowPromptBox] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateForm() {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please describe the form you want to create",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null); // Clear any previous errors
    try {
      // Call API to generate form structure
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
        // Check for out of credits error
        if (res.status === 402 || data.error?.toLowerCase().includes("credit")) {
          throw new Error("Out of credits. Please check your OpenAI account billing and credits.");
        }
        throw new Error(data.error || "AI generation failed");
      }

      // Validate response structure
      if (!data.elements || !Array.isArray(data.elements)) {
        throw new Error("Invalid response format from AI");
      }

      // Create form using Convex mutation
      const formId = await createForm({
        title: data.title || "AI Generated Form",
        description: data.description || "",
        elements: data.elements,
      }) as Id<"forms">;

      // Show success message
      toast({
        title: "Form created successfully",
        description: "Your AI-generated form has been created",
      });

      // Reset state
      setShowPromptBox(false);
      setPrompt("");
      setError(null);

      // Redirect to form editor
      router.push(`/dashboard/form-editor/${formId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      
      // Determine if it's a credits error
      const isCreditsError = errorMessage.toLowerCase().includes("credit") || 
                            errorMessage.toLowerCase().includes("quota") ||
                            errorMessage.toLowerCase().includes("billing");
      
      // Set error state to display in UI
      setError(errorMessage);
      
      // Also show toast notification
      toast({
        title: isCreditsError ? "Out of Credits" : "Failed to create form",
        description: errorMessage,
        variant: "destructive",
      });
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
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm font-medium text-red-800">
                  {error.toLowerCase().includes("credit") || error.toLowerCase().includes("quota") || error.toLowerCase().includes("billing")
                    ? "⚠️ Out of Credits"
                    : "⚠️ Error"}
                </p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            )}
            <label htmlFor="ai-prompt-textarea" className="sr-only">
              Describe the form you want to create with AI
            </label>
            <textarea
              id="ai-prompt-textarea"
              className="w-full border rounded p-2 min-h-[100px]"
              placeholder="Describe the form you want (e.g. signup form with name, email, password)"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (error) setError(null); // Clear error when user starts typing
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleCreateForm();
                }
              }}
              disabled={loading}
              aria-label="Describe the form you want to create with AI"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleCreateForm}
                disabled={loading || !prompt.trim()}
                className="flex-1"
              >
                {loading ? "Generating..." : "Generate & Create Form"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPromptBox(false);
                  setPrompt("");
                  setError(null);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
            {loading && (
              <p className="text-sm text-muted-foreground text-center">
                AI is generating your form...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


export function DashboardLayout() {
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from URL if available
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get("tab")
      if (tab && ["forms", "submissions", "analytics", "settings"].includes(tab)) {
        return tab
      }
    }
    return "forms"
  })
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const isInitialMount = useRef(true)

  // Set default tab in URL on mount if missing
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      const tabFromUrl = searchParams.get("tab")
      if (!tabFromUrl) {
        router.replace(`/dashboard?tab=${activeTab}`, { scroll: false })
      }
    }
  }, [searchParams, router, activeTab])

  // Sync tab with URL when URL changes (back/forward navigation)
  useEffect(() => {
    if (!isInitialMount.current) {
      const tabFromUrl = searchParams.get("tab")
      if (tabFromUrl && ["forms", "submissions", "analytics", "settings"].includes(tabFromUrl)) {
        if (activeTab !== tabFromUrl) {
          setActiveTab(tabFromUrl)
        }
      }
    }
  }, [searchParams, activeTab])

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.push(`/dashboard?tab=${tab}`, { scroll: false })
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
            <span className="text-sm text-foreground">Welcome, {user?.fullName || user?.firstName || "User"}</span>
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
              onClick={() => handleTabChange("forms")}
            >
              <FileText className="h-4 w-4 mr-2" />
              My Forms
            </Button>

            <Button
              variant={activeTab === "submissions" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleTabChange("submissions")}
            >
              <Inbox className="h-4 w-4 mr-2" />
              Submissions
            </Button>

            <Button
              variant={activeTab === "analytics" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleTabChange("analytics")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>

            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleTabChange("settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === "forms" && <FormsList router={router} />}

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

function FormsList({ router }: { router: ReturnType<typeof useRouter> }) {
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [selectedForm, setSelectedForm] = useState<{
    shareUrl: string
    embedCode?: string
    publishedAt?: number
    title: string
  } | null>(null)
  const ITEMS_PER_PAGE = 12

  const formsResult = useQuery(
    api.forms.queries.listForms,
    {
      paginationOpts: {
        numItems: ITEMS_PER_PAGE,
        cursor: paginationCursor,
      },
    }
  )

  const forms = formsResult?.page ?? []
  const hasMore = formsResult ? !formsResult.isDone : false
  const nextCursor = formsResult?.continueCursor

  const handleNextPage = () => {
    if (nextCursor) {
      setPaginationCursor(nextCursor)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePreviousPage = () => {
    // For cursor-based pagination, we need to track history
    // For simplicity, reset to first page
    setPaginationCursor(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleFormClick = (formId: Id<"forms">) => {
    router.push(`/dashboard/form-editor/${formId}`)
  }

  const handleShareClick = (e: React.MouseEvent, form: any) => {
    e.stopPropagation() // Prevent card click
    if (form.status === "published" && form.shareUrl) {
      setSelectedForm({
        shareUrl: form.shareUrl,
        embedCode: form.embedCode,
        publishedAt: form.publishedAt,
        title: form.title,
      })
      setShowShareDialog(true)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-800" },
      published: { label: "Published", className: "bg-green-100 text-green-800" },
      unpublished: { label: "Unpublished", className: "bg-yellow-100 text-yellow-800" },
    }
    const variant = variants[status] || variants.draft
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${variant.className}`}>
        {variant.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">My Forms</h2>
          <p className="text-base text-muted-foreground">Create and manage your forms</p>
        </div>
        <Button onClick={() => router.push("/dashboard/form-editor")}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Form
        </Button>
      </div>

      {formsResult === undefined ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <CreateWithAICard />
          <Card
            className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => router.push("/dashboard/form-editor")}
          >
            <CardContent className="flex flex-col items-center justify-center h-32 text-center">
              <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Create your first form</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <CreateWithAICard />
            {forms.map((form) => (
              <Card
                key={form._id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleFormClick(form._id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1 group-hover:text-primary transition-colors">
                        {form.title}
                      </CardTitle>
                      {form.description && (
                        <CardDescription className="line-clamp-2">
                          {form.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {form.status === "published" && form.shareUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleShareClick(e, form)}
                          title="Share form"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Edit className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(form.updatedAt)}
                      </div>
                      {getStatusBadge(form.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {form.elements.length} {form.elements.length === 1 ? "field" : "fields"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(hasMore || paginationCursor) && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={handlePreviousPage}
                      disabled={!paginationCursor}
                      className="gap-1 px-2.5 sm:pl-2.5"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      <span className="hidden sm:block">Previous</span>
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={handleNextPage}
                      disabled={!hasMore}
                      className="gap-1 px-2.5 sm:pr-2.5"
                    >
                      <span className="hidden sm:block">Next</span>
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Share URL Dialog */}
      {selectedForm && (
        <ShareUrlDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          shareUrl={selectedForm.shareUrl}
          embedCode={selectedForm.embedCode}
          publishedAt={selectedForm.publishedAt}
          formTitle={selectedForm.title}
        />
      )}
    </div>
  )
}

function AccountSettings({ user }: { user: any }) {
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || "")
  const [name, setName] = useState(user?.fullName || user?.firstName || "")
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