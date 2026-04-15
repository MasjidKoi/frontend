"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, KeyRound, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

type PageState = "loading" | "form" | "invalid";

function parseHashTokens(hash: string): { accessToken: string; refreshToken: string } | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

function InviteAcceptInner() {
  const router = useRouter();
  const [state, setState] = useState<PageState>("loading");
  const [tokens, setHashTokens] = useState<{ accessToken: string; refreshToken: string } | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const parsed = parseHashTokens(window.location.hash);
    if (!parsed) {
      setState("invalid");
      return;
    }
    setHashTokens(parsed);
    // Clean hash from URL (don't expose token in browser history)
    window.history.replaceState(null, "", window.location.pathname);
    setState("form");
  }, []);

  const onSubmit = async ({ password }: FormData) => {
    if (!tokens) return;

    try {
      await authApi.setPassword(password, tokens.accessToken);

      // Password set — redirect to login so user signs in with new credentials
      // TODO: re-enable TOTP enrollment redirect when 2FA is stable
      toast.success("Password set! Please log in.");
      router.push("/login");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Failed to set password — the invite link may have expired";
      toast.error(msg);
    }
  };

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="w-full flex items-center justify-center bg-background px-4 min-h-screen">
        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
          <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-xl font-bold text-foreground">
              Invalid invite link
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This link is missing required tokens. It may have already been used
              or has expired. Please ask the platform admin to send a new invite.
            </p>
          </div>
          <Link
            href="/login"
            className="text-sm text-accent hover:underline"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center bg-background px-4 min-h-screen">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-lg border border-border/30">
        {/* Header */}
        <div className="bg-primary px-9 py-8 flex flex-col items-center gap-3">
          <div className="h-13 w-13 rounded-2xl bg-accent flex items-center justify-center">
            <KeyRound className="h-6 w-6 text-secondary" />
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="font-heading text-xl font-bold text-white">Set your password</h1>
            <p className="text-sm text-secondary/80 leading-relaxed max-w-xs">
              You&apos;ve been invited as a platform admin. Set a password to activate your account.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card px-9 py-8">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                New password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  autoFocus
                  {...register("password")}
                  className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  className={`pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Activating account…" : "Set password & continue →"}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Suspense wrapper required for client-side hook usage in Next.js static export
import { Suspense } from "react";

export default function InviteAcceptPage() {
  return (
    <Suspense>
      <InviteAcceptInner />
    </Suspense>
  );
}
