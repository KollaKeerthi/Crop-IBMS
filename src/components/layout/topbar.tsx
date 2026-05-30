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
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border/40 bg-card px-6 relative z-20 shadow-2xs">
      <div className="relative flex-1 max-w-2xl mx-auto group">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/75 group-focus-within:text-primary transition-colors duration-200" />
        <input
          type="search"
          placeholder="Search for crops, farms, or records... (Ctrl+K)"
          className="w-full h-10 rounded-full bg-muted/30 border border-border/40 pl-10 pr-4 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:bg-card focus:ring-2 focus:ring-primary/10 focus:border-primary/40 transition-all duration-200 shadow-3xs focus:shadow-2xs"
        />
      </div>

      <button
        type="button"
        className="relative h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground/80 hover:bg-muted/60 hover:text-foreground transition-all duration-200 cursor-pointer shadow-3xs hover:shadow-2xs hover:scale-105"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-primary ring-1 ring-card animate-pulse" />
      </button>

      <div className="h-6 w-px bg-border/40" />

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-muted/60 rounded-full pl-1 pr-2.5 py-1 transition-all duration-200 cursor-pointer border border-transparent hover:border-border/30 shadow-3xs hover:shadow-2xs hover:scale-102">
          <Avatar className="h-7 w-7 ring-1 ring-border/40 shadow-xs">
            {user.image && <AvatarImage src={user.image} alt={user.name ?? user.email} />}
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/75 transition-transform duration-200" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 mt-1 rounded-xl p-1 shadow-md border bg-popover/95 backdrop-blur-md transition-all"
        >
          <div className="px-3 py-2">
            {user.name && <p className="text-xs font-semibold text-foreground/90">{user.name}</p>}
            <p className="text-[10px] text-muted-foreground/70 font-medium truncate mt-0.5">
              {user.email}
            </p>
          </div>
          <DropdownMenuSeparator />
          <Link href="/dashboard/settings" className="w-full">
            <DropdownMenuItem className="cursor-pointer text-xs rounded-lg py-2">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              View Profile
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <form action={signOutUser} className="w-full">
            <button type="submit" className="w-full">
              <DropdownMenuItem className="cursor-pointer text-xs rounded-lg text-red-600 hover:text-red-600 focus:text-red-600 py-2">
                <LogOut className="mr-2 h-4 w-4 text-red-500" />
                Sign Out
              </DropdownMenuItem>
            </button>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
