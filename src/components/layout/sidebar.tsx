"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarRange,
  CheckSquare,
  Database,
  LayoutDashboard,
  Map,
  Settings,
  Sprout,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Farm = { id: string; name: string };
type User = { name: string | null; email: string; image: string | null };

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Crop Masters", href: "/dashboard/crop-information", icon: Sprout },
  { label: "Crop Planning", href: "/dashboard/crop-plan", icon: CalendarRange },
  { label: "Crop Programs", href: "/dashboard/crop-data", icon: Database },
  { label: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { label: "Map", href: "/dashboard/map", icon: Map },
];

export function Sidebar({
  farms: _farms,
  user: _user,
  isOwner: _isOwner = false,
}: {
  farms: Farm[];
  user: User;
  isOwner?: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-44 shrink-0 border-r border-[var(--erp-border)] bg-[var(--erp-sidebar)]">
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--erp-border)] px-3 py-4">
          <p className="truncate bg-gradient-to-r from-[var(--brand-secondary)] via-[#087c8f] to-primary bg-clip-text text-sm font-extrabold leading-tight text-transparent">
            iBMS-Crop
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex h-8 items-center gap-2 border border-transparent px-2 text-[0.72rem] font-medium leading-none text-[var(--erp-ink)] transition hover:border-[var(--erp-border)] hover:bg-[var(--erp-nav-active)]",
                  isActive &&
                    "border-[var(--erp-border)] bg-[var(--erp-nav-active)] font-semibold text-primary"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[var(--erp-border)] px-2 py-3">
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex h-8 items-center gap-2 border border-transparent px-2 text-[0.72rem] font-medium leading-none text-[var(--erp-ink)] transition hover:border-[var(--erp-border)] hover:bg-[var(--erp-nav-active)]",
              pathname.startsWith("/dashboard/settings") &&
                "border-[var(--erp-border)] bg-[var(--erp-nav-active)] font-semibold text-primary"
            )}
          >
            <Settings className="size-3.5 shrink-0" />
            <span className="truncate">Settings</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
