"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Copy, Check } from "lucide-react"
import type { FormSchema } from "@/types/form"
import { useToast } from "@/hooks/use-toast"
import { copyToClipboard } from "@/lib/clipboard"

interface PublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formSchema: FormSchema
  onPublish?: (settings: {
    allowAnonymous: boolean
    collectEmails: boolean
    shareUrl?: string
    embedCode?: string
  }) => void
}

export function PublishDialog({
  open,
  onOpenChange,
  formSchema,
  onPublish,
}: PublishDialogProps) {
  const { toast } = useToast()
  const [allowAnonymous, setAllowAnonymous] = useState(true)
  const [collectEmails, setCollectEmails] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = formSchema.shareUrl || ""
  const isPublished = formSchema.status === "published"

  const handlePublish = () => {
    if (!onPublish) return
    
    onPublish({
      allowAnonymous,
      collectEmails,
    })
  }

  const handleCopyUrl = async () => {
    if (shareUrl) {
      const success = await copyToClipboard(shareUrl)
      if (success) {
        setCopied(true)
        toast({
          title: "Link copied!",
          description: "Share URL has been copied to clipboard",
        })
        setTimeout(() => setCopied(false), 2000)
      } else {
        toast({
          title: "Failed to copy",
          description: "Copy to clipboard is not supported in this browser.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogTitle>
          {isPublished ? "Form Published" : "Publish Form"}
        </DialogTitle>
        <DialogDescription>
          {isPublished
            ? "Your form is live and ready to collect responses"
            : "Configure your form settings before publishing"}
        </DialogDescription>

        {isPublished ? (
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600 hover:bg-green-600">
                Published
              </Badge>
              {formSchema.publishedAt && (
                <span className="text-sm text-muted-foreground">
                  Published {new Date(formSchema.publishedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {shareUrl && (
              <div className="space-y-2">
                <Label>Share URL</Label>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="flex-1" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(shareUrl, "_blank")}
                  >
                    Open
                  </Button>
                </div>
              </div>
            )}

            {formSchema.embedCode && (
              <div className="space-y-2">
                <Label>Embed Code</Label>
                <div className="flex gap-2">
                  <Input value={formSchema.embedCode} readOnly className="flex-1 font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={async () => {
                      const success = await copyToClipboard(formSchema.embedCode || "")
                      if (success) {
                        toast({
                          title: "Embed code copied!",
                          description: "Embed code has been copied to clipboard",
                        })
                      }
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-anonymous">Allow Anonymous Submissions</Label>
                <Switch
                  id="allow-anonymous"
                  checked={allowAnonymous}
                  onCheckedChange={setAllowAnonymous}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Allow users to submit the form without signing in
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="collect-emails">Collect Email Addresses</Label>
                <Switch
                  id="collect-emails"
                  checked={collectEmails}
                  onCheckedChange={setCollectEmails}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically collect email addresses from form submissions
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handlePublish}>
                Publish Form
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}