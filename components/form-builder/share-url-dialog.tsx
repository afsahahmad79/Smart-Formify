"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Copy, Check, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { copyToClipboard } from "@/lib/clipboard"

interface ShareUrlDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shareUrl: string
  embedCode?: string
  publishedAt?: number
  formTitle?: string
}

export function ShareUrlDialog({
  open,
  onOpenChange,
  shareUrl,
  embedCode,
  publishedAt,
  formTitle,
}: ShareUrlDialogProps) {
  const { toast } = useToast()
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)

  // Reset copied states when dialog opens
  useEffect(() => {
    if (open) {
      setCopiedUrl(false)
      setCopiedEmbed(false)
    }
  }, [open])

  const handleCopyUrl = async () => {
    if (shareUrl) {
      const success = await copyToClipboard(shareUrl)
      if (success) {
        setCopiedUrl(true)
        toast({
          title: "Link copied!",
          description: "Share URL has been copied to clipboard",
        })
        setTimeout(() => setCopiedUrl(false), 2000)
      } else {
        toast({
          title: "Failed to copy",
          description: "Copy to clipboard is not supported in this browser.",
          variant: "destructive",
        })
      }
    }
  }

  const handleCopyEmbed = async () => {
    if (embedCode) {
      const success = await copyToClipboard(embedCode)
      if (success) {
        setCopiedEmbed(true)
        toast({
          title: "Embed code copied!",
          description: "Embed code has been copied to clipboard",
        })
        setTimeout(() => setCopiedEmbed(false), 2000)
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
      <DialogContent className="sm:max-w-[550px] p-6">
        <div className="space-y-4">
          <div>
            <DialogTitle className="text-2xl font-bold mb-2">
              {formTitle ? `${formTitle} - Published!` : "Form Published!"}
            </DialogTitle>
            <DialogDescription>
              Your form is live and ready to collect responses. Share the link with your audience.
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-green-600 hover:bg-green-600 text-white">
              Published
            </Badge>
            {publishedAt && (
              <span className="text-sm text-muted-foreground">
                Published {new Date(publishedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Share URL</Label>
            <div className="flex gap-2">
              <Input 
                value={shareUrl} 
                readOnly 
                className="flex-1 font-mono text-sm" 
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyUrl}
                className="shrink-0"
              >
                {copiedUrl ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(shareUrl, "_blank")}
                className="shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Copy this link to share your form with others
            </p>
          </div>

          {embedCode && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">Embed Code</Label>
              <div className="flex gap-2">
                <Input 
                  value={embedCode} 
                  readOnly 
                  className="flex-1 font-mono text-xs" 
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyEmbed}
                  className="shrink-0"
                >
                  {copiedEmbed ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Copy this code to embed the form on your website
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

