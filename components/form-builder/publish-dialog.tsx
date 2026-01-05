"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { FormSchema } from "@/types/form"

// Notice: onPublish is removed from the interface
interface PublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formSchema: FormSchema
}

export function PublishDialog({
  open,
  onOpenChange,
  formSchema,
}: PublishDialogProps) {
  const shareUrl = formSchema.shareUrl || ""

  // Safety check: Don't render content if not published
  if (formSchema.status !== "published") return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-10 bg-[#0f111a] border-slate-800 rounded-3xl shadow-2xl">
        
        {/* Accessibility hidden titles */}
        <div className="sr-only">
          <DialogTitle>Form Published</DialogTitle>
          <DialogDescription>Your form link is ready.</DialogDescription>
        </div>

        <div className="flex items-center justify-center gap-3">
          {/* Status Badge */}
          <Badge className="bg-[#9c8cff] hover:bg-[#9c8cff] text-[#0f111a] px-5 py-2.5 rounded-xl text-sm font-bold border-none transition-none">
            Published
          </Badge>

          {/* Action Button */}
          <Button 
            variant="outline"
            className="bg-[#1c1f2e] hover:bg-[#25293d] text-slate-200 border-slate-700 px-5 py-5 rounded-xl text-sm font-medium transition-colors"
            onClick={() => {
              if (shareUrl) window.open(shareUrl, "_blank")
            }}
          >
            Open public link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}