"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { announcementsApi } from "@/lib/api/announcements";
import { masjidsApi } from "@/lib/api/masjids";
import { toast } from "sonner";

interface AnnouncementWithMasjid {
  announcement_id: string;
  masjid_id: string;
  masjid_name: string;
  title: string;
  body: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  posted_by_email: string | null;
}

interface MasjidOption { masjid_id: string; name: string; }

const PAGE_SIZE = 20;

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PlatformAnnouncementsPage() {
  const [items, setItems] = useState<AnnouncementWithMasjid[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Form state (shared create/edit dialog)
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<AnnouncementWithMasjid | null>(null);
  const [formMasjidId, setFormMasjidId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formPublish, setFormPublish] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Masjid options for the create dropdown
  const [masjids, setMasjids] = useState<MasjidOption[]>([]);
  const [masjidsLoading, setMasjidsLoading] = useState(false);

  const [deleteItem, setDeleteItem] = useState<AnnouncementWithMasjid | null>(null);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const data = await announcementsApi.listPlatform({ page: p, page_size: PAGE_SIZE });
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMasjids = useCallback(async () => {
    if (masjids.length > 0) return; // already loaded
    setMasjidsLoading(true);
    try {
      const data = await masjidsApi.list({ page_size: 100 });
      setMasjids(data.items ?? []);
    } catch {
      toast.error("Failed to load masjids");
    } finally {
      setMasjidsLoading(false);
    }
  }, [masjids.length]);

  const openCreate = async () => {
    setEditItem(null);
    setFormTitle("");
    setFormBody("");
    setFormPublish(false);
    setFormMasjidId("");
    setFormOpen(true);
    await loadMasjids();
  };

  const openEdit = (ann: AnnouncementWithMasjid) => {
    setEditItem(ann);
    setFormMasjidId(ann.masjid_id);
    setFormTitle(ann.title);
    setFormBody(ann.body);
    setFormPublish(ann.is_published);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formBody.trim()) { toast.error("Title and body are required"); return; }
    if (!editItem && !formMasjidId) { toast.error("Please select a masjid"); return; }
    setSubmitting(true);
    try {
      if (editItem) {
        await announcementsApi.update(editItem.masjid_id, editItem.announcement_id, { title: formTitle, body: formBody });
        toast.success("Announcement updated");
      } else {
        await announcementsApi.create(formMasjidId, { title: formTitle, body: formBody, publish: formPublish });
        toast.success(formPublish ? "Published!" : "Draft saved");
      }
      setFormOpen(false);
      load(page);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (ann: AnnouncementWithMasjid) => {
    try {
      await announcementsApi.publish(ann.masjid_id, ann.announcement_id);
      toast.success("Published!");
      load(page);
    } catch { toast.error("Failed to publish"); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await announcementsApi.delete(deleteItem.masjid_id, deleteItem.announcement_id);
      toast.success("Deleted");
      setDeleteItem(null);
      load(page);
    } catch { toast.error("Failed to delete"); }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All announcements across all masjids</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="h-4 w-4" /> New Announcement
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-border/30 p-10 text-center">
          <p className="text-muted-foreground text-sm">No announcements yet</p>
          <button onClick={openCreate} className="text-accent text-sm hover:underline mt-1">Create the first one →</button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map(ann => (
            <div key={ann.announcement_id} className="bg-white rounded-xl shadow-sm border border-border/30 p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-medium bg-accent/10 text-accent rounded-full px-2.5 py-0.5 shrink-0">
                      {ann.masjid_name}
                    </span>
                    {ann.posted_by_email && (
                      <span className="text-xs text-muted-foreground">{ann.posted_by_email}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground text-base">{ann.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ann.body}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                  ann.is_published ? "bg-[#D4EDDA] text-[#155724]" : "bg-[#FFF3CD] text-[#856404]"
                }`}>
                  {ann.is_published ? "Published" : "Draft"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {ann.is_published && ann.published_at
                    ? `Published ${timeAgo(ann.published_at)}`
                    : `Created ${timeAgo(ann.created_at)} · Not published`}
                </p>
                <div className="flex gap-2">
                  {!ann.is_published && (
                    <button
                      onClick={() => handlePublish(ann)}
                      className="text-xs px-3 py-1.5 rounded-md bg-secondary text-primary font-medium hover:bg-secondary/80 transition-colors"
                    >
                      Publish
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
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">{total} total</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              Previous
            </Button>
            <span className="flex items-center text-sm text-muted-foreground px-2">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Announcement" : "New Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            {/* Masjid selector — only for create */}
            {!editItem && (
              <div className="flex flex-col gap-1.5">
                <Label>Masjid *</Label>
                <select
                  value={formMasjidId}
                  onChange={e => setFormMasjidId(e.target.value)}
                  disabled={masjidsLoading}
                  className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none disabled:opacity-60"
                >
                  <option value="">{masjidsLoading ? "Loading…" : "Select a masjid"}</option>
                  {masjids.map(m => (
                    <option key={m.masjid_id} value={m.masjid_id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label>Title *</Label>
              <Input
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="Announcement title"
                autoFocus={!!editItem}
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
              <div className="flex items-center justify-between">
                <Label htmlFor="pub-toggle" className="cursor-pointer">Publish immediately</Label>
                <Switch id="pub-toggle" checked={formPublish} onCheckedChange={setFormPublish} />
              </div>
            )}
            <div className="flex gap-3 justify-end pt-1">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-primary hover:bg-primary/90">
                {submitting ? "Saving…" : editItem ? "Save Changes" : formPublish ? "Publish" : "Save Draft"}
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
