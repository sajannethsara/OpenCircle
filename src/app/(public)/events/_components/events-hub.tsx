"use client"

import * as React from "react"
import { Calendar, History, Loader2 } from "lucide-react"
import { HistoryEventCard, HistoryEventItem } from "./history-event-card"
import { UpcomingEventCard, UpcomingEventItem } from "./upcoming-event-card"

const fallbackHistoryEvents: HistoryEventItem[] = [
  {
    id: "hist-1",
    title: "How to paint Monalissa (PlatformIO & ESP32)",
    eventDate: "2026-08-06T18:31:00.000Z",
    speaker: "Leonardo Da Vinci",
    link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    notesMd: "This project is designed for ESP32 development using PlatformIO. It includes a simple library and an example usage in the main application.",
  },
]

const fallbackUpcomingEvents: UpcomingEventItem[] = [
  {
    id: "upc-1",
    title: "Introducing OpenCircle Platform & Maintainer Guide",
    eventDate: "2026-08-24T20:30:00.000Z",
    speaker: "Raju",
    link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    notesMd: "To learn more about Next.js and open-source contribution guidelines, take a look at our community resources and pitch guide.",
  },
]

export function EventsHub() {
  const [events, setEvents] = React.useState<Array<HistoryEventItem & UpcomingEventItem>>([])
  const [loading, setLoading] = React.useState<boolean>(true)

  React.useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setEvents(data.data)
        }
      })
      .catch((err) => {
        console.error("Events fetch error:", err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const now = new Date().getTime()

  // Partition events into history and upcoming
  const historyEvents = events
    .filter((e) => {
      const t = new Date(e.eventDate).getTime()
      return !isNaN(t) && t < now
    })
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())

  const upcomingEvents = events
    .filter((e) => {
      const t = new Date(e.eventDate).getTime()
      return !isNaN(t) && t >= now
    })
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())

  const displayHistory = historyEvents.length > 0 ? historyEvents : fallbackHistoryEvents
  const displayUpcoming = upcomingEvents.length > 0 ? upcomingEvents : fallbackUpcomingEvents

  return (
    <div className="space-y-6">
      {/* Header Bar - Removed GitHub Discussions Button */}
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          Help Desk & Event Hub
        </h1>
        <p className="text-sm text-muted-foreground">
          Explore past session recordings, YouTube archives, upcoming live workshops, and technical pitch sessions.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-16 text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading session feeds...</span>
        </div>
      ) : (
        /* Asymmetrical 4-Column Grid: 3/4 Left (History), 1/4 Right (Upcoming) */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT COLUMN (3/4 Width Desktop, 2nd on Mobile): Past Sessions & Recordings */}
          <div className="lg:col-span-3 order-2 lg:order-1 flex flex-col space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <History className="h-4 w-4 text-amber-500" />
                Past Sessions
              </h2>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/40">
                {displayHistory.length} Recorded
              </span>
            </div>

            {/* Scrollable History Container */}
            <div className="max-h-[calc(100vh-230px)] overflow-y-auto space-y-4 pr-1.5 [scrollbar-width:thin]">
              {displayHistory.map((event, index) => (
                <HistoryEventCard key={event.id || `hist-${index}`} event={event} number={displayHistory.length - index} />
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN (1/4 Width Desktop, 1st on Mobile): Upcoming Live Sessions */}
          <div className="lg:col-span-1 order-1 lg:order-2 flex flex-col space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-red-500" />
                Upcoming
              </h2>
              <span className="text-xs font-medium text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                {displayUpcoming.length} Live
              </span>
            </div>

            {/* Scrollable Upcoming Container */}
            <div className="max-h-[calc(100vh-230px)] overflow-y-auto space-y-4 pr-1.5 [scrollbar-width:thin]">
              {displayUpcoming.map((event, index) => (
                <UpcomingEventCard key={event.id || `upc-${index}`} event={event} number={displayHistory.length + index + 1} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
