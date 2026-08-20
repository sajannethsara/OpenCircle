"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MdxViewerProps {
  content: string
  className?: string
}

export function MdxViewer({ content, className = "" }: MdxViewerProps) {
  if (!content || !content.trim()) {
    return (
      <div className="text-muted-foreground/60 text-xs italic py-4">
        No markdown content provided.
      </div>
    )
  }

  return (
    <div className={`prose dark:prose-invert max-w-none space-y-4 text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-xl font-bold tracking-tight text-foreground border-b border-border/40 pb-2 mt-4 mb-3" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-lg font-semibold tracking-tight text-foreground border-b border-border/30 pb-1.5 mt-4 mb-2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-base font-semibold text-foreground mt-3 mb-1.5" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-sm font-semibold text-foreground mt-2 mb-1" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-muted-foreground text-sm leading-relaxed my-2" {...props} />
          ),
          a: ({ node, href, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline break-words"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-1 my-2 pl-2 text-muted-foreground" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-1 my-2 pl-2 text-muted-foreground" {...props} />
          ),
          li: ({ node, ...props }) => <li className="my-0.5 text-sm" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-primary/60 bg-muted/30 px-4 py-2 italic text-muted-foreground my-3 rounded-r-md"
              {...props}
            />
          ),
          code: ({ node, className: codeClassName, children, ...props }: any) => {
            const contentStr = Array.isArray(children) ? children.join("") : String(children ?? "")
            const hasNewline = contentStr.includes("\n")
            const isLanguageCode = Boolean(codeClassName && codeClassName.includes("language-"))

            const isInline = !hasNewline && !isLanguageCode

            if (isInline) {
              return (
                <code
                  className="inline rounded bg-accent/80 px-1.5 py-0.5 font-mono text-[12px] font-medium text-accent-foreground border border-border/30"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return (
              <pre className="overflow-x-auto rounded-lg border border-border/50 bg-muted/70 p-3 font-mono text-xs text-foreground my-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <code className={codeClassName} {...props}>
                  {children}
                </code>
              </pre>
            )
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-border/50 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left text-xs border-collapse" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="bg-muted/80 p-2.5 font-semibold text-foreground border-b border-border/50" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="p-2.5 border-b border-border/30 text-muted-foreground" {...props} />
          ),
          img: ({ node, alt, src: imgSrc, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc}
              alt={alt || "Markdown Image"}
              className="max-w-full h-auto rounded-md my-3 border border-border/40 object-contain"
              loading="lazy"
              {...props}
            />
          ),
          hr: ({ node, ...props }) => <hr className="my-4 border-border/40" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
