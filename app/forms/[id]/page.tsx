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
import type { FormSchema } from "@/types/form"
import type { FormElement } from "@/types/form"

// Mock form data - in a real app, this would come from your database
const mockForms: Record<string, FormSchema> = {
  "new-form": {
    id: "new-form",
    title: "Contact Us",
    description: "Get in touch with our team",
    status: "published",
    publishedAt: new Date("2024-01-15T10:00:00Z").getTime(),
    shareUrl: "/forms/new-form",
    elements: [
      {
        id: "name",
        type: "text",
        label: "Full Name",
        placeholder: "Enter your full name",
        required: true,
      },
      {
        id: "email",
        type: "email",
        label: "Email Address",
        placeholder: "Enter your email",
        required: true,
      },
      {
        id: "message",
        type: "textarea",
        label: "Message",
        placeholder: "Tell us how we can help",
        required: true,
      },
    ],
  },
}

export default function PublicFormPage() {
  const params = useParams()
  const formId = params.id as string
  const [form, setForm] = useState<FormSchema | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isEmbedded, setIsEmbedded] = useState(false)

  useEffect(() => {
    // Check if this is an embedded form
    const urlParams = new URLSearchParams(window.location.search)
    setIsEmbedded(urlParams.get("embed") === "true")

    // Load form data (in a real app, fetch from API)
    const formData = mockForms[formId]
    if (formData && formData.status === "published") {
      setForm(formData)
    }
  }, [formId])

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
        } catch (e) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return

    setIsSubmitting(true)

    // Validate all fields
    const errors: Record<string, string> = {}
    form.elements.forEach((element) => {
      const error = validateField(element, formData[element.id])
      if (error) {
        errors[element.id] = error
      }
    })

    setValidationErrors(errors)

    if (Object.keys(errors).length === 0) {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSubmitSuccess(true)
      console.log("Form submitted:", { formId, data: formData })
    }

    setIsSubmitting(false)
  }

  if (!form) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isEmbedded ? "bg-transparent" : "bg-background"}`}
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

  if (submitSuccess) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isEmbedded ? "bg-transparent" : "bg-background"}`}
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
    <div className={`min-h-screen py-4 sm:py-8 px-2 sm:px-4 ${isEmbedded ? "bg-transparent" : "bg-background"}`}>
      <div className="max-w-2xl mx-auto">
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
              {form.elements.map((element: FormElement) => {
                const hasError = validationErrors[element.id]
                const fieldValue = formData[element.id]

                return (
                  <div key={element.id} className="space-y-1 sm:space-y-2">
                    <Label htmlFor={element.id} className="flex items-center space-x-1 text-sm sm:text-base">
                      <span>{element.label}</span>
                      {element.required && <span className="text-destructive">*</span>}
                    </Label>

                    {element.type === "text" || element.type === "email" || element.type === "number" ? (
                      <Input
                        id={element.id}
                        type={element.type}
                        placeholder={element.placeholder}
                        value={fieldValue || ""}
                        onChange={(e) => updateFormData(element.id, e.target.value)}
                        className={hasError ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                    ) : element.type === "textarea" ? (
                      <Textarea
                        id={element.id}
                        placeholder={element.placeholder}
                        value={fieldValue || ""}
                        onChange={(e) => updateFormData(element.id, e.target.value)}
                        className={hasError ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                    ) : element.type === "select" ? (
                      <Select value={fieldValue || ""} onValueChange={(value) => updateFormData(element.id, value)}>
                        <SelectTrigger className={hasError ? "border-destructive focus:ring-destructive" : ""}>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {element.options?.map((option: string, idx: number) => (
                            <SelectItem key={idx} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : element.type === "radio" ? (
                      <RadioGroup
                        value={fieldValue || ""}
                        onValueChange={(value) => updateFormData(element.id, value)}
                        className={hasError ? "border border-destructive rounded-md p-2" : ""}
                      >
                        {element.options?.map((option: string, idx: number) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${element.id}-${idx}`} />
                            <Label htmlFor={`${element.id}-${idx}`}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : element.type === "checkbox" ? (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={element.id}
                          checked={fieldValue || false}
                          onCheckedChange={(checked) => updateFormData(element.id, checked)}
                          className={hasError ? "border-destructive" : ""}
                        />
                        <Label htmlFor={element.id}>{element.label}</Label>
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
              Powered by <span className="font-semibold text-primary">FormCraft</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
