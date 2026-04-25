"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, Star, ChevronUp, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { masjidsApi, type MasjidPhoto } from "@/lib/api/masjids";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

export default function PhotosPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const mid = user?.masjidId ?? "";

  useEffect(() => {
    if (!authLoading && !mid) router.push("/login");
  }, [authLoading, mid, router]);

  const [photos, setPhotos] = useState<MasjidPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MasjidPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!mid) return;
    setLoading(true);
    try {
      const m = await masjidsApi.byId(mid);
      const sorted = [...(m.photos ?? [])].sort((a: MasjidPhoto, b: MasjidPhoto) => a.display_order - b.display_order);
      setPhotos(sorted);
    } catch { toast.error("Failed to load photos"); }
    finally { setLoading(false); }
  }, [mid]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5 MB"); return; }
    setUploading(true);
    try {
      await masjidsApi.uploadPhoto(mid, file);
      toast.success("Photo uploaded");
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await masjidsApi.deletePhoto(mid, deleteTarget.photo_id);
      toast.success("Photo deleted");
      setDeleteTarget(null);
      load();
    } catch { toast.error("Failed to delete photo"); }
    finally { setDeleting(false); }
  };

  const handleSetCover = async (photo: MasjidPhoto) => {
    try {
      const updated = await masjidsApi.setCoverPhoto(mid, photo.photo_id);
      const sorted = [...updated].sort((a, b) => a.display_order - b.display_order);
      setPhotos(sorted);
      toast.success("Cover photo updated");
    } catch { toast.error("Failed to set cover"); }
  };

  const move = async (index: number, direction: "up" | "down") => {
    const newPhotos = [...photos];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newPhotos.length) return;
    [newPhotos[index], newPhotos[swapIdx]] = [newPhotos[swapIdx], newPhotos[index]];
    setPhotos(newPhotos);
    try {
      const updated = await masjidsApi.reorderPhotos(mid, newPhotos.map(p => p.photo_id));
      const sorted = [...updated].sort((a, b) => a.display_order - b.display_order);
      setPhotos(sorted);
    } catch {
      toast.error("Failed to reorder");
      load();
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Photos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your masjid&apos;s photo gallery</p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload Photo"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-video rounded-xl" />)}
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-white rounded-xl border border-border/30 p-16 text-center">
          <p className="text-muted-foreground text-sm">No photos uploaded yet</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-accent text-sm hover:underline mt-1"
          >
            Upload the first photo →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={photo.photo_id} className="group relative rounded-xl overflow-hidden border border-border/30 shadow-sm bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`Masjid photo ${index + 1}`}
                className="w-full aspect-video object-cover"
              />

              {photo.is_cover && (
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-medium px-2 py-0.5 rounded-full">
                  <Star className="h-3 w-3 fill-current" /> Cover
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!photo.is_cover && (
                  <button
                    onClick={() => handleSetCover(photo)}
                    aria-label="Set as cover photo"
                    className="text-xs px-2.5 py-1.5 rounded-md bg-amber-400 text-amber-900 font-medium hover:bg-amber-300 transition-colors flex items-center gap-1"
                  >
                    <Star className="h-3 w-3" /> Cover
                  </button>
                )}
                <button
                  onClick={() => setDeleteTarget(photo)}
                  aria-label="Delete photo"
                  className="text-xs px-2 py-1.5 rounded-md bg-[#C0392B] text-white hover:bg-[#a93226] transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  disabled={index === 0}
                  onClick={() => move(index, "up")}
                  aria-label="Move photo up"
                  className="p-1 rounded bg-white/80 hover:bg-white text-foreground disabled:opacity-30 transition-colors"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  disabled={index === photos.length - 1}
                  onClick={() => move(index, "down")}
                  aria-label="Move photo down"
                  className="p-1 rounded bg-white/80 hover:bg-white text-foreground disabled:opacity-30 transition-colors"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="px-3 py-2 flex items-center justify-between bg-white border-t border-border/20">
                <span className="text-xs text-muted-foreground">#{index + 1}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(photo.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Upload JPEG, PNG, or WebP — max 5 MB per photo. Hover over a photo to reorder, set cover, or delete.
      </p>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
            <AlertDialogDescription>
              The photo will be permanently removed from your gallery and storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-[#C0392B] hover:bg-[#a93226] text-white disabled:opacity-50">
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
