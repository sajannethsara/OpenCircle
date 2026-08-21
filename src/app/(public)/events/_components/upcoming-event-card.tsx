"use client"

import * as React from "react"
import { Calendar, Video, Clock } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { MdxViewer } from "@/components/mdx"
import { EventCountdown } from "./event-countdown"

export interface UpcomingEventItem {
  id?: string
  title: string
  eventDate: string
  speaker: string
  link?: string
  notesMd?: string
}

interface UpcomingEventCardProps {
  event: UpcomingEventItem
  number:number
}

export function UpcomingEventCard({ event,number }: UpcomingEventCardProps) {
  const dateObj = new Date(event.eventDate)
  const isValidDate = !isNaN(dateObj.getTime())
  const formattedDate = isValidDate
    ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : event.eventDate
  const formattedTime = isValidDate
    ? dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : ""

  return (
    <div className="rounded-xl border border-red-500/30 bg-card p-4 space-y-3 shadow-sm hover:border-red-500/50 transition-colors relative">
      {/* Top Header & Live Countdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
<span className="text-2xl font-bold font-mono mr-2">#{number}</span>
          <EventCountdown targetDate={event.eventDate} />
        </div>

        <h3 className="text-sm font-bold text-foreground leading-snug">{event.title}</h3>
      </div>

      <div className="flex flex-col space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-2.5">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <Calendar className="h-3.5 w-3.5 text-red-500 shrink-0" />
          <span>{formattedDate}</span>
          {formattedTime && <span>at {formattedTime}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <Video className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{event.speaker}</span>
        </div>
      </div>

      {/* Reddish Join Live Stream Button */}
      {event.link ? (
        <a
          href={event.link}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({
            variant: "default",
            size: "sm",
            className: "w-full justify-center gap-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm border border-red-500/30",
          })}
        >
          <Video className="h-3.5 w-3.5" />
          <span>Join Live Stream</span>
        </a>
      ) : (
        <Button size="sm" variant="outline" className="w-full text-xs">
          Set Reminder
        </Button>
      )}

      {event.notesMd && (
        <div className="border-t border-border/40 pt-2 text-xs text-muted-foreground  overflow-y-auto">
          <MdxViewer content={event.notesMd} />
        </div>
      )}
    </div>
  )
}
