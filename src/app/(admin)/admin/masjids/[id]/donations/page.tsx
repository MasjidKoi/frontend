"use client";

import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { DonationsView } from "@/components/donations/donations-view";

export default function AdminMasjidDonationsPage() {
  const { id: mid } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const canManage = user?.role === "platform_admin";

  return (
    <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Donations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Donations, balance, and payouts for this masjid
        </p>
      </div>

      <DonationsView mid={mid} canManage={canManage} />
    </div>
  );
}
