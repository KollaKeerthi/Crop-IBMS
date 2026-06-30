import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CloudSun,
  Database,
  Download,
  ExternalLink,
  FileText,
  FileWarning,
  History,
  Layers,
  MapPin,
  Plus,
  RefreshCcw,
  Sprout,
  Tractor,
  TrendingUp,
} from "lucide-react";
import { auth } from "@/features/auth";
import { db } from "@/db";
import { farms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resolveSelectedFarmId } from "@/lib/selected-farm";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const summaryCards = [
  {
    label: "Active Programs",
    value: "24",
    meta: "+2 this week",
    icon: ClipboardCheck,
    tone: "primary",
    footer: "SYS-ID: 8820",
  },
  {
    label: "Reservations",
    value: "112",
    meta: "Autumn cycle",
    icon: Sprout,
    tone: "blue",
    footer: "Week 42",
  },
  {
    label: "Active Contracts",
    value: "09",
    meta: "Verified",
    icon: FileText,
    tone: "neutral",
    footer: "No expiry today",
  },
  {
    label: "Pending Tasks",
    value: "16",
    meta: "Due today",
    icon: BellRing,
    tone: "orange",
    footer: "4 critical",
  },
  {
    label: "Conflicts",
    value: "03",
    meta: "Action required",
    icon: AlertTriangle,
    tone: "error",
    footer: "Resolve before publish",
  },
  {
    label: "Harvests",
    value: "12",
    meta: "Next 7 days",
    icon: Database,
    tone: "primary",
    footer: "80 kg planned",
  },
];

const events = [
  {
    date: "Mon 16 Oct",
    event: "Winter Wheat Seeding - S1",
    location: "North Cluster B",
    status: "Active",
    tone: "primary",
  },
  {
    date: "Tue 17 Oct",
    event: "Soil Analysis: Nitrogen Check",
    location: "South Sector 4",
    status: "Scheduled",
    tone: "blue",
  },
  {
    date: "Wed 18 Oct",
    event: "Irrigation Maintenance - Pump B",
    location: "Regional Hub",
    status: "Urgent",
    tone: "orange",
  },
  {
    date: "Fri 20 Oct",
    event: "Canola Contract Expiration",
    location: "Headquarters",
    status: "Alert",
    tone: "error",
  },
  {
    date: "Sat 21 Oct",
    event: "Post-Harvest Cleanup Cycle",
    location: "West Flatlands",
    status: "Pending",
    tone: "neutral",
  },
];

const alerts = [
  {
    title: "Resource Conflict: Unit 04",
    body: "Seeder S1 is assigned to two parallel tasks in North Sector.",
    action: "Resolve conflict",
    icon: FileWarning,
    tone: "error",
  },
  {
    title: "Overdue Task",
    body: "Maintenance check for Tractor #12 was due 48h ago.",
    icon: AlertTriangle,
    tone: "orange",
  },
  {
    title: "Missing Data Points",
    body: "Field moisture sensors are reporting incomplete telemetry.",
    icon: Database,
    tone: "blue",
  },
];

const activities = [
  {
    actor: "M. Schmidt",
    action: 'completed task "Silo 2 Ventilation Check".',
    time: "14:22",
    icon: CheckCircle2,
    tone: "primary",
  },
  {
    actor: "System",
    action: "updated Crop Plan for 2024 Barley.",
    time: "11:05",
    icon: RefreshCcw,
    tone: "blue",
  },
  {
    actor: "Lars V.",
    action: 'added new contractor "AgroServ GmbH".',
    time: "09:45",
    icon: Plus,
    tone: "neutral",
  },
  {
    actor: "Weather Alert",
    action: "predicted hail in North Region.",
    time: "07:30",
    icon: CloudSun,
    tone: "orange",
  },
];

function toneClasses(tone: string) {
  switch (tone) {
    case "blue":
      return {
        icon: "text-sky-600",
        badge: "bg-sky-50 text-sky-700 ring-sky-200",
        panel: "border-l-sky-500 bg-sky-50/60",
        dot: "bg-sky-600",
      };
    case "orange":
      return {
        icon: "text-orange-600",
        badge: "bg-orange-50 text-orange-700 ring-orange-200",
        panel: "border-l-orange-500 bg-orange-50/70",
        dot: "bg-orange-500",
      };
    case "error":
      return {
        icon: "text-red-600",
        badge: "bg-red-50 text-red-700 ring-red-200",
        panel: "border-l-red-500 bg-red-50/70",
        dot: "bg-red-600",
      };
    case "neutral":
      return {
        icon: "text-slate-600",
        badge: "bg-slate-100 text-slate-700 ring-slate-200",
        panel: "border-l-slate-400 bg-slate-50",
        dot: "bg-slate-400",
      };
    default:
      return {
        icon: "text-primary",
        badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        panel: "border-l-primary bg-emerald-50/60",
        dot: "bg-primary",
      };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { selectedFarmId } = await resolveSelectedFarmId(session.user.id);

  let farm: typeof farms.$inferSelect | null = null;

  if (selectedFarmId) {
    const farmRows = await db.select().from(farms).where(eq(farms.id, selectedFarmId)).limit(1);
    farm = farmRows[0] ?? null;
  }

  if (!selectedFarmId) {
    return (
      <PageShell maxWidth="full" className="bg-slate-100">
        <div className="rounded-lg border border-dashed bg-card p-10 text-center shadow-sm">
          <p className="text-xl font-semibold text-foreground">No farm selected</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create or select a farm to get started.
          </p>
          <div className="pt-5">
            <Link href="/dashboard/farms">
              <Button>Go to Farms</Button>
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="full" className="bg-slate-100">
      <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Week 42 Cycle
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-emerald-900">
              Operational Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              System status: <span className="font-semibold text-primary">Optimal</span>
              {farm?.name ? ` | ${farm.name}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/crop-data">
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                New Resource
              </Button>
            </Link>
            <Button variant="outline" className="gap-2 bg-white">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {summaryCards.map((card) => {
            const tone = toneClasses(card.tone);
            const Icon = card.icon;
            return (
              <article
                key={card.label}
                className={cn(
                  "rounded-lg border bg-white p-4 shadow-sm",
                  card.tone === "error" ? "border-red-200" : "border-slate-200"
                )}
              >
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Icon className={cn("h-4 w-4", tone.icon)} />
                  <span>{card.label}</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className={cn("font-mono text-3xl font-semibold", tone.icon)}>
                    {card.value}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{card.meta}</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="font-mono text-[11px] uppercase text-slate-400">
                    {card.footer}
                  </span>
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-semibold text-slate-950">
                    Upcoming Crop Plan Events
                  </h2>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase text-slate-500">
                  <span>Oct 2026</span>
                  <span className="rounded border border-slate-200 px-2 py-1">Week 42</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full border-collapse text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-slate-500">
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Event / Program</th>
                      <th className="px-5 py-3 font-semibold">Location</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event, index) => {
                      const tone = toneClasses(event.tone);
                      return (
                        <tr
                          key={event.event}
                          className={cn(
                            "border-b border-slate-100 transition-colors hover:bg-sky-50/40",
                            index % 2 === 1 && "bg-slate-50/60"
                          )}
                        >
                          <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                            {event.date}
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-950">{event.event}</td>
                          <td className="px-5 py-3 text-slate-600">{event.location}</td>
                          <td className="px-5 py-3">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ring-1",
                                tone.badge
                              )}
                            >
                              {event.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <ExternalLink className="ml-auto h-4 w-4 text-slate-400" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-100 px-5 py-3 text-center">
                <Link
                  href="/dashboard/crop-plan"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  View Full Crop Calendar
                </Link>
              </div>
            </article>
          </div>

          <div className="flex flex-col gap-6 xl:col-span-4">
            <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <h2 className="text-sm font-semibold text-slate-950">Operational Alerts</h2>
                </div>
              </div>
              <div className="space-y-3 p-4">
                {alerts.map((alert) => {
                  const tone = toneClasses(alert.tone);
                  const Icon = alert.icon;
                  return (
                    <div key={alert.title} className={cn("rounded-md border-l-4 p-3", tone.panel)}>
                      <div className="flex gap-3">
                        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", tone.icon)} />
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{alert.title}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-600">{alert.body}</p>
                          {alert.action && (
                            <button className="mt-2 text-left text-[11px] font-semibold uppercase text-primary hover:underline">
                              {alert.action}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-slate-500" />
                  <h2 className="text-sm font-semibold text-slate-950">Recent Activity</h2>
                </div>
                <RefreshCcw className="h-4 w-4 text-slate-400" />
              </div>
              <div className="space-y-5 p-4">
                {activities.map((activity, index) => {
                  const tone = toneClasses(activity.tone);
                  const Icon = activity.icon;
                  return (
                    <div key={`${activity.actor}-${activity.time}`} className="relative flex gap-3">
                      {index < activities.length - 1 && (
                        <span className="absolute left-[11px] top-7 h-8 w-px bg-slate-200" />
                      )}
                      <span
                        className={cn(
                          "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white",
                          tone.dot
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-sm leading-5 text-slate-700">
                          <span className="font-semibold text-slate-950">{activity.actor}</span>{" "}
                          {activity.action}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-slate-400">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>
        </section>

        <section className="grid gap-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_384px] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-slate-950">Farm Geospatial Overview</h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Real-time status of connected machinery and sensor nodes across the selected farm. Use
              this snapshot to jump into the full Farm Map when block-level context is needed.
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <LegendDot label="Operational" className="bg-primary" />
              <LegendDot label="Maintenance" className="bg-orange-500" />
              <LegendDot label="Transit" className="bg-sky-600" />
            </div>
          </div>
          <div className="relative h-48 overflow-hidden rounded-lg border border-slate-200 bg-[linear-gradient(135deg,#dbe7c4_0%,#dbe7c4_26%,#a8c68f_26%,#a8c68f_47%,#e4d2a1_47%,#e4d2a1_64%,#8fb179_64%,#8fb179_100%)]">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.36)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.34)_1px,transparent_1px)] bg-[size:36px_36px]" />
            <MapNode className="left-1/3 top-1/4 bg-primary" />
            <MapNode className="right-1/4 top-1/2 bg-sky-600" />
            <MapNode className="bottom-10 left-1/2 bg-orange-500" />
            <div className="absolute bottom-3 right-3 rounded border border-slate-200 bg-white/90 px-2 py-1 font-mono text-[10px] font-semibold text-slate-600">
              L: 52.52 N | 13.40 E
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function LegendDot({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-3 w-3 rounded-full", className)} />
      <span className="font-mono text-[11px] font-semibold uppercase text-slate-500">{label}</span>
    </div>
  );
}

function MapNode({ className }: { className: string }) {
  return (
    <span
      className={cn(
        "absolute h-4 w-4 rounded-full border-2 border-white shadow-lg ring-4 ring-white/30",
        className
      )}
    />
  );
}
