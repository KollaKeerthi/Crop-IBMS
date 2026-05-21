import { cn } from "@/lib/utils";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

/** Inline brand-colored spinner. */
export function Spinner({ size = "md", className }: Props) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block rounded-full border-primary border-t-transparent animate-spin",
        SIZES[size],
        className
      )}
    />
  );
}

/**
 * Full-area centered loader. Fills the parent (use as `loading.tsx` body
 * or anywhere a section is waiting on data).
 */
export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex h-full w-full flex-1 items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Spinner size="lg" />
        <p className="text-small font-medium">{label}</p>
      </div>
    </div>
  );
}

/** Inline row-style loader for tables/lists. */
export function RowLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-12 text-muted-foreground">
      <Spinner size="sm" />
      <p className="text-small">{label}</p>
    </div>
  );
}
