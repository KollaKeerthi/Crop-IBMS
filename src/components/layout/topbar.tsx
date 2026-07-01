"use client";

import { Search, Bell, ChevronDown, User, LogOut, Home, CircleHelp } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <header className="relative z-20 px-4 pb-2 pt-4 sm:px-6 sm:pt-6">
      <div className="app-panel-strong flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="app-kicker">Workspace</p>
          <h1 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
            Application Shell
          </h1>
        </div>

        <div className="flex flex-1 flex-col gap-3 lg:max-w-3xl lg:flex-row lg:items-center lg:justify-end">
          <div className="relative min-w-0 flex-1 lg:max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for crops, farms, tasks, or records"
              className="pl-11"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Home">
              <Home className="size-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Support">
              <CircleHelp className="size-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Notifications">
              <Bell className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end px-1">
        <DropdownMenu>
          <DropdownMenuTrigger className="app-pill flex items-center gap-3 px-2 py-2 transition hover:bg-card">
            <Avatar className="h-9 w-9 ring-1 ring-border/60 shadow-sm">
              {user.image && <AvatarImage src={user.image} alt={user.name ?? user.email} />}
              <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-foreground">{user.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <ChevronDown className="size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="mt-2 w-60 rounded-[1.5rem] border border-border bg-popover/95 p-2 shadow-md backdrop-blur-md"
          >
            <div className="px-3 py-2">
              {user.name && <p className="text-sm font-semibold text-foreground">{user.name}</p>}
              <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                {user.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <Link href="/dashboard/settings" className="w-full">
              <DropdownMenuItem className="cursor-pointer rounded-2xl py-2 text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                View Profile
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <form action={signOutUser} className="w-full">
              <button type="submit" className="w-full">
                <DropdownMenuItem className="cursor-pointer rounded-2xl py-2 text-sm text-destructive hover:text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4 text-destructive" />
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
