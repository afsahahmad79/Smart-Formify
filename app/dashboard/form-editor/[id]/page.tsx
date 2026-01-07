"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { FormEditorPage } from "@/components/form-editor/form-editor-page"
import { useParams } from "next/navigation"
import type { Id } from "@/convex/_generated/dataModel"

export default function FormEditorByIdRoute() {
  const params = useParams()
  const formId = params.id as string

  return (
    <ProtectedRoute>
      <FormEditorPage formId={formId as Id<"forms">} />
    </ProtectedRoute>
  )
}

