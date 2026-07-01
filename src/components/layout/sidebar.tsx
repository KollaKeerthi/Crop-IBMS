"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Leaf,
  BookOpen,
  Database,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Check,
  Tractor,
  Map,
  Settings,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarm } from "@/lib/farm-context";
import { useSidebar } from "@/lib/sidebar-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  { label: "Crop Plan", href: "/dashboard/crop-plan", icon: Layers },
  { label: "Crop Info", href: "/dashboard/crop-information", icon: BookOpen },
  { label: "Crop Data", href: "/dashboard/crop-data", icon: Database },
  { label: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { label: "Farm Map", href: "/dashboard/map", icon: Map },
];

const INTELLIGENCE_ITEMS: NavItem[] = [];
const PLATFORM_ITEMS: NavItem[] = [];

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

  const managementItems = MANAGEMENT_ITEMS;

  const sections: NavSection[] = [
    { label: "Management", items: managementItems },
    { label: "Intelligence", items: INTELLIGENCE_ITEMS },
    { label: "Administration", items: PLATFORM_ITEMS },
  ].filter((s) => s.items.length > 0);

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
        "shrink-0 p-3 pr-0 transition-[width] duration-200 ease-out",
        collapsed ? "w-24" : "w-80"
      )}
    >
      <div className="app-frame flex h-full flex-col overflow-hidden rounded-[2rem] p-3">
        <div className={cn("flex items-center gap-3 px-2 pb-4", collapsed && "justify-center")}>
          {!collapsed && (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-sm">
                <Leaf className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="app-kicker">Core Template</p>
                <p className="truncate font-heading text-sm font-semibold text-foreground">
                  iBMS Crop
                </p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "app-pill inline-flex size-10 items-center justify-center text-muted-foreground transition hover:text-foreground",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>

        <div className={cn("relative px-1 pb-4", collapsed && "px-0")}>
          {!collapsed && <p className="app-kicker px-3 pb-2">Selected Farm</p>}
          <button
            type="button"
            onClick={() => setFarmDropdownOpen((o) => !o)}
            className={cn(
              "app-panel flex w-full items-center gap-3 px-3 py-3 text-sm font-medium transition",
              collapsed ? "justify-center px-0" : "hover:bg-[var(--app-panel-strong)]"
            )}
            title={collapsed ? (selectedFarm?.name ?? "Select a farm") : undefined}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <Tractor className="size-4" />
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate text-left font-semibold text-foreground">
                  {selectedFarm?.name ?? "Select a farm"}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform",
                    farmDropdownOpen && "rotate-180"
                  )}
                />
              </>
            )}
          </button>

          {farmDropdownOpen && farms.length > 0 && !collapsed && (
            <div className="app-panel-strong absolute left-1 right-1 top-full z-50 mt-2 p-1">
              {farms.map((farm) => (
                <button
                  key={farm.id}
                  type="button"
                  onClick={() => {
                    setSelectedFarmId(farm.id);
                    setFarmDropdownOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm transition",
                    farm.id === selectedFarmId
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Tractor className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{farm.name}</span>
                  {farm.id === selectedFarmId && <Check className="size-4 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-1 py-1">
          {sections.map((section) => (
            <div key={section.label} className="space-y-1.5">
              {!collapsed && <p className="app-kicker px-3 pb-1">{section.label}</p>}
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
                          "flex w-full items-center gap-3 rounded-2xl text-sm font-medium transition relative",
                          collapsed ? "h-12 justify-center" : "px-3.5 py-3",
                          isGroupActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
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
                        <div className="ml-5 mt-2 space-y-1 border-l border-border/80 pl-3.5">
                          {item.children.map((child) => {
                            const isActive = pathname === child.href;
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  "block rounded-2xl px-3 py-2 text-xs transition relative",
                                  isActive
                                    ? "bg-secondary font-semibold text-secondary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                )}
                              >
                                <span>{child.label}</span>
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
                      "flex items-center gap-3 rounded-2xl text-sm font-medium transition relative",
                      collapsed ? "mx-auto h-12 w-12 justify-center" : "px-3.5 py-3",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
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

        <div className={cn("space-y-3 border-t border-border/70 px-1 pt-4", collapsed && "px-0")}>
          <Link
            href="/dashboard/settings"
            title={collapsed ? "Settings" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-2xl text-sm font-medium transition",
              collapsed ? "mx-auto h-12 w-12 justify-center" : "px-3.5 py-3",
              pathname.startsWith("/dashboard/settings")
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Settings className="size-4 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>

          <div
            className={cn(
              "app-panel flex items-center gap-3 transition",
              collapsed ? "flex-col justify-center px-0 py-3" : "px-3 py-3"
            )}
          >
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10 ring-1 ring-border/70 shadow-sm">
                {user.image && <AvatarImage src={user.image} alt={user.name ?? user.email} />}
                <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight text-foreground">
                  {user.name ?? "User"}
                </p>
                <p className="mt-0.5 truncate text-xs font-medium leading-tight text-muted-foreground">
                  {user.email}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
