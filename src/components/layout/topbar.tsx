"use client";

import { Search, Bell, ChevronDown, User, LogOut } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutUser } from "@/features/auth/actions";

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

export function Topbar({ user }: { user: User }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-card px-6">
      <div className="relative flex-1 max-w-3xl mx-auto">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search for crops, farms, or records... (Ctrl+K)"
          className="w-full h-10 rounded-full bg-muted/40 border border-transparent pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring/50 transition-colors"
        />
      </div>

      <button
        type="button"
        className="relative h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
      </button>

      <div className="h-6 w-px bg-border" />

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-muted/50 rounded-full pl-1 pr-2 py-1 transition-colors">
          <Avatar className="h-7 w-7">
            {user.image && <AvatarImage src={user.image} alt={user.name ?? user.email} />}
            <AvatarFallback className="text-xs">{getInitials(user.name, user.email)}</AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            {user.name && <p className="text-xs font-medium">{user.name}</p>}
            <p className="text-[11px] text-muted-foreground">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <Link href="/dashboard/settings" className="w-full">
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <form action={signOutUser} className="w-full">
            <button type="submit" className="w-full">
              <DropdownMenuItem className="cursor-pointer text-red-600 hover:text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </button>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
