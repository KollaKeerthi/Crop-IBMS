import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  /** Cap content width. Default `6xl`. */
  maxWidth?: "4xl" | "5xl" | "6xl" | "7xl" | "full";
  className?: string;
};

const MAX_W = {
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
};

// Canonical page container — wraps every dashboard page.
// Standardizes horizontal padding, vertical rhythm, max width,
// and vertical spacing between child blocks.
export function PageShell({ children, maxWidth = "6xl", className }: Props) {
  return (
    <div
      className={cn(
        "mx-auto w-full space-y-6 px-6 py-6 sm:px-8 sm:py-8",
        MAX_W[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}
