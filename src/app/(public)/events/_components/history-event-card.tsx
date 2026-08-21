"use client"

import * as React from "react"
import { Calendar, Video, Clock, PlayCircle } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { MdxViewer } from "@/components/mdx"

export interface HistoryEventItem {
  id?: string
  title: string
  eventDate: string
  speaker: string
  link?: string
  notesMd?: string
}

interface HistoryEventCardProps {
  event: HistoryEventItem
  number?: number
}

export function HistoryEventCard({ event, number }: HistoryEventCardProps) {
  const dateObj = new Date(event.eventDate)
  const isValidDate = !isNaN(dateObj.getTime())
  const formattedDate = isValidDate
    ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : event.eventDate
  const formattedTime = isValidDate
    ? dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : ""

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3 shadow-sm hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground leading-snug"> <span className="text-2xl font-mono mr-2">#{number}</span>{event.title}</h3>
        </div>

        {event.link ? (
          <a
            href={event.link}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({
              variant: "secondary",
              size: "sm",
              className: "shrink-0 gap-1.5 text-xs bg-secondary text-secondary-foreground hover:bg-muted border border-border/50",
            })}
          >
            <PlayCircle className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Watch Recording</span>
          </a>
        ) : (
          <Button size="sm" variant="ghost" disabled className="text-xs text-muted-foreground">
            No Recording
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          {formattedDate}
        </span>
        {formattedTime && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formattedTime}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Video className="h-3.5 w-3.5" />
          {event.speaker}
        </span>
      </div>

      {event.notesMd && (
        <div className="border-t border-amber-500/60 pt-3 opacity-60 text-xs text-muted-foreground">
          <MdxViewer content={event.notesMd} />
        </div>
      )}
    </div>
  )
}
