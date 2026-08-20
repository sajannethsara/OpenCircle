"use client"

import * as React from "react"
import {
  Calendar,
  Clock,
  Video,
  Plus,
  Trash2,
  Edit,
  Loader2,
  AlertCircle,
  ExternalLink,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export interface EventData {
  id: string
  title: string
  date: string
  time: string
  speaker: string
  type: string
  status: string
  link: string
  createdAt: string
}

export function AdminEventsManager() {
  const [events, setEvents] = React.useState<EventData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Add Event State
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [titleInput, setTitleInput] = React.useState("")
  const [dateInput, setDateInput] = React.useState("")
  const [timeInput, setTimeInput] = React.useState("7:00 PM - 8:30 PM")
  const [speakerInput, setSpeakerInput] = React.useState("Batch 23 Lead")
  const [typeInput, setTypeInput] = React.useState("Workshop")
  const [statusInput, setStatusInput] = React.useState("Upcoming")
  const [linkInput, setLinkInput] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  // Edit Event State
  const [editingEvent, setEditingEvent] = React.useState<EventData | null>(null)
  const [editTitle, setEditTitle] = React.useState("")
  const [editDate, setEditDate] = React.useState("")
  const [editTime, setEditTime] = React.useState("")
  const [editSpeaker, setEditSpeaker] = React.useState("")
  const [editType, setEditType] = React.useState("")
  const [editStatus, setEditStatus] = React.useState("")
  const [editLink, setEditLink] = React.useState("")
  const [updating, setUpdating] = React.useState(false)

  const fetchEvents = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/events")
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setEvents(data.data)
      } else {
        throw new Error(data.error || "Failed to fetch events")
      }
    } catch (err) {
      console.error("Error fetching events:", err)
      setError(err instanceof Error ? err.message : "Failed to load events")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titleInput.trim() || !dateInput.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleInput.trim(),
          date: dateInput.trim(),
          time: timeInput.trim(),
          speaker: speakerInput.trim(),
          type: typeInput.trim(),
          status: statusInput.trim(),
          link: linkInput.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create event")
      }

      setAddDialogOpen(false)
      setTitleInput("")
      setDateInput("")
      setTimeInput("7:00 PM - 8:30 PM")
      setSpeakerInput("Batch 23 Lead")
      setTypeInput("Workshop")
      setStatusInput("Upcoming")
      setLinkInput("")
      fetchEvents()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error creating event")
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenEdit = (event: EventData) => {
    setEditingEvent(event)
    setEditTitle(event.title)
    setEditDate(event.date)
    setEditTime(event.time)
    setEditSpeaker(event.speaker)
    setEditType(event.type)
    setEditStatus(event.status)
    setEditLink(event.link)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEvent) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          date: editDate,
          time: editTime,
          speaker: editSpeaker,
          type: editType,
          status: editStatus,
          link: editLink,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update event")
      }

      setEditingEvent(null)
      fetchEvents()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating event")
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete event "${title}"?`)) return

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (res.ok && data.success) {
        fetchEvents()
      } else {
        alert(data.error || "Failed to delete event")
      }
    } catch (err) {
      console.error("Error deleting event:", err)
    }
  }

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Manage Events
          </h1>
          <p className="text-sm text-muted-foreground">
            Schedule workshops, live technical sessions, project proposal pitches, and community events.
          </p>
        </div>

        {/* Add Event Modal */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger
            render={
              <Button className="shrink-0">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Event
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule New Event</DialogTitle>
              <DialogDescription>
                Fill in session details for live workshops, community meetups, or pitches.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateEvent} className="space-y-3.5 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Event Title</label>
                <Input
                  placeholder="e.g., GitHub Actions & CI/CD Workshop"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Date</label>
                  <Input
                    placeholder="Aug 25, 2026"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Time</label>
                  <Input
                    placeholder="7:00 PM - 8:30 PM"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Speaker / Host</label>
                  <Input
                    placeholder="Batch 23 Lead"
                    value={speakerInput}
                    onChange={(e) => setSpeakerInput(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Event Type</label>
                  <select
                    value={typeInput}
                    onChange={(e) => setTypeInput(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Community Event">Community Event</option>
                    <option value="Pitch Session">Pitch Session</option>
                    <option value="Q&A Session">Q&A Session</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Live Link / Meeting URL (Optional)</label>
                <Input
                  placeholder="https://meet.google.com/..."
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Event
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by title or speaker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm font-medium">Loading events...</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex items-center justify-center p-8 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-border/60 bg-card text-center space-y-3">
          <Calendar className="h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-sm font-bold text-foreground">No community events scheduled</h3>
          <p className="text-xs text-muted-foreground">Click &quot;Schedule Event&quot; above to create a new session.</p>
        </div>
      )}

      {/* Events List */}
      {!loading && !error && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((event) => (
            <div key={event.id} className="rounded-xl border border-border/60 bg-card p-5 space-y-3 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded bg-accent px-2 py-0.5 text-[10px] font-mono font-medium text-accent-foreground mb-1">
                      {event.type}
                    </span>
                    <h3 className="text-base font-semibold text-foreground">{event.title}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => handleOpenEdit(event)}
                      title="Edit Event"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(event.id, event.title)}
                      title="Delete Event"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
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

              {event.link && (
                <div className="border-t border-border/40 pt-2 flex justify-end">
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <span>Join Session</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Event Dialog */}
      {editingEvent && (
        <Dialog open={Boolean(editingEvent)} onOpenChange={() => setEditingEvent(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>Update session title, timing, host, or meeting link.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Event Title</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Date</label>
                  <Input
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Time</label>
                  <Input
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Speaker / Host</label>
                  <Input
                    value={editSpeaker}
                    onChange={(e) => setEditSpeaker(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Event Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Community Event">Community Event</option>
                    <option value="Pitch Session">Pitch Session</option>
                    <option value="Q&A Session">Q&A Session</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Live Link / Meeting URL</label>
                <Input
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingEvent(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Event Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
