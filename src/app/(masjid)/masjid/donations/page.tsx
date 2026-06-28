"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { DonationsView } from "@/components/donations/donations-view";

export default function MasjidDonationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const mid = user?.masjidId ?? "";

  useEffect(() => {
    if (!authLoading && !mid) router.push("/login");
  }, [authLoading, mid, router]);

  return (
    <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Donations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Donations received and your masjid&apos;s balance
        </p>
      </div>

      {mid && <DonationsView mid={mid} />}
    </div>
  );
}
