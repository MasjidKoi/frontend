"use client";

import { useEffect, useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShieldCheck, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth-store";
import type { TotpEnrollResponse } from "@/types/auth";

const CODE_LENGTH = 6;

export default function EnrollPage() {
  const router = useRouter();
  const { setTokens } = useAuthStore();
  const [enrollment, setEnrollment] = useState<TotpEnrollResponse | null>(null);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    authApi.enroll2fa().then((data) => {
      setEnrollment(data);
      sessionStorage.setItem("mkoi_factor_id", data.factor_id);
    }).catch(() => {
      toast.error("Failed to start 2FA enrollment — please try again");
    });
  }, []);

  const secretKey = enrollment?.totp_uri
    ? new URLSearchParams(enrollment.totp_uri.split("?")[1]).get("secret") ?? ""
    : "";

  const copySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index]) refs.current[index - 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    const next = [...digits];
    text.split("").forEach((c, i) => { next[i] = c; });
    setDigits(next);
    refs.current[Math.min(text.length, CODE_LENGTH - 1)]?.focus();
  };

  const handleActivate = async () => {
    const code = digits.join("");
    if (code.length !== CODE_LENGTH) { toast.error("Enter all 6 digits"); return; }

    const factorId = sessionStorage.getItem("mkoi_factor_id");
    if (!factorId) { toast.error("Session expired"); router.push("/login"); return; }

    setIsSubmitting(true);
    try {
      const tokens = await authApi.verify2fa({ factor_id: factorId, code });
      setTokens(tokens.access_token, tokens.refresh_token);
      sessionStorage.removeItem("mkoi_factor_id");
      toast.success("2FA activated successfully!");
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
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-lg border border-border/30">
        {/* Header */}
        <div className="bg-primary px-9 py-8 flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-secondary" />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="font-heading text-xl font-bold text-white">
              Set up Two-Factor Authentication
            </h1>
            <p className="text-sm text-secondary/80 leading-relaxed max-w-sm">
              Required for all platform admins. Protects your account with a second verification step.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="bg-card px-9 py-8 flex flex-col gap-7">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-white">1</span>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Scan this QR code with your authenticator app
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use Google Authenticator, Authy, or any TOTP app.
                </p>
              </div>

              <div className="flex gap-4 items-center">
                {enrollment?.qr_code ? (
                  <div className="h-28 w-28 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    <Image
                      src={`data:image/png;base64,${enrollment.qr_code}`}
                      alt="TOTP QR Code"
                      width={112}
                      height={112}
                    />
                  </div>
                ) : (
                  <div className="h-28 w-28 rounded-xl border border-border bg-muted animate-pulse shrink-0" />
                )}

                <div className="flex flex-col gap-2 min-w-0">
                  <p className="text-xs text-muted-foreground">Or enter this key manually:</p>
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 border border-border">
                    <span className="text-xs font-mono text-foreground tracking-wider truncate">
                      {secretKey || "Loading…"}
                    </span>
                    <button onClick={copySecret} className="shrink-0 text-muted-foreground hover:text-foreground">
                      {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-white">2</span>
            </div>
            <div className="flex flex-col gap-4 w-full">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Enter the 6-digit code to confirm setup
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the code shown in your authenticator app.
                </p>
              </div>

              <div className="flex gap-2">
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
                    className={`h-12 w-full rounded-xl border text-center text-lg font-bold font-mono bg-muted outline-none transition-colors
                      ${d ? "border-primary text-foreground" : "border-border text-muted-foreground"}
                      focus:border-primary focus:ring-2 focus:ring-primary/20`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleActivate}
              disabled={isSubmitting || digits.join("").length !== CODE_LENGTH}
              className="w-full bg-primary hover:bg-primary/90 gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              {isSubmitting ? "Activating…" : "Activate 2FA"}
            </Button>
            <button
              onClick={() => router.push("/login")}
              className="text-xs text-muted-foreground hover:text-foreground text-center transition-colors"
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
