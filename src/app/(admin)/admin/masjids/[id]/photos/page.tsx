"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { masjidsApi, type MasjidPhoto } from "@/lib/api/masjids";
import { toast } from "sonner";

export default function AdminMasjidPhotosPage() {
  const { id: mid } = useParams<{ id: string }>();
  const [photos, setPhotos] = useState<MasjidPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const m = await masjidsApi.byId(mid);
      const sorted = [...(m.photos ?? [])].sort((a: MasjidPhoto, b: MasjidPhoto) => a.display_order - b.display_order);
      setPhotos(sorted);
    } catch { toast.error("Failed to load photos"); }
    finally { setLoading(false); }
  }, [mid]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-8 flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Photos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{photos.length} photo{photos.length !== 1 ? "s" : ""}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-white rounded-xl border border-border/30 p-10 text-center">
          <p className="text-muted-foreground text-sm">No photos uploaded</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {photos.map(p => (
            <div key={p.photo_id} className="relative group rounded-xl overflow-hidden border border-border/30 shadow-sm aspect-square bg-muted">
              <img src={p.url} alt="Masjid photo" className="w-full h-full object-cover" />
              {p.is_cover && (
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary/90 text-white text-xs px-2 py-1 rounded-full">
                  <Star className="h-3 w-3 fill-white" /> Cover
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
