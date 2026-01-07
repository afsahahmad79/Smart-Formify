"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle } from "lucide-react"
import type { FormElement } from "@/types/form"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"



export default function PublicFormPage() {
  const params = useParams()
  const formId = params.id as string
  // Fetch the real form from Convex
  const form = useQuery(api.forms.queries.getPublishedForm, { id: formId as Id<"forms"> })
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isEmbedded, setIsEmbedded] = useState(false)
  const [submitterEmail, setSubmitterEmail] = useState("")

  // Authentication
  const { isSignedIn } = useUser()

  useEffect(() => {
    // Check if this is an embedded form
    const urlParams = new URLSearchParams(window.location.search)
    setIsEmbedded(urlParams.get("embed") === "true")
  }, [])

  const validateField = (element: FormElement, value: any): string | null => {
    if (element.required && (!value || (typeof value === "string" && value.trim() === ""))) {
      return `${element.label} is required`
    }

    if (element.validation && typeof value === "string" && value) {
      if (element.validation.minLength && value.length < element.validation.minLength) {
        return `${element.label} must be at least ${element.validation.minLength} characters`
      }

      if (element.validation.maxLength && value.length > element.validation.maxLength) {
        return `${element.label} must be no more than ${element.validation.maxLength} characters`
      }

      if (element.validation.pattern) {
        try {
          const regex = new RegExp(element.validation.pattern)
          if (!regex.test(value)) {
            return `${element.label} format is invalid`
          }
        } catch {
          // Invalid regex pattern
        }
      }
    }

    return null
  }

  const updateFormData = (elementId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [elementId]: value,
    }))

    // Clear validation error when user starts typing
    if (validationErrors[elementId]) {
      setValidationErrors((prev) => ({
        ...prev,
        [elementId]: "",
      }))
    }
  }

  // Use Convex mutation for real submissions
  const submitForm = useMutation(api.submissions.mutations.submitForm)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return

    setIsSubmitting(true)

    // Validate all fields
    const errors: Record<string, string> = {}
    form.elements.forEach((element) => {
      const formElement = element as FormElement
      const error = validateField(formElement, formData[formElement.id])
      if (error) {
        errors[formElement.id] = error
      }
    })

    setValidationErrors(errors)


    if (Object.keys(errors).length === 0) {
      // Validate email if required
      if ((form as any).collectEmails && !submitterEmail.trim()) {
        setValidationErrors({ email: "Email is required" })
        setIsSubmitting(false)
        return
      }

      // Save submission to backend
      try {
        await submitForm({
          formId: formId as Id<"forms">,
          data: formData,
          submitterEmail: (form as any).collectEmails ? submitterEmail : undefined,
        })
        setSubmitSuccess(true)
      } catch (err) {
        // Optionally show error toast
        console.error("Submission error:", err)
      }
    }

    setIsSubmitting(false)
  }

  if (!form) {
    return (
      <div
        className={`${isEmbedded ? "min-h-screen" : "h-screen"} flex items-center justify-center ${isEmbedded ? "bg-transparent" : "bg-background"}`}
      >
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Form Not Found</h2>
              <p className="text-sm">This form may have been unpublished or doesn't exist.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if authentication is required
  if (!(form as any).allowAnonymous && !isSignedIn) {
    return (
      <div
        className={`${isEmbedded ? "min-h-screen" : "h-screen"} flex items-center justify-center ${isEmbedded ? "bg-transparent" : "bg-background"}`}
      >
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
              <h2 className="text-lg font-semibold mb-2">Authentication Required</h2>
              <p className="text-sm text-muted-foreground mb-4">
                This form requires you to sign in to submit responses.
              </p>
              <a href="/auth/sign-in">
                <Button>Sign In</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitSuccess) {
    return (
      <div
        className={`${isEmbedded ? "min-h-screen" : "h-screen"} flex items-center justify-center ${isEmbedded ? "bg-transparent" : "bg-background"}`}
      >
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h2 className="text-lg font-semibold mb-2">Thank You!</h2>
              <p className="text-sm text-muted-foreground">Your response has been submitted successfully.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`${isEmbedded ? "min-h-screen" : "h-screen overflow-y-auto"} py-4 sm:py-8 px-2 sm:px-4 ${isEmbedded ? "bg-transparent" : "bg-background"}`}>
      <div className="max-w-2xl mx-auto min-h-full">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div>
                <CardTitle className="text-xl sm:text-2xl">{form.title}</CardTitle>
                {form.description && <p className="text-xs sm:text-base text-muted-foreground mt-1 sm:mt-2">{form.description}</p>}
              </div>
              {!isEmbedded && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs sm:text-sm px-2 py-1">
                  Live Form
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Email collection field if required */}
              {(form as any).collectEmails && (
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="submitterEmail" className="flex items-center space-x-1 text-sm sm:text-base">
                    <span>Email Address</span>
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="submitterEmail"
                    type="email"
                    placeholder="Enter your email address"
                    value={submitterEmail}
                    onChange={(e) => setSubmitterEmail(e.target.value)}
                    className={validationErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                    required
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-destructive">{validationErrors.email}</p>
                  )}
                </div>
              )}

              {form.elements.map((element) => {
                const formElement = element as FormElement
                const hasError = validationErrors[formElement.id]
                const fieldValue = formData[formElement.id]

                return (
                  <div key={formElement.id} className="space-y-1 sm:space-y-2">
                    <Label htmlFor={formElement.id} className="flex items-center space-x-1 text-sm sm:text-base">
                      <span>{formElement.label}</span>
                      {formElement.required && <span className="text-destructive">*</span>}
                    </Label>

                    {formElement.type === "text" || formElement.type === "email" || formElement.type === "number" ? (
                      <Input
                        id={formElement.id}
                        type={formElement.type}
                        placeholder={formElement.placeholder}
                        value={fieldValue || ""}
                        onChange={(e) => updateFormData(formElement.id, e.target.value)}
                        className={hasError ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                    ) : formElement.type === "textarea" ? (
                      <Textarea
                        id={formElement.id}
                        placeholder={formElement.placeholder}
                        value={fieldValue || ""}
                        onChange={(e) => updateFormData(formElement.id, e.target.value)}
                        className={hasError ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                    ) : formElement.type === "select" ? (
                      <Select value={fieldValue || ""} onValueChange={(value) => updateFormData(formElement.id, value)}>
                        <SelectTrigger className={hasError ? "border-destructive focus:ring-destructive" : ""}>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {formElement.options?.map((option: string, idx: number) => (
                            <SelectItem key={idx} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : formElement.type === "radio" ? (
                      <RadioGroup
                        value={fieldValue || ""}
                        onValueChange={(value) => updateFormData(formElement.id, value)}
                        className={hasError ? "border border-destructive rounded-md p-2" : ""}
                      >
                        {formElement.options?.map((option: string, idx: number) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${formElement.id}-${idx}`} />
                            <Label htmlFor={`${formElement.id}-${idx}`}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : formElement.type === "checkbox" ? (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={formElement.id}
                          checked={fieldValue || false}
                          onCheckedChange={(checked) => updateFormData(formElement.id, checked)}
                          className={hasError ? "border-destructive" : ""}
                        />
                        <Label htmlFor={formElement.id}>{formElement.label}</Label>
                      </div>
                    ) : null}

                    {hasError && (
                      <div className="flex items-center space-x-1 text-xs sm:text-sm text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span>{hasError}</span>
                      </div>
                    )}
                  </div>
                )
              })}

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Form"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {!isEmbedded && (
          <div className="text-center mt-4 sm:mt-6">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Powered by <span className="font-semibold text-primary">Smart Formify</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
