"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { FormElement } from "@/types/form";
import { Integration } from "@/types/integration";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Settings, Eye, Save, EyeOff, Share, Globe, Copy, Zap, Edit, Lock } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { FormElementPalette } from "./form-element-palette"
import { FormElementConfig } from "./form-element-config"
import { FormPreview } from "./form-preview"
import { RealtimePreview } from "./realtime-preview"
import { PublishDialog } from "./publish-dialog"
import { ShareUrlDialog } from "./share-url-dialog"
import { IntegrationsManager } from "../integrations/integrations-manager"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
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
      className={`min-h-96 p-6 border-2 border-dashed rounded-lg transition-colors ${isOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
    >
      {children}
    </div>
  )
}

interface FormBuilderProps {
  initialFormId?: Id<"forms">
}

export function FormBuilder({ initialFormId }: FormBuilderProps) {
  const { user, isSignedIn, isLoaded: clerkLoaded } = useUser();
  const { session, isLoaded: sessionLoaded } = useSession();

  const [formId, setFormId] = useState<Id<"forms"> | null>(initialFormId || null);
  const [isNew, setIsNew] = useState(!initialFormId);
  const [formSchema, setFormSchema] = useState<FormSchema>({
    id: "",
    title: "Untitled Form",
    description: "Form description",
    elements: [],
    status: "draft",
  })
  const formSchemaRef = useRef(formSchema)

  // Keep ref in sync with state
  useEffect(() => {
    formSchemaRef.current = formSchema
  }, [formSchema])

  // Memory optimization: limit form elements to prevent memory issues
  const maxElements = 50;

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const selectedElement = selectedElementId ? formSchema.elements.find(el => el.id === selectedElementId) : null
  const [showPreview, setShowPreview] = useState(false)
  const [showRealtimePreview, setShowRealtimePreview] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [showShareUrlDialog, setShowShareUrlDialog] = useState(false)
  const [showIntegrations, setShowIntegrations] = useState(false)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isEditMode, setIsEditMode] = useState(!initialFormId) // New forms editable by default, existing forms read-only
  const [isFormLoaded, setIsFormLoaded] = useState(false) // Track if form has been initially loaded
  const { toast } = useToast()

  const createForm = useMutation(api.forms.mutations.createForm)
  const updateForm = useMutation(api.forms.mutations.updateForm)
  const publishForm = useMutation(api.forms.mutations.publishForm)
  const unpublishForm = useMutation(api.forms.mutations.unpublishForm)

  // Load form data if initialFormId is provided
  const loadedForm = useQuery(
    api.forms.queries.getForm,
    initialFormId ? { id: initialFormId } : "skip"
  )

  // Load form data when it becomes available (only once on initial load)
  useEffect(() => {
    if (loadedForm && initialFormId && !isFormLoaded) {
      setFormSchema({
        id: loadedForm._id,
        title: loadedForm.title,
        description: loadedForm.description || "",
        elements: loadedForm.elements || [],
        status: loadedForm.status,
        publishedAt: loadedForm.publishedAt,
        shareUrl: loadedForm.shareUrl,
        embedCode: loadedForm.embedCode,
      })
      setFormId(loadedForm._id)
      setIsNew(false)
      setHasUnsavedChanges(false)
      // Existing forms start in read-only mode (only set on initial load)
      setIsEditMode(false)
      setIsFormLoaded(true)
    }
  }, [loadedForm, initialFormId, isFormLoaded])

  // Note: Convex queries are safe here because FormBuilder is used inside <Authenticated> component

  // Save form as draft callback - must be defined before early returns
  // Use ref to avoid recreating callback when formSchema changes
  const saveFormAsDraft = useCallback(async (showToast = true) => {
    // Check if in edit mode
    if (!isEditMode) {
      return false
    }

    // Check authentication before saving
    if (!user || !isSignedIn || !session) {
      if (showToast) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save forms. Your session may have expired.",
          variant: "destructive",
        })
      }
      return false
    }

    // Get current formSchema from ref to avoid dependency issues
    const currentSchema = formSchemaRef.current

    setIsSaving(true)
    try {
      if (isNew) {
        const newId = await createForm({
          title: currentSchema.title,
          description: currentSchema.description,
          elements: currentSchema.elements,
        }) as Id<"forms">
        setFormId(newId)
        setIsNew(false)
        setFormSchema(prev => ({ ...prev, id: newId }))
        setHasUnsavedChanges(false)
        setLastSaved(new Date())

        // Update URL without navigating
        const newUrl = `/dashboard/form-editor/${newId}`
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl)

        if (showToast) {
          toast({
            title: "Form saved as draft",
            description: "Your form has been saved successfully",
          })
        }
        return true
      } else if (formId) {
        // Preserve the existing status when saving (don't force to draft)
        // Use the current status from formSchema to maintain consistency
        await updateForm({
          id: formId,
          title: currentSchema.title,
          description: currentSchema.description,
          elements: currentSchema.elements,
          status: currentSchema.status, // Preserve current status instead of forcing to draft
        })
        setHasUnsavedChanges(false)
        setLastSaved(new Date())
        if (showToast) {
          toast({
            title: "Form saved",
            description: "Your changes have been saved",
          })
        }
        return true
      }
      return false
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      if (showToast) {
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
      return false
    } finally {
      setIsSaving(false)
    }
  }, [user, isSignedIn, session, isNew, formId, createForm, updateForm, toast, isEditMode])

  // Track changes to form schema and save immediately
  useEffect(() => {
    // Only save if in edit mode
    if (!isEditMode) {
      return
    }

    // Mark as having unsaved changes
    setHasUnsavedChanges(true)

    // Save immediately on any change (no debounce)
    saveFormAsDraft(false) // Silent auto-save
  }, [formSchema.title, formSchema.description, formSchema.elements, isEditMode, saveFormAsDraft])

  // Handler to toggle edit mode
  const handleToggleEditMode = (checked: boolean) => {
    // Prevent disabling edit mode if there are unsaved changes
    if (!checked && hasUnsavedChanges) {
      toast({
        title: "Unsaved Changes",
        description: "Please save your changes before disabling edit mode.",
        variant: "destructive",
      })
      return
    }

    setIsEditMode(checked)
    if (checked) {
      toast({
        title: "Edit Mode Enabled",
        description: "You can now edit this form. Changes will be saved automatically.",
      })
    } else {
      toast({
        title: "Edit Mode Disabled",
        description: "Form is now in read-only mode.",
      })
    }
  }

  // Show loading state while checking authentication
  if (!clerkLoaded || !sessionLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  // Require authentication to use form builder
  if (!user || !isSignedIn || !session) {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDragStart = (_event: DragStartEvent) => {
    // Drag started
  }

  const handleDragEnd = (event: DragEndEvent) => {
    // Don't allow drag operations if not in edit mode
    if (!isEditMode) return

    const { active, over } = event

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
        setHasUnsavedChanges(true)
        return {
          ...prev,
          elements: newElements,
        }
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: _, ...updateArgs } = updated
            updateForm({ id: formId, ...updateArgs })
          }
          return updated
        })
      }
    }
  }

  const updateElement = (elementId: string, updates: Partial<FormElement>) => {
    if (!isEditMode) return

    setFormSchema((prev) => {
      setHasUnsavedChanges(true)
      return {
        ...prev,
        elements: prev.elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el)),
      }
    })
  }

  const deleteElement = (elementId: string) => {
    if (!isEditMode) return

    setFormSchema((prev) => {
      setHasUnsavedChanges(true)
      return {
        ...prev,
        elements: prev.elements.filter((el) => el.id !== elementId),
      }
    })
    setSelectedElementId(null)
  }

  const handlePublishForm = async (settings: {
    allowAnonymous: boolean
    collectEmails: boolean
    shareUrl?: string
    embedCode?: string
  }) => {
    // Check authentication before publishing
    if (!user || !isSignedIn || !session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to publish forms. Your session may have expired.",
        variant: "destructive",
      })
      return
    }

    // Validate form has elements
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

      // Save form first if it's new
      if (isNew || !formId) {
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
          setHasUnsavedChanges(false)
        } catch (createError: any) {
          const errorMsg = createError?.message || String(createError)
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
      } else {
        // Save any unsaved changes before publishing
        await saveFormAsDraft(false)
      }

      // Generate share URL and embed code
      const shareUrl = settings.shareUrl || `${window.location.origin}/forms/${currentFormId}`
      const embedCode = settings.embedCode || `<iframe src="${shareUrl}?embed=true" width="100%" height="600" frameborder="0"></iframe>`

      // Publish the form
      await publishForm({
        id: currentFormId!,
        shareUrl,
        embedCode,
        allowAnonymous: settings.allowAnonymous,
        collectEmails: settings.collectEmails,
      })

      // Update local state
      const publishedAt = Date.now()
      setFormSchema((prev) => ({
        ...prev,
        status: "published",
        publishedAt,
        shareUrl,
        embedCode,
      }))

      // Close publish dialog and show share URL dialog
      setShowPublishDialog(false)
      setShowShareUrlDialog(true)
    } catch (error: any) {
      const errorMsg = error?.message || String(error)
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderFormElement = (element: FormElement, _index: number) => {
    const isSelected = selectedElement?.id === element.id

    return (
      <div
        key={element.id}
        className={`mb-4 p-4 border rounded-lg transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          } ${isEditMode ? "cursor-move" : "cursor-default"}`}
        onClick={() => isEditMode && setSelectedElementId(element.id)}
        data-element-id={element.id}
      >
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">{element.label}</Label>
          {isEditMode && (
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
          )}
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


  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={isEditMode ? handleDragStart : undefined}
      onDragEnd={isEditMode ? handleDragEnd : undefined}
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
          <div className="flex flex-col gap-3 p-4 border-b bg-card">
            {/* Edit Mode Toggle & Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-mode"
                    checked={isEditMode}
                    onCheckedChange={handleToggleEditMode}
                    disabled={hasUnsavedChanges && isEditMode}
                  />
                  <Label htmlFor="edit-mode" className="cursor-pointer flex items-center space-x-2">
                    <Edit className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {isEditMode ? "Edit Mode" : "View Mode"}
                    </span>
                  </Label>
                </div>
                {formSchema.status === "published" && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Globe className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">Published</span>
                  </div>
                )}
                {hasUnsavedChanges && isEditMode && (
                  <span className="text-xs text-muted-foreground">
                    Unsaved changes
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {lastSaved && !hasUnsavedChanges && (
                  <span className="text-xs text-muted-foreground">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                {isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveFormAsDraft(true)}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                )}
              </div>
            </div>

            {/* Form Title & Description */}
            <div className="space-y-2">
              <Input
                value={formSchema.title}
                onChange={(e) => setFormSchema((prev) => {
                  setHasUnsavedChanges(true)
                  return { ...prev, title: e.target.value }
                })}
                disabled={!isEditMode}
                className="font-semibold text-lg border-none p-0 h-auto focus-visible:ring-0 disabled:opacity-100 disabled:cursor-not-allowed"
                placeholder="Form Title"
              />
              <Input
                value={formSchema.description}
                onChange={(e) => setFormSchema((prev) => {
                  setHasUnsavedChanges(true)
                  return { ...prev, description: e.target.value }
                })}
                disabled={!isEditMode}
                className="text-sm text-muted-foreground border-none p-0 h-auto focus-visible:ring-0 disabled:opacity-100 disabled:cursor-not-allowed"
                placeholder="Form Description"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRealtimePreview(!showRealtimePreview)}
                className={showRealtimePreview ? "bg-primary/10" : ""}
              >
                {showRealtimePreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showRealtimePreview ? "Hide Preview" : "Show Preview"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Full Preview
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowIntegrations(true)}>
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
                  <Button variant="outline" onClick={() => setShowShareUrlDialog(true)}>
                    <Share className="h-4 w-4 mr-2" />
                    Share
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
        {selectedElement && isEditMode && (
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
          onPublish={handlePublishForm}
        />

        {/* Share URL Dialog - shown after publishing */}
        <ShareUrlDialog
          open={showShareUrlDialog}
          onOpenChange={setShowShareUrlDialog}
          shareUrl={formSchema.shareUrl || ""}
          embedCode={formSchema.embedCode}
          publishedAt={formSchema.publishedAt}
          formTitle={formSchema.title}
        />

        {/* Integrations Dialog */}
        <Dialog open={showIntegrations} onOpenChange={setShowIntegrations}>
          <DialogContent className="w-[60%] max-w-[60%] sm:max-w-[60%] h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle>Form Integrations</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <IntegrationsManager
                formId={formSchema.id}
                integrations={integrations}
                onUpdateIntegrations={setIntegrations}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  )
}
