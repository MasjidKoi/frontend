"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { masjidsApi, type MasjidReview } from "@/lib/api/masjids";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

const PAGE_SIZE = 20;

export default function ReviewsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const mid = user?.masjidId ?? "";

  useEffect(() => {
    if (!authLoading && !mid) router.push("/login");
  }, [authLoading, mid, router]);

  const [reviews, setReviews] = useState<MasjidReview[]>([]);
  const [total, setTotal] = useState(0);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<MasjidReview | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async (p = page) => {
    if (!mid) return;
    setLoading(true);
    try {
      const data = await masjidsApi.listReviews(mid, { page: p, page_size: PAGE_SIZE });
      setReviews(data.items ?? []);
      setTotal(data.total ?? 0);
      setAvgRating(data.average_rating ?? null);
    } catch { toast.error("Failed to load reviews"); }
    finally { setLoading(false); }
  }, [mid, page]);

  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setRemoving(true);
    try {
      await masjidsApi.deleteReview(mid, deleteTarget.review_id);
      toast.success("Review removed");
      setDeleteTarget(null);
      load(page);
    } catch { toast.error("Failed to remove review"); }
    finally { setRemoving(false); }
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Reviews</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Community ratings and feedback</p>
        </div>
        {avgRating != null && (
          <div className="flex items-center gap-2 bg-white border border-border/30 rounded-lg px-4 py-2 shadow-sm">
            <StarRating rating={Math.round(avgRating)} />
            <span className="text-sm font-semibold text-foreground">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({total} reviews)</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-border/30 p-10 text-center">
          <p className="text-muted-foreground text-sm">No reviews yet</p>
          <p className="text-xs text-muted-foreground mt-1">Reviews appear here after app users submit them</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map(r => (
            <div key={r.review_id} className="bg-white rounded-xl shadow-sm border border-border/30 p-5 flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <StarRating rating={r.rating} />
                  <span className="text-xs font-medium text-foreground">{r.reviewer_display_name ?? "Anonymous"}</span>
                </div>
                {r.body && <p className="text-sm text-muted-foreground">{r.body}</p>}
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => setDeleteTarget(r)}
                aria-label="Remove review"
                className="text-xs px-2 py-1.5 rounded-md border border-border bg-white hover:bg-[#FFEDED] hover:text-[#C0392B] hover:border-[#C0392B]/30 text-muted-foreground transition-colors shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{total} total reviews</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">← Previous</button>
            <span className="text-xs px-3 py-1.5 text-muted-foreground">Page {page}</span>
            <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this review?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the review by <strong>{deleteTarget?.reviewer_display_name ?? "this user"}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={removing} className="bg-[#C0392B] hover:bg-[#a93226] text-white disabled:opacity-50">
              {removing ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
