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
  // { label: "Crop Planning", href: "/dashboard/crop-plan", icon: Layers },
  { label: "Crop Info", href: "/dashboard/crop-information", icon: BookOpen },
  { label: "Crop Data", href: "/dashboard/crop-data", icon: Database },
  { label: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
];

const INTELLIGENCE_ITEMS: NavItem[] = [
  { label: "AI Assistant", href: "/dashboard/ai", icon: Bot },
];

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
        "flex h-screen shrink-0 flex-col border-r bg-card transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Brand + collapse toggle */}
      <div className="flex h-14 items-center border-b px-3">
        {!collapsed && (
          <span className="flex-1 truncate text-caption font-bold uppercase tracking-wider text-foreground">
            Agriplatform
          </span>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      {/* Farm selector */}
      <div className={cn("relative border-b py-3", collapsed ? "px-2" : "px-3")}>
        {!collapsed && (
          <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Operational Context
          </p>
        )}
        <button
          type="button"
          onClick={() => setFarmDropdownOpen((o) => !o)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md text-sm font-medium hover:bg-muted transition-colors",
            collapsed ? "h-9 justify-center" : "px-2 py-1.5"
          )}
          title={collapsed ? selectedFarm?.name ?? "Select a farm" : undefined}
        >
          {collapsed ? (
            <Tractor className="size-4 text-muted-foreground" />
          ) : (
            <>
              <span className="min-w-0 flex-1 truncate text-left">
                {selectedFarm?.name ?? "Select a farm"}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground shrink-0 transition-transform",
                  farmDropdownOpen && "rotate-180"
                )}
              />
            </>
          )}
        </button>

        {farmDropdownOpen && farms.length > 0 && !collapsed && (
          <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-md border bg-popover shadow-md">
            {farms.map((farm) => (
              <button
                key={farm.id}
                type="button"
                onClick={() => {
                  setSelectedFarmId(farm.id);
                  setFarmDropdownOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <span className="min-w-0 flex-1 truncate text-left">{farm.name}</span>
                {farm.id === selectedFarmId && (
                  <Check className="size-3.5 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        {sections.map((section) => (
          <div key={section.label} className="space-y-0.5">
            {!collapsed && (
              <p className="px-2.5 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              if (item.children) {
                const isGroupActive = item.children.some((c) => pathname.startsWith(c.href));
                const isOpen = (openGroups[item.label] ?? false) && !collapsed;
                return (
                  <div key={item.label}>
                    <button
                      type="button"
                      onClick={() => !collapsed && toggleGroup(item.label)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md text-sm font-medium transition-colors",
                        collapsed ? "h-9 justify-center" : "px-2.5 py-1.5",
                        isGroupActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {isOpen ? (
                            <ChevronDown className="size-3.5 shrink-0" />
                          ) : (
                            <ChevronRight className="size-3.5 shrink-0" />
                          )}
                        </>
                      )}
                    </button>
                    {isOpen && (
                      <div className="ml-6 mt-0.5 space-y-0.5">
                        {item.children.map((child) => {
                          const isActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "block rounded-md px-2.5 py-1.5 text-sm transition-colors",
                                isActive
                                  ? "bg-primary/10 font-medium text-primary"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                            >
                              {child.label}
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
                    "flex items-center gap-2 rounded-md text-sm font-medium transition-colors",
                    collapsed ? "h-9 justify-center" : "px-2.5 py-1.5",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <Separator />

      {/* User section */}
      <div className={cn("py-3", collapsed ? "px-2" : "px-3")}>
        <div className={cn("flex items-center gap-2.5", collapsed && "flex-col gap-2")}>
          <Avatar className="h-7 w-7">
            {user.image && <AvatarImage src={user.image} alt={user.name ?? user.email} />}
            <AvatarFallback className="text-xs">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && user.name && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-none">{user.name}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
