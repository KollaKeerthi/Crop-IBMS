import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CloudSun,
  Database,
  Download,
  FileText,
  FileWarning,
  History,
  MapPin,
  Plus,
  RefreshCcw,
  Sprout,
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
  },
  {
    label: "Reservations",
    value: "112",
    meta: "Autumn cycle",
    icon: Sprout,
    tone: "blue",
  },
  {
    label: "Active Contracts",
    value: "09",
    meta: "Verified",
    icon: FileText,
    tone: "neutral",
  },
  {
    label: "Pending Tasks",
    value: "16",
    meta: "Due today",
    icon: AlertTriangle,
    tone: "orange",
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
    action: "Review task queue",
    icon: AlertTriangle,
    tone: "orange",
  },
  {
    title: "Missing Data Points",
    body: "Field moisture sensors are reporting incomplete telemetry.",
    action: "Inspect telemetry",
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
    icon: FileText,
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
        icon: "text-[var(--brand-secondary)]",
        badge: "bg-[var(--brand-secondary)] text-white",
        border: "border-[var(--brand-secondary)]",
        dot: "bg-[var(--brand-secondary)]",
      };
    case "orange":
      return {
        icon: "text-[var(--brand-tertiary)]",
        badge: "bg-[var(--brand-tertiary)] text-white",
        border: "border-[var(--brand-tertiary)]",
        dot: "bg-[var(--brand-tertiary)]",
      };
    case "error":
      return {
        icon: "text-destructive",
        badge: "bg-destructive text-white",
        border: "border-destructive",
        dot: "bg-destructive",
      };
    case "neutral":
      return {
        icon: "text-[var(--brand-neutral)]",
        badge: "bg-[var(--brand-neutral)] text-white",
        border: "border-[var(--brand-neutral)]",
        dot: "bg-[var(--brand-neutral)]",
      };
    default:
      return {
        icon: "text-primary",
        badge: "bg-primary text-primary-foreground",
        border: "border-primary",
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
      <PageShell maxWidth="full">
        <div className="app-panel-strong flex min-h-[24rem] flex-col items-center justify-center px-6 py-12 text-center">
          <p className="app-kicker">Dashboard</p>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">No farm selected</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Select or create a farm before using the shared workspace template.
          </p>
          <div className="mt-6">
            <Link href="/dashboard/farms">
              <Button>Go to Farms</Button>
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="full">
      <section className="app-panel-strong grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
        <div>
          <p className="app-kicker">Core Screen Template</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">Operational Dashboard</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            This page now uses the new shared shell, palette, typography, and panel language that
            future application screens can inherit.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard/crop-data">
              <Button className="gap-2">
                <Plus className="size-4" />
                New Resource
              </Button>
            </Link>
            <Button variant="outline" className="gap-2">
              <Download className="size-4" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="app-panel grid gap-4 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="app-kicker">Selected Farm</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {farm?.name ?? "Unknown farm"}
              </p>
            </div>
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Optimal
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricStrip label="Cycle" value="Week 42" />
            <MetricStrip label="Region" value="North Hub" />
            <MetricStrip label="Health" value="Stable" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const tone = toneClasses(card.tone);
          const Icon = card.icon;

          return (
            <article key={card.label} className="app-grid-card px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="app-kicker">{card.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{card.value}</p>
                </div>
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-3xl border bg-card",
                    tone.border
                  )}
                >
                  <Icon className={cn("size-5", tone.icon)} />
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{card.meta}</p>
                <TrendingUp className={cn("size-4", tone.icon)} />
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.9fr)]">
        <article className="app-panel px-5 py-5">
          <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="app-kicker">Timeline</p>
              <h3 className="app-section-title mt-1">Upcoming Crop Plan Events</h3>
            </div>
            <div className="app-pill inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground">
              <CalendarDays className="size-4 text-primary" />
              Oct 2026
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[42rem] w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left">
                  <th className="app-kicker px-3 py-2 font-semibold">Date</th>
                  <th className="app-kicker px-3 py-2 font-semibold">Event</th>
                  <th className="app-kicker px-3 py-2 font-semibold">Location</th>
                  <th className="app-kicker px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const tone = toneClasses(event.tone);

                  return (
                    <tr key={event.event} className="app-grid-card">
                      <td className="rounded-l-3xl px-3 py-3 text-muted-foreground">
                        {event.date}
                      </td>
                      <td className="px-3 py-3 font-semibold text-foreground">{event.event}</td>
                      <td className="px-3 py-3 text-muted-foreground">{event.location}</td>
                      <td className="px-3 py-3">
                        <span
                          className={cn("rounded-full px-3 py-1 text-xs font-semibold", tone.badge)}
                        >
                          {event.status}
                        </span>
                      </td>
                      <td className="rounded-r-3xl px-3 py-3 text-right">
                        <ArrowRight className="ml-auto size-4 text-muted-foreground" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="app-panel px-5 py-5">
          <div className="flex items-center justify-between border-b border-border/70 pb-4">
            <div>
              <p className="app-kicker">Live Feed</p>
              <h3 className="app-section-title mt-1">Recent Activity</h3>
            </div>
            <History className="size-4 text-muted-foreground" />
          </div>

          <div className="mt-5 space-y-5">
            {activities.map((activity, index) => {
              const tone = toneClasses(activity.tone);
              const Icon = activity.icon;

              return (
                <div key={`${activity.actor}-${activity.time}`} className="relative flex gap-3">
                  {index < activities.length - 1 && (
                    <span className="absolute left-[0.9rem] top-10 h-10 w-px bg-border" />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-white",
                      tone.dot
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      <span className="font-semibold text-foreground">{activity.actor}</span>{" "}
                      {activity.action}
                    </p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className="app-panel px-5 py-5">
          <div className="flex items-center justify-between border-b border-border/70 pb-4">
            <div>
              <p className="app-kicker">Attention</p>
              <h3 className="app-section-title mt-1">Operational Alerts</h3>
            </div>
            <AlertTriangle className="size-4 text-destructive" />
          </div>

          <div className="mt-4 space-y-3">
            {alerts.map((alert) => {
              const tone = toneClasses(alert.tone);
              const Icon = alert.icon;

              return (
                <div
                  key={alert.title}
                  className={cn(
                    "rounded-[1.75rem] border-l-4 bg-[var(--app-panel-strong)] px-4 py-4",
                    tone.border
                  )}
                >
                  <div className="flex gap-3">
                    <Icon className={cn("mt-0.5 size-5 shrink-0", tone.icon)} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{alert.body}</p>
                      <button className={cn("mt-3 text-sm font-semibold", tone.icon)}>
                        {alert.action}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="app-panel px-5 py-5">
          <div className="flex items-center justify-between border-b border-border/70 pb-4">
            <div>
              <p className="app-kicker">Spatial Context</p>
              <h3 className="app-section-title mt-1">Farm Geospatial Overview</h3>
            </div>
            <MapPin className="size-4 text-primary" />
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            The new template supports richer data panels without losing the calm, tiled structure
            from your reference board.
          </p>

          <div className="mt-4 rounded-[1.75rem] border border-border bg-[var(--app-panel-muted)] p-3">
            <div className="relative h-56 overflow-hidden rounded-[1.25rem] bg-[linear-gradient(135deg,var(--app-panel-strong)_0%,var(--app-panel-strong)_30%,var(--accent)_30%,var(--accent)_58%,var(--secondary)_58%,var(--secondary)_100%)]">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.45)_1px,transparent_1px)] bg-[size:2.75rem_2.75rem]" />
              <MapNode className="left-[18%] top-[24%] bg-primary" />
              <MapNode className="left-[52%] top-[50%] bg-[var(--brand-secondary)]" />
              <MapNode className="left-[76%] top-[34%] bg-[var(--brand-tertiary)]" />
              <div className="app-pill absolute bottom-3 right-3 px-3 py-2 text-xs font-semibold text-muted-foreground">
                52.52 N / 13.40 E
              </div>
            </div>
          </div>
        </article>
      </section>
    </PageShell>
  );
}

function MetricStrip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-[var(--app-panel-strong)] px-4 py-3">
      <p className="app-kicker">{label}</p>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function MapNode({ className }: { className: string }) {
  return (
    <span
      className={cn(
        "absolute size-4 rounded-full border-2 border-white shadow-sm ring-4 ring-white/50",
        className
      )}
    />
  );
}
