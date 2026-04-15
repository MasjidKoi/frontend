"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Info, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { masjidsApi } from "@/lib/api/masjids";
import { authApi } from "@/lib/api/auth";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(3, "Name required"),
  admin_region: z.string().min(2, "Region required"),
  address: z.string().min(5, "Address required"),
  timezone: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  admin_email: z.string().email("Valid email required").optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

export default function CreateMasjidPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { timezone: "Asia/Dhaka", latitude: 23.7259, longitude: 90.4068 },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const masjid = await masjidsApi.create({
        name: data.name,
        address: data.address,
        admin_region: data.admin_region,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
      });

      // Invite admin if email provided
      if (data.admin_email) {
        try {
          await authApi.inviteAdmin({ email: data.admin_email, role: "masjid_admin", masjid_id: masjid.masjid_id });
          toast.success("Masjid created and invite sent!");
        } catch {
          toast.success("Masjid created. Invite email failed — invite manually.");
        }
      } else {
        toast.success("Masjid created successfully!");
      }

      router.push("/admin/masjids");
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to create masjid");
    }
  };

  const Field = ({ id, label, error, required, children }: { id: string; label: string; error?: string; required?: boolean; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}{required && " *"}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Masjids
        </button>
        <h1 className="font-heading text-2xl font-bold text-foreground">Create Masjid Account</h1>
        <div className="w-36" />
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-border/30 p-8 flex flex-col gap-8">

        {/* Basic Info */}
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-semibold text-foreground">Basic Information</h2>
            <div className="h-px bg-border/50 mt-3" />
          </div>
          <div className="grid grid-cols-[1fr_220px] gap-5">
            <Field id="name" label="Masjid Name" error={errors.name?.message} required>
              <Input id="name" placeholder="Official masjid name" {...register("name")} className={errors.name ? "border-destructive" : ""} />
            </Field>
            <Field id="admin_region" label="Admin Region" error={errors.admin_region?.message} required>
              <Input id="admin_region" placeholder="e.g. Dhaka" {...register("admin_region")} className={errors.admin_region ? "border-destructive" : ""} />
            </Field>
          </div>
          <Field id="address" label="Full Address" error={errors.address?.message} required>
            <Input id="address" placeholder="Street address, area, city" {...register("address")} className={errors.address ? "border-destructive" : ""} />
          </Field>
          <div className="w-64">
            <Field id="timezone" label="Timezone">
              <select id="timezone" {...register("timezone")} className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30">
                <option value="Asia/Dhaka">Asia/Dhaka (UTC+6)</option>
                <option value="Asia/Karachi">Asia/Karachi (UTC+5)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
              </select>
            </Field>
          </div>
        </div>

        {/* GPS */}
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-semibold text-foreground">GPS Coordinates</h2>
            <div className="h-px bg-border/50 mt-3" />
          </div>
          <p className="text-sm text-muted-foreground -mt-2">Used for the nearby masjid search. Enter precise decimal coordinates.</p>
          <div className="grid grid-cols-2 gap-5">
            <Field id="latitude" label="Latitude" error={errors.latitude?.message} required>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="latitude" placeholder="23.7259" {...register("latitude")} className={`pl-9 font-mono ${errors.latitude ? "border-destructive" : ""}`} />
              </div>
            </Field>
            <Field id="longitude" label="Longitude" error={errors.longitude?.message} required>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="longitude" placeholder="90.4068" {...register("longitude")} className={`pl-9 font-mono ${errors.longitude ? "border-destructive" : ""}`} />
              </div>
            </Field>
          </div>
        </div>

        {/* Admin Invitation */}
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-semibold text-foreground">Admin Invitation</h2>
            <div className="h-px bg-border/50 mt-3" />
          </div>
          <Field id="admin_email" label="Masjid Admin Email" error={errors.admin_email?.message}>
            <Input id="admin_email" type="email" placeholder="imam@masjid.com" {...register("admin_email")} className={errors.admin_email ? "border-destructive" : ""} />
          </Field>
          <div className="flex items-start gap-2.5 bg-secondary/50 rounded-lg p-3.5">
            <Info className="h-4 w-4 text-accent mt-0.5 shrink-0" />
            <p className="text-sm text-secondary-foreground">An invite email will be sent via Brevo. The admin sets their password on first login.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="h-4 w-4" />
            {isSubmitting ? "Creating…" : "Create Masjid & Send Invite"}
          </Button>
        </div>
      </form>
    </div>
  );
}
