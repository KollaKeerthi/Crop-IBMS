"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/settings/account", label: "Account" },
  { href: "/dashboard/settings/security", label: "Security" },
  { href: "/dashboard/settings/integrations", label: "Integrations" },
] as const;

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Settings</p>
        <h1 className="text-3xl font-semibold">Account & Organization</h1>
      </div>
      <nav className="flex gap-1 border-b">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <div>{children}</div>
    </div>
  );
}
