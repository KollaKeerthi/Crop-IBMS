"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithGoogle, signInWithCredentials } from "@/features/auth/actions";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction, pending] = useActionState(signInWithCredentials, { error: null });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/dashboard"} />

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {state.error && (
          <div className="space-y-1.5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5">
            <p className="text-sm text-destructive">{state.error}</p>
            <p className="text-xs text-muted-foreground">
              Just signed up?{" "}
              <Link
                href="/verify-email"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Check your verification email
              </Link>
            </p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={signInWithGoogle.bind(null, callbackUrl)}>
        <Button type="submit" variant="outline" className="w-full">
          Continue with Google
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
