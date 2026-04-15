"use client";

import { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth-store";

const CODE_LENGTH = 6;

export default function TwoFactorPage() {
  const router = useRouter();
  const { setTokens } = useAuthStore();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const focusNext = (index: number) => refs.current[index + 1]?.focus();
  const focusPrev = (index: number) => refs.current[index - 1]?.focus();

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value) focusNext(index);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index]) focusPrev(index);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    const next = [...digits];
    text.split("").forEach((c, i) => { next[i] = c; });
    setDigits(next);
    refs.current[Math.min(text.length, CODE_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async () => {
    const code = digits.join("");
    if (code.length !== CODE_LENGTH) {
      toast.error("Enter all 6 digits");
      return;
    }

    const factorId = sessionStorage.getItem("mkoi_factor_id");
    if (!factorId) {
      toast.error("Session expired — please log in again");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const tokens = await authApi.verify2fa({ factor_id: factorId, code });
      setTokens(tokens.access_token, tokens.refresh_token);
      sessionStorage.removeItem("mkoi_factor_id");
      router.push("/admin");
    } catch {
      toast.error("Invalid code — try again");
      setDigits(Array(CODE_LENGTH).fill(""));
      refs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center bg-background px-4 min-h-screen">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-lg border border-border/30">
        {/* Header */}
        <div className="bg-primary px-9 py-8 flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-secondary" />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="font-heading text-xl font-bold text-white">
              Two-Factor Authentication
            </h1>
            <p className="text-sm text-secondary/80 leading-relaxed max-w-xs">
              Enter the 6-digit code from your authenticator app to complete sign in.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="bg-card px-9 py-8 flex flex-col gap-7">
          {/* OTP inputs */}
          <div className="flex gap-2 justify-center">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className={`h-14 w-12 rounded-xl border text-center text-xl font-bold font-mono bg-muted outline-none transition-colors
                  ${d ? "border-primary text-foreground" : "border-border text-muted-foreground"}
                  focus:border-primary focus:ring-2 focus:ring-primary/20`}
              />
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || digits.join("").length !== CODE_LENGTH}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? "Verifying…" : "Verify & Sign in"}
          </Button>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Code refreshes every 30 seconds</span>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
