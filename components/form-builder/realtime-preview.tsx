"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { FormSchema } from "@/types/form"

interface RealtimePreviewProps {
  formSchema: FormSchema
}

export function RealtimePreview({ formSchema }: RealtimePreviewProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Reset form data when schema changes significantly
  useEffect(() => {
    const currentElementIds = formSchema.elements.map((el) => el.id)
    const formDataKeys = Object.keys(formData)

    // Remove data for deleted elements
    const cleanedFormData = Object.fromEntries(
      Object.entries(formData).filter(([key]) => currentElementIds.includes(key)),
    )

    if (formDataKeys.length !== Object.keys(cleanedFormData).length) {
      setFormData(cleanedFormData)
    }
  }, [formSchema.elements, formData])

  const validateField = (element: any, value: any): string | null => {
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

    // Real-time validation
    const element = formSchema.elements.find((el) => el.id === elementId)
    if (element) {
      const error = validateField(element, value)
      setValidationErrors((prev) => ({
        ...prev,
        [elementId]: error || "",
      }))
    }

    // Clear submit success when user starts typing again
    if (submitSuccess) {
      setSubmitSuccess(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate all fields
    const errors: Record<string, string> = {}
    formSchema.elements.forEach((element) => {
      const error = validateField(element, formData[element.id])
      if (error) {
        errors[element.id] = error
      }
    })

    setValidationErrors(errors)

    if (Object.keys(errors).length === 0) {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSubmitSuccess(true)
      console.log("Form submitted:", formData)
    }

    setIsSubmitting(false)
  }

  const getFieldCount = () => {
    const total = formSchema.elements.length
    const filled = formSchema.elements.filter((el) => {
      const value = formData[el.id]
      return value && (typeof value !== "string" || value.trim() !== "")
    }).length
    return { filled, total }
  }

  const { filled, total } = getFieldCount()
  const progressPercentage = total > 0 ? (filled / total) * 100 : 0

  return (
    <div className="p-6 space-y-6">
      {/* Preview Header with Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            Live Preview
          </Badge>
          
        </div>

        </div>

      {/* Form Preview */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">{formSchema.title}</CardTitle>
          {formSchema.description && <p className="text-muted-foreground text-sm">{formSchema.description}</p>}
        </CardHeader>
        <CardContent>
          {formSchema.elements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Add form elements to see the preview</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formSchema.elements.map((element) => {
                const hasError = validationErrors[element.id]
                const fieldValue = formData[element.id]

                return (
                  <div key={element.id} className="space-y-2">
                    <Label htmlFor={`preview-${element.id}`} className="flex items-center space-x-1">
                      <span>{element.label}</span>
                      {element.required && <span className="text-destructive">*</span>}
                    </Label>

                    {element.type === "text" || element.type === "email" || element.type === "number" ? (
                      <Input
                        id={`preview-${element.id}`}
                        type={element.type}
                        placeholder={element.placeholder}
                        value={fieldValue || ""}
                        onChange={(e) => updateFormData(element.id, e.target.value)}
                        className={hasError ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                    ) : element.type === "textarea" ? (
                      <Textarea
                        id={`preview-${element.id}`}
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
                          {element.options?.map((option, idx) => (
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
                        {element.options?.map((option, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`preview-${element.id}-${idx}`} />
                            <Label htmlFor={`preview-${element.id}-${idx}`}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : element.type === "checkbox" ? (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`preview-${element.id}`}
                          checked={fieldValue || false}
                          onCheckedChange={(checked) => updateFormData(element.id, checked)}
                          className={hasError ? "border-destructive" : ""}
                        />
                        <Label htmlFor={`preview-${element.id}`}>{element.label}</Label>
                      </div>
                    ) : null}

                    {hasError && (
                      <div className="flex items-center space-x-1 text-sm text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span>{hasError}</span>
                      </div>
                    )}
                  </div>
                )
              })}

              
            </form>
          )}
        </CardContent>
      </Card>

      {/* Preview Insights */}
      {formSchema.elements.length > 0 && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Preview Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Total fields:</span>
              <span>{total}</span>
            </div>
            <div className="flex justify-between">
              <span>Required fields:</span>
              <span>{formSchema.elements.filter((el) => el.required).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Completion rate:</span>
              <span>{total > 0 ? Math.round((filled / total) * 100) : 0}%</span>
            </div>
            <div className="flex justify-between">
              <span>Validation errors:</span>
              <span className={Object.values(validationErrors).filter(Boolean).length > 0 ? "text-destructive" : ""}>
                {Object.values(validationErrors).filter(Boolean).length}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
