"use client";

import { Bell, ChevronDown, CircleHelp, LogOut, MapPin, Search, User } from "lucide-react";
import Link from "next/link";
import { useFarm } from "@/lib/farm-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutUser } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

type Farm = { id: string; name: string };
type User = { name: string | null; email: string; image: string | null };

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }
  return email[0]?.toUpperCase() ?? "U";
}

export function Topbar({ user, farms }: { user: User; farms: Farm[] }) {
  const { selectedFarmId, setSelectedFarmId } = useFarm();
  const selectedFarm = farms.find((farm) => farm.id === selectedFarmId) ?? farms[0] ?? null;
  const farmName = selectedFarm?.name ?? "Green Valley Farm";

  return (
    <header className="flex h-12 shrink-0 items-center border-b border-[var(--erp-border)] bg-[var(--erp-topbar)] px-3">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-8 min-w-40 items-center gap-2 border border-[var(--erp-border-strong)] bg-[var(--erp-farm-button)] px-2 text-[0.72rem] font-semibold text-[var(--erp-ink)] transition hover:bg-[var(--erp-nav-active)]">
            <MapPin className="size-3.5 text-primary" />
            <span className="max-w-32 truncate">{farmName}</span>
            <ChevronDown className="ml-auto size-3 text-[var(--erp-muted)]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 rounded-sm border-[var(--erp-border)] p-1"
          >
            {farms.map((farm) => (
              <DropdownMenuItem
                key={farm.id}
                onClick={() => setSelectedFarmId(farm.id)}
                className={cn(
                  "cursor-pointer rounded-sm text-xs",
                  farm.id === selectedFarmId && "bg-[var(--erp-nav-active)] font-semibold"
                )}
              >
                {farm.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label="Search"
          className="flex size-7 items-center justify-center text-[var(--erp-icon)] transition hover:bg-[var(--erp-nav-active)] hover:text-[var(--erp-ink)]"
        >
          <Search className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="flex size-7 items-center justify-center text-[var(--erp-icon)] transition hover:bg-[var(--erp-nav-active)] hover:text-[var(--erp-ink)]"
        >
          <Bell className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Help"
          className="flex size-7 items-center justify-center text-[var(--erp-icon)] transition hover:bg-[var(--erp-nav-active)] hover:text-[var(--erp-ink)]"
        >
          <CircleHelp className="size-3.5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 flex size-8 items-center justify-center">
            <Avatar className="size-7">
              {user.image && <AvatarImage src={user.image} alt={user.name ?? user.email} />}
              <AvatarFallback className="bg-primary text-[0.65rem] font-semibold text-primary-foreground">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="mt-1 w-56 rounded-sm border border-[var(--erp-border)] p-1"
          >
            <div className="px-2 py-2">
              {user.name && (
                <p className="text-xs font-semibold text-[var(--erp-ink)]">{user.name}</p>
              )}
              <p className="mt-1 truncate text-[0.68rem] text-[var(--erp-muted)]">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <Link href="/dashboard/settings" className="w-full">
              <DropdownMenuItem className="cursor-pointer rounded-sm py-2 text-xs">
                <User className="mr-2 size-3.5 text-[var(--erp-muted)]" />
                View Profile
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <form action={signOutUser} className="w-full">
              <button type="submit" className="w-full">
                <DropdownMenuItem className="cursor-pointer rounded-sm py-2 text-xs text-destructive hover:text-destructive focus:text-destructive">
                  <LogOut className="mr-2 size-3.5 text-destructive" />
                  Sign Out
                </DropdownMenuItem>
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
