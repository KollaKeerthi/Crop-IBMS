"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client";

export function VerifyEmailClient({ email }: { email?: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  async function resend(addr: string) {
    setSending(true);
    try {
      await apiFetch("/api/v1/auth/resend-verification", {
        method: "POST",
        body: { email: addr },
      });
      setSent(true);
      toast.success("Verification email sent! Check your inbox.");
    } catch {
      toast.error("Failed to resend. Please try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        New verification email sent — check your inbox (and spam folder).
      </p>
    );
  }

  if (email) {
    return (
      <Button variant="outline" size="sm" onClick={() => resend(email)} disabled={sending}>
        {sending ? "Sending…" : "Resend verification email"}
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = emailInput.trim();
        if (!trimmed) {
          toast.error("Please enter your email address.");
          return;
        }
        void resend(trimmed);
      }}
      className="space-y-2"
    >
      <Input
        type="email"
        placeholder="you@example.com"
        value={emailInput}
        onChange={(e) => setEmailInput(e.target.value)}
        autoComplete="email"
        required
      />
      <Button type="submit" variant="outline" size="sm" disabled={sending} className="w-full">
        {sending ? "Sending…" : "Send new verification email"}
      </Button>
    </form>
  );
}
