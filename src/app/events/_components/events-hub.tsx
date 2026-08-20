"use client"

import * as React from "react"
import { Calendar, Video, Clock, ExternalLink, HelpCircle, Loader2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"

interface EventItem {
  id?: string
  title: string
  date: string
  time: string
  speaker: string
  type: string
  status?: string
  link?: string
}

const fallbackEvents: EventItem[] = [
  {
    id: "fb-1",
    title: "GitHub Actions & CI/CD Pipeline Workshop",
    date: "Aug 22, 2026",
    time: "7:00 PM - 8:30 PM",
    speaker: "Batch 23 DevOps Lead",
    type: "Workshop",
    status: "Upcoming",
  },
  {
    id: "fb-2",
    title: "OpenCircle Project Proposal Pitch Session",
    date: "Aug 26, 2026",
    time: "6:00 PM - 7:30 PM",
    speaker: "Batch Maintainers Board",
    type: "Community Event",
    status: "Upcoming",
  },
]

export function EventsHub() {
  const [events, setEvents] = React.useState<EventItem[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)

  React.useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setEvents(data.data)
        } else {
          setEvents(fallbackEvents)
        }
      })
      .catch((err) => {
        console.error("Events fetch error:", err)
        setEvents(fallbackEvents)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Help Desk & Event Hub</h1>
        <p className="text-sm text-muted-foreground">
          Weekly live sessions, technical workshops, YouTube recordings, and community help desk archives.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events Feed (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Upcoming Live Sessions
          </h2>

          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs font-medium">Loading events...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={event.id || index} className="rounded-xl border border-border/60 bg-card p-5 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block rounded bg-accent px-2 py-0.5 text-[10px] font-mono font-medium text-accent-foreground mb-1">
                        {event.type}
                      </span>
                      <h3 className="text-base font-semibold text-foreground">{event.title}</h3>
                    </div>
                    {event.link ? (
                      <a
                        href={event.link}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Join Session
                      </a>
                    ) : (
                      <Button size="sm" variant="outline">
                        Set Reminder
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {event.time}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5" />
                      {event.speaker}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Desk Info (1 Col) */}
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4 shadow-sm h-fit">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <HelpCircle className="h-5 w-5" />
            <span>Public Help Desk</span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Need technical assistance? All bug reports, architectural questions, and debugging help are answered publicly in GitHub Discussions.
          </p>

          <div className="space-y-2 pt-2 border-t border-border/40">
            <a
              href="https://github.com/sajannethsara/OpenCircle/discussions"
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm", className: "w-full justify-between" })}
            >
              <span>Ask on GitHub Discussions</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
