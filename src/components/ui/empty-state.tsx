import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** When true, render as a compact strip (for inside table bodies). */
  compact?: boolean;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 text-center",
        compact ? "px-6 py-10" : "px-6 py-16",
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "rounded-2xl border bg-card shadow-sm flex items-center justify-center mb-4",
            compact ? "h-12 w-12" : "h-14 w-14"
          )}
        >
          <Icon className={cn("text-muted-foreground", compact ? "h-5 w-5" : "h-6 w-6")} />
        </div>
      )}
      <p className={cn("font-semibold text-foreground", compact ? "text-small" : "text-h4 mb-1")}>
        {title}
      </p>
      {description && <p className="text-small text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
