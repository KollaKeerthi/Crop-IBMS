"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  LayoutGrid,
  Leaf,
  BookOpen,
  Database,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Settings,
  Bot,
  Check,
  Tractor,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarm } from "@/lib/farm-context";
import { useSidebar } from "@/lib/sidebar-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

type Farm = { id: string; name: string };
type User = { name: string | null; email: string; image: string | null };

type NavItem = {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const MANAGEMENT_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Farm Map", href: "/dashboard/map", icon: Map },
  { label: "Layout", href: "/dashboard/map/layout-view", icon: LayoutGrid },
  { label: "Crop Calendar", href: "/dashboard/plantings", icon: Tractor },
  {
    label: "Crop Planning",
    href: "/dashboard/crop-plan",
    icon: Layers,
  },
  { label: "Crop Info", href: "/dashboard/crop-information", icon: BookOpen },
  { label: "Crop Data", href: "/dashboard/crop-data", icon: Database },
  { label: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
];

const INTELLIGENCE_ITEMS: NavItem[] = [{ label: "AI Assistant", href: "/dashboard/ai", icon: Bot }];

const PLATFORM_ITEMS: NavItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

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

export function Sidebar({
  farms,
  user,
  isOwner = false,
}: {
  farms: Farm[];
  user: User;
  isOwner?: boolean;
}) {
  const pathname = usePathname();
  const { selectedFarmId, setSelectedFarmId } = useFarm();
  const { collapsed, toggle } = useSidebar();
  const [farmDropdownOpen, setFarmDropdownOpen] = useState(false);

  const managementItems = isOwner
    ? [
        MANAGEMENT_ITEMS[0]!,
        { label: "Farms", href: "/dashboard/farms", icon: Tractor },
        ...MANAGEMENT_ITEMS.slice(1),
      ]
    : MANAGEMENT_ITEMS;

  const sections: NavSection[] = [
    { label: "Management", items: managementItems },
    { label: "Intelligence", items: INTELLIGENCE_ITEMS },
    { label: "Platform", items: PLATFORM_ITEMS },
  ];

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const section of sections) {
      for (const item of section.items) {
        if (item.children) {
          initial[item.label] = item.children.some((c) => pathname.startsWith(c.href));
        }
      }
    }
    return initial;
  });

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  const selectedFarm = farms.find((f) => f.id === selectedFarmId) ?? farms[0] ?? null;

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-border/40 bg-gradient-to-b from-card via-card/98 to-muted/20 shadow-xs transition-[width] duration-200 ease-out relative z-30",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand + collapse toggle */}
      <div
        className={cn(
          "flex h-16 items-center px-4 border-b border-border/40 gap-2",
          collapsed && "justify-center px-2"
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden flex-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm transition-transform hover:scale-105 duration-200">
              <Leaf className="size-4 text-primary animate-pulse" />
            </div>
            <span className="font-heading text-sm font-bold tracking-wider uppercase bg-gradient-to-r from-primary via-primary/95 to-emerald-500 bg-clip-text text-transparent truncate">
              Agriplatform
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 cursor-pointer shadow-xs hover:shadow-sm",
            collapsed ? "mx-auto" : "ml-auto"
          )}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      {/* Farm selector */}
      <div className={cn("relative border-b border-border/40 py-4 px-3", collapsed && "px-2 py-3")}>
        {!collapsed && (
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            Operational Context
          </p>
        )}
        <button
          type="button"
          onClick={() => setFarmDropdownOpen((o) => !o)}
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl border border-border/40 text-sm font-medium transition-all duration-200 shadow-2xs hover:shadow-xs cursor-pointer",
            collapsed
              ? "h-10 w-10 justify-center bg-muted/20 hover:bg-primary/10 hover:border-primary/20"
              : "px-3 py-2.5 bg-card hover:bg-muted/40"
          )}
          title={collapsed ? (selectedFarm?.name ?? "Select a farm") : undefined}
        >
          {collapsed ? (
            <Tractor className="size-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:scale-105 duration-200" />
          ) : (
            <>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Tractor className="size-3.5" />
              </div>
              <span className="min-w-0 flex-1 truncate text-left text-foreground/90 font-semibold group-hover:text-foreground">
                {selectedFarm?.name ?? "Select a farm"}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground shrink-0 transition-transform duration-200 group-hover:text-foreground",
                  farmDropdownOpen && "rotate-180"
                )}
              />
            </>
          )}
        </button>

        {farmDropdownOpen && farms.length > 0 && !collapsed && (
          <div className="absolute left-3 right-3 top-full z-50 mt-1.5 rounded-xl border border-border bg-popover/95 backdrop-blur-md p-1 shadow-md transition-all animate-in fade-in slide-in-from-top-1 duration-150">
            {farms.map((farm) => (
              <button
                key={farm.id}
                type="button"
                onClick={() => {
                  setSelectedFarmId(farm.id);
                  setFarmDropdownOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer",
                  farm.id === selectedFarmId
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Tractor className="size-3" />
                </div>
                <span className="min-w-0 flex-1 truncate text-left">{farm.name}</span>
                {farm.id === selectedFarmId && <Check className="size-3.5 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.label} className="space-y-1.5">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              if (item.children) {
                const isGroupActive = item.children.some((c) => pathname.startsWith(c.href));
                const isOpen = (openGroups[item.label] ?? false) && !collapsed;
                return (
                  <div key={item.label} className="relative group">
                    <button
                      type="button"
                      onClick={() => !collapsed && toggleGroup(item.label)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer relative",
                        collapsed ? "h-10 justify-center" : "px-3.5 py-2.5",
                        isGroupActive
                          ? "bg-primary/8 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      {/* Left indicator for parent item in group */}
                      {isGroupActive && (
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-primary" />
                      )}
                      <item.icon
                        className={cn(
                          "size-4 shrink-0 transition-transform duration-200",
                          !collapsed && "group-hover:scale-105"
                        )}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left transition-transform duration-200 group-hover:translate-x-0.5">
                            {item.label}
                          </span>
                          {isOpen ? (
                            <ChevronDown className="size-3.5 shrink-0" />
                          ) : (
                            <ChevronRight className="size-3.5 shrink-0" />
                          )}
                        </>
                      )}
                    </button>
                    {isOpen && (
                      <div className="ml-5 mt-1 pl-3.5 border-l border-border/40 space-y-1">
                        {item.children.map((child) => {
                          const isActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "block rounded-lg px-3 py-2 text-xs transition-all duration-200 cursor-pointer relative",
                                isActive
                                  ? "bg-primary/8 font-semibold text-primary"
                                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                              )}
                            >
                              {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3 rounded-full bg-primary" />
                              )}
                              <span
                                className={cn(
                                  "transition-transform duration-200 block",
                                  isActive ? "pl-2" : "hover:translate-x-0.5"
                                )}
                              >
                                {child.label}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : item.href === "/dashboard/map"
                    ? pathname === "/dashboard/map"
                    : pathname.startsWith(item.href!);

              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer relative group",
                    collapsed ? "h-10 w-10 mx-auto justify-center" : "px-3.5 py-2.5",
                    isActive
                      ? "bg-primary/8 text-primary font-semibold ring-1 ring-primary/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-primary animate-in fade-in zoom-in duration-200" />
                  )}
                  <item.icon
                    className={cn(
                      "size-4 shrink-0 transition-transform duration-200",
                      isActive
                        ? "text-primary scale-105"
                        : "group-hover:scale-110 group-hover:text-primary"
                    )}
                  />
                  {!collapsed && (
                    <span
                      className={cn(
                        "transition-transform duration-200",
                        isActive
                          ? "text-foreground font-semibold"
                          : "group-hover:translate-x-0.5 group-hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className={cn("border-t border-border/40 p-3", collapsed && "px-2 py-4")}>
        <div
          className={cn(
            "flex items-center gap-3 rounded-2xl transition-all duration-200",
            collapsed
              ? "flex-col gap-2 justify-center"
              : "p-2.5 bg-muted/40 hover:bg-muted/70 border border-border/20 shadow-2xs hover:shadow-xs"
          )}
        >
          <div className="relative">
            <Avatar className="h-8 w-8 ring-1 ring-border shadow-sm">
              {user.image && <AvatarImage src={user.image} alt={user.name ?? user.email} />}
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground/90 leading-tight">
                {user.name ?? "User"}
              </p>
              <p className="truncate text-[10px] text-muted-foreground/80 font-medium leading-tight mt-0.5">
                {user.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
