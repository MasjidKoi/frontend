"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { masjidsApi, type MasjidEvent, type EventAttendee } from "@/lib/api/masjids";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

function formatEventDate(date: string, time: string) {
  const d = new Date(`${date}T${time}`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function today() {
  return new Date().toISOString().split("T")[0];
}

const EMPTY_FORM = {
  title: "", description: "", event_date: today(), event_time: "18:00",
  location: "", capacity: "", rsvp_enabled: false,
};

export default function EventsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const mid = user?.masjidId ?? "";

  useEffect(() => {
    if (!authLoading && !mid) router.push("/login");
  }, [authLoading, mid, router]);

  const [events, setEvents] = useState<MasjidEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MasjidEvent | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<MasjidEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [attendeesEvent, setAttendeesEvent] = useState<MasjidEvent | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  const load = useCallback(async (p = page) => {
    if (!mid) return;
    setLoading(true);
    try {
      const data = await masjidsApi.listEvents(mid, { page: p, page_size: PAGE_SIZE });
      setEvents(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch { toast.error("Failed to load events"); }
    finally { setLoading(false); }
  }, [mid, page]);

  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (ev: MasjidEvent) => {
    setEditTarget(ev);
    setForm({
      title: ev.title,
      description: ev.description,
      event_date: ev.event_date,
      event_time: ev.event_time.slice(0, 5),
      location: ev.location,
      capacity: ev.capacity != null ? String(ev.capacity) : "",
      rsvp_enabled: ev.rsvp_enabled,
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      toast.error("Title, description, and location are required");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        event_date: form.event_date,
        event_time: form.event_time,
        location: form.location,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        rsvp_enabled: form.rsvp_enabled,
      };
      if (editTarget) {
        await masjidsApi.updateEvent(mid, editTarget.event_id, payload);
        toast.success("Event updated");
      } else {
        await masjidsApi.createEvent(mid, payload);
        toast.success("Event created");
      }
      setFormOpen(false);
      load(page);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await masjidsApi.deleteEvent(mid, deleteTarget.event_id);
      toast.success("Event deleted");
      setDeleteTarget(null);
      load(page);
    } catch { toast.error("Failed to delete event"); }
    finally { setDeleting(false); }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Events</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage upcoming events for your community</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="h-4 w-4" /> New Event
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-border/30 p-10 text-center">
          <p className="text-muted-foreground text-sm">No events yet</p>
          <button onClick={openCreate} className="text-accent text-sm hover:underline mt-1">Create the first one →</button>
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
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {ev.rsvp_enabled && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#D4EDDA] text-[#155724]">RSVP On</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>📍 {ev.location}</span>
                  {ev.rsvp_enabled && (
                    <span>{ev.rsvp_count} attending{ev.capacity ? ` / ${ev.capacity}` : ""}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {ev.rsvp_enabled && (
                    <button
                      onClick={() => openAttendees(ev)}
                      className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted text-foreground transition-colors flex items-center gap-1.5"
                    >
                      <Users className="h-3 w-3" /> Attendees
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(ev)}
                    className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(ev)}
                    className="text-xs px-3 py-1.5 rounded-md bg-[#FFEDED] text-[#C0392B] hover:bg-[#ffd9d9] transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
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

      {/* Create/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={open => { if (!submitting) setFormOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Event" : "New Event"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-1">
            <div className="flex flex-col gap-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="resize-none" placeholder="Event details..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Time *</Label>
                <Input type="time" value={form.event_time} onChange={e => setForm(f => ({ ...f, event_time: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Location *</Label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Room or address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Capacity (optional)</Label>
                <Input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="Unlimited" min={1} />
              </div>
              <div className="flex flex-col gap-1.5 justify-end pb-0.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rsvp-toggle" className="cursor-pointer">RSVP Enabled</Label>
                  <Switch id="rsvp-toggle" checked={form.rsvp_enabled} onCheckedChange={v => setForm(f => ({ ...f, rsvp_enabled: v }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-primary hover:bg-primary/90">
                {submitting ? "Saving…" : editTarget ? "Save Changes" : "Create Event"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>This event and all RSVP records will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-[#C0392B] hover:bg-[#a93226] text-white disabled:opacity-50">
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Attendees dialog */}
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
                  <span className="text-sm text-foreground font-mono text-xs">{i + 1}. {a.user_id.slice(0, 12)}…</span>
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
