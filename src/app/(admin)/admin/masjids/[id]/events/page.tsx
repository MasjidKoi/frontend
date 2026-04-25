"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { masjidsApi, type MasjidEvent, type EventAttendee } from "@/lib/api/masjids";
import { toast } from "sonner";

const PAGE_SIZE = 20;

function formatEventDate(date: string, time: string) {
  const d = new Date(`${date}T${time}`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function AdminMasjidEventsPage() {
  const { id: mid } = useParams<{ id: string }>();
  const [events, setEvents] = useState<MasjidEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [attendeesEvent, setAttendeesEvent] = useState<MasjidEvent | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const data = await masjidsApi.listEvents(mid, { page: p, page_size: PAGE_SIZE });
      setEvents(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch { toast.error("Failed to load events"); }
    finally { setLoading(false); }
  }, [mid, page]);

  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAttendees = async (ev: MasjidEvent) => {
    setAttendeesEvent(ev);
    setAttendeesLoading(true);
    try {
      const data = await masjidsApi.listAttendees(mid, ev.event_id, { page_size: 100 });
      setAttendees(data.items ?? []);
    } catch { toast.error("Failed to load attendees"); }
    finally { setAttendeesLoading(false); }
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Events</h1>
        <p className="text-sm text-muted-foreground mt-0.5">All events for this masjid</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-border/30 p-10 text-center">
          <p className="text-muted-foreground text-sm">No events</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map(ev => (
            <div key={ev.event_id} className="bg-white rounded-xl shadow-sm border border-border/30 p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-base">{ev.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatEventDate(ev.event_date, ev.event_time)}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ev.description}</p>
                </div>
                {ev.rsvp_enabled && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#D4EDDA] text-[#155724] shrink-0">RSVP On</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>📍 {ev.location}</span>
                  {ev.rsvp_enabled && <span>{ev.rsvp_count} attending{ev.capacity ? ` / ${ev.capacity}` : ""}</span>}
                </div>
                {ev.rsvp_enabled && (
                  <button
                    onClick={() => openAttendees(ev)}
                    className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <Users className="h-3 w-3" /> Attendees
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{total} total events</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">← Previous</button>
            <span className="text-xs px-3 py-1.5 text-muted-foreground">Page {page}</span>
            <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
          </div>
        </div>
      )}

      <Dialog open={!!attendeesEvent} onOpenChange={open => !open && setAttendeesEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Attendees — {attendeesEvent?.title}</DialogTitle>
            <DialogDescription>{attendees.length} confirmed</DialogDescription>
          </DialogHeader>
          {attendeesLoading ? (
            <div className="flex flex-col gap-2 mt-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : attendees.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-2">No RSVPs yet</p>
          ) : (
            <div className="flex flex-col gap-1 mt-2 max-h-60 overflow-y-auto">
              {attendees.map((a, i) => (
                <div key={a.user_id} className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
                  <span className="text-xs font-mono text-foreground">{i + 1}. {a.user_id.slice(0, 12)}…</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.rsvp_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
