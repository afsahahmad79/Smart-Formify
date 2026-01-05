"use client"
import { useState, useEffect, useCallback } from "react"
import { FormElement } from "@/types/form";
import { Integration } from "@/types/integration";
import { useAction, useMutation, useQuery } from "convex/react";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay, useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Settings, Eye, Save, EyeOff, Share, Globe, Copy, Zap } from "lucide-react"
import { FormElementPalette } from "./form-element-palette"
import { FormElementConfig } from "./form-element-config"
import { FormPreview } from "./form-preview"
import { RealtimePreview } from "./realtime-preview"
import { PublishDialog } from "./publish-dialog"
import { IntegrationsManager } from "../integrations/integrations-manager"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-context"
import { useUser, useSession } from "@clerk/nextjs"
import { copyToClipboard } from "@/lib/clipboard"

export type FormSchema = {
  id: string
  title: string
  description: string
  elements: FormElement[]
  status: "draft" | "published" | "unpublished"
  publishedAt?: number
  shareUrl?: string
  embedCode?: string
}

function DroppableCanvas({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas",
    data: {
      type: "canvas",
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-96 p-6 border-2 border-dashed rounded-lg transition-colors ${
        isOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      }`}
    >
      {children}
    </div>
  )
}

export function FormBuilder() {
  const { user, loading } = useAuth();
  const { user: clerkUser, isSignedIn, isLoaded: clerkLoaded } = useUser();
  const { session, isLoaded: sessionLoaded } = useSession();
  
  const [formId, setFormId] = useState<Id<"forms"> | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [formSchema, setFormSchema] = useState<FormSchema>({
    id: "",
    title: "Untitled Form",
    description: "Form description",
    elements: [],
    status: "draft",
  })

  // Memory optimization: limit form elements to prevent memory issues
  const maxElements = 50;

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const selectedElement = selectedElementId ? formSchema.elements.find(el => el.id === selectedElementId) : null
  const [showPreview, setShowPreview] = useState(false)
  const [showRealtimePreview, setShowRealtimePreview] = useState(true)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [showIntegrations, setShowIntegrations] = useState(false)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showAIGenerateDialog, setShowAIGenerateDialog] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")
  const { toast } = useToast()

  const generateForm = useAction(api.forms.actions.generateForm)
  const createForm = useMutation(api.forms.mutations.createForm)
  const updateForm = useMutation(api.forms.mutations.updateForm)
  const publishForm = useMutation(api.forms.mutations.publishForm)
  const unpublishForm = useMutation(api.forms.mutations.unpublishForm)
  
  // Test query to verify Convex authentication is working
  const getCurrentUser = useQuery(api.users.queries.getCurrent)

  // Debug: Log authentication state
  useEffect(() => {
    console.log("🔐 Authentication Debug:", {
      "Clerk User": clerkUser ? "✅ Present" : "❌ Missing",
      "Is Signed In": isSignedIn,
      "Clerk Session": session ? "✅ Present" : "❌ Missing",
      "Session ID": session?.id,
      "Convex User": getCurrentUser ? "✅ Present" : "❌ Missing",
      "Custom Auth User": user ? "✅ Present" : "❌ Missing",
    });
    
    if (isSignedIn && clerkUser && !session) {
      console.error("❌ CRITICAL: Clerk user is signed in but NO SESSION exists!");
      console.error("This means Clerk authentication is broken. Try:");
      console.error("1. Check Clerk dashboard for correct keys");
      console.error("2. Verify NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set");
      console.error("3. Check browser network tab for Clerk API calls");
    }
  }, [clerkUser, isSignedIn, session, getCurrentUser, user]);
  
  // Show loading state while checking authentication
  if (loading || !clerkLoaded || !sessionLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  // Require authentication to use form builder - check both auth systems
  if (!user || !isSignedIn || !clerkUser || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to create and manage forms.
          </p>
          <a href="/auth/sign-in">
            <Button className="bg-primary text-primary-foreground px-6 py-2">
              Sign In
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    // Adding new element from palette
    if (active.data.current?.type === "palette" && over.data.current?.type === "canvas") {
      // Memory optimization: prevent adding too many elements
      if (formSchema.elements.length >= maxElements) {
        toast({
          title: "Maximum elements reached",
          description: `You can only add up to ${maxElements} elements to prevent memory issues`,
          variant: "destructive",
        })
        return
      }

      const elementType = active.id as FormElement["type"]
      const newElement: FormElement = {
        id: `element-${Date.now()}`,
        type: elementType,
        label: `${elementType.charAt(0).toUpperCase() + elementType.slice(1)} Field`,
        placeholder: `Enter ${elementType}`,
        required: false,
      }

      if (elementType === "select" || elementType === "radio") {
        newElement.options = ["Option 1", "Option 2", "Option 3"]
      }

      const newElements = [...formSchema.elements]
      newElements.push(newElement)

      setFormSchema((prev) => {
        const updated = {
          ...prev,
          elements: newElements,
        }
        if (!isNew && formId) {
          const { id: _, ...updateArgs } = updated
          updateForm({ id: formId, ...updateArgs })
        }
        return updated
      })
      return
    }

    // Reordering elements in canvas
    if (active.data.current?.type === "canvas" && over.data.current?.type === "canvas") {
      const oldIndex = formSchema.elements.findIndex((el) => el.id === active.id)
      const newIndex = formSchema.elements.findIndex((el) => el.id === over.id)

      if (oldIndex !== newIndex) {
        const newElements = arrayMove(formSchema.elements, oldIndex, newIndex)
        setFormSchema((prev) => {
          const updated = {
            ...prev,
            elements: newElements,
          }
          if (!isNew && formId) {
            const { id: _, ...updateArgs } = updated
            updateForm({ id: formId, ...updateArgs })
          }
          return updated
        })
      }
    }
  }

  const updateElement = (elementId: string, updates: Partial<FormElement>) => {
    setFormSchema((prev) => {
      const updated = {
        ...prev,
        elements: prev.elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el)),
      }
      if (!isNew && formId) {
        const { id: _, ...updateArgs } = updated
        updateForm({ id: formId, ...updateArgs })
      }
      return updated
    })
  }

  const deleteElement = (elementId: string) => {
    setFormSchema((prev) => {
      const updated = {
        ...prev,
        elements: prev.elements.filter((el) => el.id !== elementId),
      }
      if (!isNew && formId) {
        const { id: _, ...updateArgs } = updated
        updateForm({ id: formId, ...updateArgs })
      }
      return updated
    })
    setSelectedElementId(null)
  }

  const handlePublishForm = async (settings: { allowAnonymous: boolean; collectEmails: boolean; shareUrl?: string; embedCode?: string }) => {
    // Check authentication before publishing - verify both auth systems
    if (!user || !isSignedIn || !clerkUser || !session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to publish forms. Your session may have expired.",
        variant: "destructive",
      })
      return
    }

    if (formSchema.elements.length === 0) {
      toast({
        title: "Cannot publish empty form",
        description: "Add at least one form element before publishing",
        variant: "destructive",
      })
      return
    }

    try {
      let currentFormId = formId
      if (isNew) {
        // Save first if new
        try {
          const newId = await createForm({
            title: formSchema.title,
            description: formSchema.description,
            elements: formSchema.elements,
          }) as Id<"forms">
          currentFormId = newId
          setFormId(newId)
          setIsNew(false)
          setFormSchema(prev => ({ ...prev, id: newId }))
          toast({
            title: "Form saved",
            description: "Form created and ready to publish",
          })
        } catch (createError: any) {
          const errorMsg = createError?.message || String(createError);
          if (errorMsg.includes("Not authenticated") || errorMsg.includes("authentication")) {
            toast({
              title: "Authentication Error",
              description: "Your session expired. Please sign in again and try publishing.",
              variant: "destructive",
            })
            return
          }
          throw createError
        }
      }

      // Publish
      try {
        // Generate share URL and embed code (use provided ones or generate new)
        const shareUrl = settings.shareUrl || `${window.location.origin}/forms/${currentFormId}`
        const embedCode = settings.embedCode || `<iframe src="${shareUrl}?embed=true" width="100%" height="600" frameborder="0"></iframe>`

        await publishForm({ 
          id: currentFormId!,
          shareUrl,
          embedCode,
          allowAnonymous: settings.allowAnonymous,
          collectEmails: settings.collectEmails,
        })

        setFormSchema((prev) => ({
          ...prev,
          status: "published",
          publishedAt: Date.now(),
          shareUrl,
          embedCode,
          allowAnonymous: settings.allowAnonymous,
          collectEmails: settings.collectEmails,
        }))

      toast({
        title: "Form published successfully!",
        description: "Your form is now live and ready to collect responses",
      })

      setShowPublishDialog(false)
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        if (errorMsg.includes("Not authenticated") || errorMsg.includes("authentication")) {
          toast({
            title: "Authentication Error",
            description: "Your session expired. Please sign in again and try publishing.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Failed to publish form",
            description: error instanceof Error ? error.message : "An error occurred",
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes("Not authenticated") || errorMsg.includes("authentication")) {
        toast({
          title: "Authentication Error",
          description: "Your session expired. Please sign in again and try publishing.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Failed to publish form",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        })
      }
    }
  }

  const handleUnpublishForm = async () => {
    if (!formId) {
      toast({
        title: "No form to unpublish",
        variant: "destructive",
      })
      return
    }

    try {
      await unpublishForm({ id: formId })

      setFormSchema((prev) => ({
        ...prev,
        status: "unpublished",
      }))

      toast({
        title: "Form unpublished",
        description: "Your form is no longer accepting responses",
      })
    } catch (error) {
      toast({
        title: "Failed to unpublish form",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const copyShareUrl = async () => {
    if (formSchema.shareUrl) {
      const success = await copyToClipboard(formSchema.shareUrl)
      if (success) {
        toast({
          title: "Link copied!",
          description: "Share URL has been copied to clipboard",
        })
      } else {
        toast({
          title: "Failed to copy",
          description: "Copy to clipboard is not supported in this browser. Please copy the link manually.",
          variant: "destructive",
        })
      }
    }
  }

  const copyEmbedCode = async () => {
    if (formSchema.embedCode) {
      const success = await copyToClipboard(formSchema.embedCode)
      if (success) {
        toast({
          title: "Embed code copied!",
          description: "Embed code has been copied to clipboard",
        })
      } else {
        toast({
          title: "Failed to copy",
          description: "Copy to clipboard is not supported in this browser. Please copy the code manually.",
          variant: "destructive",
        })
      }
    }
  }

  const saveForm = async () => {
    // Check authentication before saving - verify both auth systems
    if (!user || !isSignedIn || !clerkUser || !session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save forms. Your session may have expired.",
        variant: "destructive",
      })
      return
    }

    if (formSchema.elements.length === 0 && formSchema.title === "Untitled Form") {
      toast({
        title: "Empty form",
        description: "Add a title or elements to save",
        variant: "destructive",
      })
      return
    }

    try {
      if (isNew) {
        const newId = await createForm({
          title: formSchema.title,
          description: formSchema.description,
          elements: formSchema.elements,
        }) as Id<"forms">
        setFormId(newId)
        setIsNew(false)
        setFormSchema(prev => ({ ...prev, id: newId }))
        toast({
          title: "Form created",
          description: "Your form has been saved successfully",
        })
      } else if (formId) {
        await updateForm({ id: formId, title: formSchema.title, description: formSchema.description, elements: formSchema.elements })
        toast({
          title: "Form updated",
          description: "Your changes have been saved",
        })
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes("Not authenticated") || errorMsg.includes("authentication")) {
        toast({
          title: "Authentication Error",
          description: "Your session expired. Please sign in again and try saving.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Failed to save form",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        })
      }
    }
  }

  

  const renderFormElement = (element: FormElement, index: number) => {
    const isSelected = selectedElement?.id === element.id

    return (
      <div
        key={element.id}
        className={`mb-4 p-4 border rounded-lg transition-all cursor-move ${
          isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
        onClick={() => setSelectedElementId(element.id)}
        data-element-id={element.id}
      >
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">{element.label}</Label>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedElementId(element.id)
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                deleteElement(element.id)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {element.type === "text" || element.type === "email" || element.type === "number" ? (
          <Input placeholder={element.placeholder} disabled />
        ) : element.type === "textarea" ? (
          <Textarea placeholder={element.placeholder} disabled />
        ) : element.type === "select" ? (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {element.options?.map((option, idx) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : element.type === "radio" ? (
          <RadioGroup disabled>
            {element.options?.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${element.id}-${idx}`} />
                <Label htmlFor={`${element.id}-${idx}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        ) : element.type === "checkbox" ? (
          <div className="flex items-center space-x-2">
            <Checkbox disabled />
            <Label>{element.label}</Label>
          </div>
        ) : null}

        {element.required && <p className="text-xs text-destructive mt-1">* Required</p>}
      </div>
    )
  }

  if (showPreview) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Form Preview</h2>
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            Back to Editor
          </Button>
        </div>
        <FormPreview formSchema={formSchema} />
      </div>
    )
  }

  if (showIntegrations) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Form Integrations</h2>
          <Button variant="outline" onClick={() => setShowIntegrations(false)}>
            Back to Editor
          </Button>
        </div>
        <IntegrationsManager
          formId={formSchema.id}
          integrations={integrations}
          onUpdateIntegrations={setIntegrations}
        />
      </div>
    )
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col md:flex-row">
        {/* Form Element Palette */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-sidebar flex-shrink-0">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sidebar-foreground">Form Elements</h3>
            <p className="text-xs text-sidebar-foreground/70">Drag elements to build your form</p>
          </div>
          <FormElementPalette />
        </div>

        {/* Form Canvas */}
        <div className={`flex-1 flex flex-col ${showRealtimePreview ? "md:max-w-[50%]" : ""} p-2 md:p-6`}> {/* Responsive padding */}
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0 p-2 md:p-4 border-b bg-card">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 w-full">
              <div className="flex-1">
                <Input
                  value={formSchema.title}
                  onChange={(e) => setFormSchema((prev) => {
                    const updated = { ...prev, title: e.target.value }
                    if (!isNew && formId) {
                      const { id: _, ...updateArgs } = updated
                      updateForm({ id: formId, ...updateArgs })
                    }
                    return updated
                  })}
                  className="font-semibold text-lg border-none p-0 h-auto focus-visible:ring-0"
                  placeholder="Form Title"
                />
                <Input
                  value={formSchema.description}
                  onChange={(e) => setFormSchema((prev) => {
                    const updated = { ...prev, description: e.target.value }
                    if (!isNew && formId) {
                      const { id: _, ...updateArgs } = updated
                      updateForm({ id: formId, ...updateArgs })
                    }
                    return updated
                  })}
                  className="text-sm text-muted-foreground border-none p-0 h-auto focus-visible:ring-0 mt-1"
                  placeholder="Form Description"
                />
              </div>
              {formSchema.status === "published" && (
                <div className="flex items-center space-x-2 text-sm mt-2 md:mt-0">
                  <Globe className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">Published</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
              <Button
                variant="outline"
                onClick={() => setShowRealtimePreview(!showRealtimePreview)}
                className={showRealtimePreview ? "bg-primary/10" : ""}
              >
                {showRealtimePreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showRealtimePreview ? "Hide Preview" : "Show Preview"}
              </Button>
              <Button variant="outline" onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Full Preview
              </Button>
              <Button variant="outline" onClick={() => setShowIntegrations(true)}>
                <Zap className="h-4 w-4 mr-2" />
                Integrations
                {integrations.filter((i) => i.enabled).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {integrations.filter((i) => i.enabled).length}
                  </Badge>
                )}
              </Button>
              {formSchema.status === "published" ? (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={copyShareUrl}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button variant="outline" onClick={() => setShowPublishDialog(true)}>
                    <Share className="h-4 w-4 mr-2" />
                    Share Options
                  </Button>
                  <Button variant="outline" onClick={handleUnpublishForm}>
                    Unpublish
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowPublishDialog(true)} disabled={isNew && formSchema.elements.length === 0}>
                  <Globe className="h-4 w-4 mr-2" />
                  Publish Form
                </Button>
              )}
              
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 p-2 md:p-6">
            <DroppableCanvas>
              {formSchema.elements.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <p className="text-lg mb-2">Start building your form</p>
                  <p className="text-sm">Drag form elements from the left panel to get started</p>
                </div>
              ) : (
                <SortableContext items={formSchema.elements.map(el => el.id)} strategy={verticalListSortingStrategy}>
                  {formSchema.elements.map((element, index) => renderFormElement(element, index))}
                </SortableContext>
              )}
            </DroppableCanvas>
          </div>
        </div>

        {showRealtimePreview && (
          <div className="w-full md:w-[32%] border-t md:border-t-0 md:border-l border-border bg-muted/30 flex-shrink-0">
            <div className="p-4 border-b bg-card">
              <h3 className="font-semibold text-foreground">Live Preview</h3>
              <p className="text-xs text-muted-foreground">See your form as users will</p>
            </div>
            <div className="h-[calc(100%-5rem)] overflow-y-auto">
              <RealtimePreview formSchema={formSchema} />
            </div>
          </div>
        )}

        {/* Element Configuration Panel */}
        {selectedElement && (
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border bg-card flex-shrink-0">
            <FormElementConfig
              element={selectedElement}
              onUpdate={(updates) => updateElement(selectedElement.id, updates)}
              onClose={() => setSelectedElementId(null)}
            />
          </div>
        )}

        {/* Publish Dialog */}
        <PublishDialog
          open={showPublishDialog}
          onOpenChange={setShowPublishDialog}
          formSchema={formSchema}
          // onPublish={handlePublishForm}
        />
      </div>
    </DndContext>
  )
}
