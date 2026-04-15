"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: FormData) => {
    try {
      await authApi.requestPasswordReset(email);
    } catch {
      // Swallow — always show success to prevent email enumeration
    }
    setSubmittedEmail(email);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="w-full flex items-center justify-center bg-background px-4 min-h-screen">
        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Check your email
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If <span className="font-medium text-foreground">{submittedEmail}</span> is
              registered, you&apos;ll receive a password reset link shortly.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive it? Check your spam folder or{" "}
            <button
              onClick={() => setSubmitted(false)}
              className="text-accent hover:underline"
            >
              try again
            </button>
            .
          </p>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center bg-background px-4 min-h-screen">
      <div className="w-full max-w-sm flex flex-col gap-8">
        {/* Back link */}
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-border/40 bg-card shadow-sm p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Mail className="h-6 w-6 text-secondary" />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-xl font-bold text-foreground">
                Forgot your password?
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enter your email and we&apos;ll send a reset link via Brevo.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@masjidkoi.com"
                autoComplete="email"
                autoFocus
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
