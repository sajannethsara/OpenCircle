"use client"

import * as React from "react"
import { FolderGit2, BookOpen, Copy, Check, Loader2, AlertCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MdxViewer } from "@/components/mdx"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ReadmeDialogProps {
  projectName: string
  readmeUrl: string
}

export function ReadmeDialog({ projectName, readmeUrl }: ReadmeDialogProps) {
  const [open, setOpen] = React.useState<boolean>(false)
  const [markdown, setMarkdown] = React.useState<string>("")
  const [loading, setLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState<boolean>(false)

  const fetchReadme = React.useCallback(async () => {
    if (!readmeUrl) {
      setError("No README URL provided for this project.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(readmeUrl)
      if (!res.ok) {
        throw new Error(`Failed to fetch README (${res.status} ${res.statusText})`)
      }
      const text = await res.text()
      setMarkdown(text)
    } catch (err) {
      console.error("ReadmeDialog fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to load README content")
    } finally {
      setLoading(false)
    }
  }, [readmeUrl])

  React.useEffect(() => {
    if (open && !markdown && !loading) {
      fetchReadme()
    }
  }, [open, markdown, loading, fetchReadme])

  const handleCopy = async () => {
    if (!markdown) return
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            View README
          </Button>
        }
      />
      <DialogContent className="max-w-7xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="border-b border-border/40 pb-3 pr-8 flex flex-row items-center justify-start">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-bold">
            <BookOpen className="h-5 w-5 text-primary" />
            {projectName} README
          </DialogTitle>

          {markdown && !loading && !error && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 shrink-0 mr-4"
              title="Copy markdown content"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy MD</span>
                </>
              )}
            </Button>
          )}
        </DialogHeader>

        {/* Content Body with Hidden Scrollbar */}
        <div className="flex-1 overflow-y-auto pr-1 pt-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {loading && (
            <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs font-medium">Loading README content...</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center justify-center p-8 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-xs gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && !markdown.trim() && (
            <div className="flex items-center justify-center p-12 text-muted-foreground/60 text-xs gap-2">
              <FileText className="h-4 w-4" />
              <span>No README documentation content found.</span>
            </div>
          )}

          {!loading && !error && markdown.trim() && (
            <MdxViewer content={markdown} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
