export interface FormElement {
  id: string
  type: "text" | "email" | "textarea" | "select" | "radio" | "checkbox" | "number"
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
  }
}

export interface FormSchema {
  id: string
  title: string
  description: string
  elements: FormElement[]
  status: "draft" | "published" | "unpublished"
  publishedAt?: number
  shareUrl?: string
  embedCode?: string
  allowAnonymous?: boolean
  collectEmails?: boolean
}