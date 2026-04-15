"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth-store";
import { getRedirectPath } from "@/lib/auth/jwt";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const tokens = await authApi.login(data);
      setTokens(tokens.access_token, tokens.refresh_token);

      const user = useAuthStore.getState().user!;
      const redirectTo = searchParams.get("redirectTo");

      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      // Platform admins need 2FA — check if TOTP is enrolled first
      if (user.role === "platform_admin" && user.aal === "aal1") {
        const factors = await authApi.listFactors();
        const verified = factors.filter((f) => f.status === "verified");

        if (verified.length === 0) {
          // No enrolled factor — go to enrollment
          router.push("/login/enroll");
        } else {
          // Has a factor — store the first verified one, go to verify
          sessionStorage.setItem("mkoi_factor_id", verified[0].id);
          router.push("/login/2fa");
        }
        return;
      }

      router.push(getRedirectPath(user.role, user.aal));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Invalid email or password";
      toast.error(msg);
    }
  };

  return (
    <div className="w-full min-h-screen flex">
      {/* Left panel — dark green */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-primary text-primary-foreground p-14">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white text-xl font-bold">
            م
          </div>
          <span className="font-heading text-lg font-bold">MasjidKoi</span>
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="font-heading text-3xl font-bold leading-tight text-white max-w-xs">
            &ldquo;Connecting worshippers with their nearest masjid&rdquo;
          </h2>
          <p className="text-secondary/80 text-sm leading-relaxed max-w-xs">
            The platform for Muslim communities across Bangladesh.
          </p>
        </div>

        <div className="flex gap-10">
          {[
            { num: "300K+", label: "Masjids" },
            { num: "5", label: "Daily Prayers" },
            { num: "8", label: "Divisions" },
          ].map(({ num, label }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="font-heading font-bold text-xl text-white font-mono">{num}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your admin account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@masjidkoi.com"
                autoComplete="email"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link
                  href="/password/forgot"
                  className="text-xs text-accent hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  {...register("password")}
                  className={errors.password ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            Super admins will be prompted for 2FA after login.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
