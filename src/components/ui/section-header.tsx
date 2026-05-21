import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  count?: number | null;
  countUnit?: string;
  action?: ReactNode;
  children?: ReactNode;
};

export function SectionHeader({
  title,
  description,
  count,
  countUnit = "items",
  action,
  children,
}: Props) {
  const showCount = count != null;
  const unit =
    countUnit && count === 1 && countUnit.endsWith("s") ? countUnit.slice(0, -1) : countUnit;

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-h4 font-bold text-foreground">{title}</h2>
            {showCount && (
              <span className="text-caption font-bold uppercase tracking-wider rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">
                {count} {unit}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-small text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className="w-full">{children}</div>}
    </div>
  );
}
