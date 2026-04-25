"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { announcementsApi } from "@/lib/api/announcements";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

interface Announcement {
  announcement_id: string;
  title: string;
  body: string;
  is_published: boolean;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  posted_by_email: string | null;
}

type PublishMode = "draft" | "now" | "schedule";

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatScheduled(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const id = user?.masjidId ?? "";

  useEffect(() => {
    if (!authLoading && !user?.masjidId) router.push("/login");
  }, [authLoading, user?.masjidId, router]);

  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Announcement | null>(null);
  const [deleteItem, setDeleteItem] = useState<Announcement | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [publishMode, setPublishMode] = useState<PublishMode>("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await announcementsApi.listAdmin(id, { page_size: 100 });
      setItems(data.items ?? []);
    } catch {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditItem(null);
    setFormTitle("");
    setFormBody("");
    setPublishMode("draft");
    setScheduledAt("");
    setFormOpen(true);
  };

  const openEdit = (ann: Announcement) => {
    setEditItem(ann);
    setFormTitle(ann.title);
    setFormBody(ann.body);
    setPublishMode("draft");
    setScheduledAt("");
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formBody.trim()) { toast.error("Title and body are required"); return; }
    if (publishMode === "schedule" && !scheduledAt) { toast.error("Please pick a date and time"); return; }
    setSubmitting(true);
    try {
      if (editItem) {
        await announcementsApi.update(id, editItem.announcement_id, { title: formTitle, body: formBody });
        toast.success("Announcement updated");
      } else {
        const payload = {
          title: formTitle,
          body: formBody,
          publish: publishMode === "now",
          scheduled_at: publishMode === "schedule" && scheduledAt
            ? new Date(scheduledAt).toISOString()
            : null,
        };
        await announcementsApi.create(id, payload);
        toast.success(publishMode === "now" ? "Published!" : publishMode === "schedule" ? "Scheduled!" : "Draft saved");
      }
      setFormOpen(false);
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (ann: Announcement) => {
    setPublishing(ann.announcement_id);
    try {
      await announcementsApi.publish(id, ann.announcement_id);
      toast.success("Published!");
      load();
    } catch { toast.error("Failed to publish"); }
    finally { setPublishing(null); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await announcementsApi.delete(id, deleteItem.announcement_id);
      toast.success("Deleted");
      setDeleteItem(null);
      load();
    } catch { toast.error("Failed to delete"); }
  };

  const submitLabel = () => {
    if (submitting) return "Saving…";
    if (editItem) return "Save Changes";
    if (publishMode === "now") return "Publish";
    if (publishMode === "schedule") return "Schedule";
    return "Save Draft";
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Post updates and events for your community</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="h-4 w-4" /> New Announcement
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-border/30 p-10 text-center">
          <p className="text-muted-foreground text-sm">No announcements yet</p>
          <button onClick={openCreate} className="text-accent text-sm hover:underline mt-1">Create the first one →</button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map(ann => {
            const isOverdue = ann.scheduled_at && new Date(ann.scheduled_at) <= new Date();
            return (
              <div key={ann.announcement_id} className="bg-white rounded-xl shadow-sm border border-border/30 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-base">{ann.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ann.body}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      ann.is_published ? "bg-[#D4EDDA] text-[#155724]" : "bg-[#FFF3CD] text-[#7a5500]"
                    }`}>
                      {ann.is_published ? "Published" : "Draft"}
                    </span>
                    {!ann.is_published && ann.scheduled_at && (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        isOverdue ? "bg-[#FFEDED] text-[#C0392B]" : "bg-[#FFF3CD] text-[#7a5500]"
                      }`}>
                        Auto-publish: {formatScheduled(ann.scheduled_at)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {ann.is_published && ann.published_at
                      ? `Published ${timeAgo(ann.published_at)}`
                      : `Created ${timeAgo(ann.created_at)} · Not published`}
                  </p>
                  <div className="flex gap-2">
                    {!ann.is_published && !ann.scheduled_at && (
                      <button
                        onClick={() => handlePublish(ann)}
                        disabled={publishing === ann.announcement_id}
                        className="text-xs px-3 py-1.5 rounded-md bg-secondary text-primary font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {publishing === ann.announcement_id ? "Publishing…" : "Publish"}
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(ann)}
                      className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted text-foreground transition-colors flex items-center gap-1.5"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteItem(ann)}
                      className="text-xs px-3 py-1.5 rounded-md bg-[#FFEDED] text-[#C0392B] hover:bg-[#ffd9d9] transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={open => { if (!submitting) setFormOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Announcement" : "New Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label>Title *</Label>
              <Input
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="Announcement title"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Body *</Label>
              <Textarea
                value={formBody}
                onChange={e => setFormBody(e.target.value)}
                placeholder="Write your announcement..."
                rows={4}
                className="resize-none"
              />
            </div>
            {!editItem && (
              <div className="flex flex-col gap-2">
                <Label>When to publish</Label>
                <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
                  {(["draft", "now", "schedule"] as PublishMode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setPublishMode(m)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                        publishMode === m
                          ? "bg-white shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m === "now" ? "Publish Now" : m === "schedule" ? "Schedule" : "Draft"}
                    </button>
                  ))}
                </div>
                {publishMode === "schedule" && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="schedule-dt">Date &amp; time *</Label>
                    <Input
                      id="schedule-dt"
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={e => setScheduledAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-3 justify-end pt-1">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-primary hover:bg-primary/90"
              >
                {submitLabel()}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={open => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteItem?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This announcement will be permanently deleted and removed from the public feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-[#C0392B] hover:bg-[#a93226] text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
