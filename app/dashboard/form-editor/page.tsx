"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { FormEditorPage } from "@/components/form-editor/form-editor-page"

export default function FormEditorRoute() {
  return (
    <ProtectedRoute>
      <FormEditorPage />
    </ProtectedRoute>
  )
}

