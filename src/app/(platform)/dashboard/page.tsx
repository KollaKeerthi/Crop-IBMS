import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  Filter,
  Leaf,
  RefreshCcw,
  Sprout,
  Sun,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";
import { auth } from "@/features/auth";
import { resolveSelectedFarmId } from "@/lib/selected-farm";
import { cn } from "@/lib/utils";

const outlook = [
  { day: "TUE", temp: "26", icon: Sun, note: "2%" },
  { day: "WED", temp: "22", icon: CloudRain, note: "24%" },
  { day: "THU", temp: "19", icon: Cloud, note: "10%" },
  { day: "FRI", temp: "23", icon: CloudSun, note: "5%" },
  { day: "SAT", temp: "25", icon: Sun, note: "0%" },
  { day: "SUN", temp: "21", icon: CloudRain, note: "18%" },
  { day: "MON", temp: "24", icon: CloudSun, note: "6%" },
];

const programs = [
  {
    name: "Organic Romaine",
    location: "Block A1-A4",
    badge: "SOWN",
    progress: "62%",
    eta: "Sep 12",
    icon: Leaf,
    tone: "green",
  },
  {
    name: "Precision Wheat",
    location: "Sector 8 West",
    badge: "IRRIGATING",
    progress: "38%",
    eta: "Oct 05",
    icon: Droplets,
    tone: "blue",
  },
];

const tasks = [
  {
    task: "Soil pH Sampling",
    block: "B-09",
    deadline: "Today, 16:00",
    status: "PENDING",
    priority: "High",
    priorityTone: "text-destructive",
    statusTone: "bg-[var(--erp-warning-muted)] text-[var(--erp-warning)]",
  },
  {
    task: "Calibrate Sprayer System",
    block: "Main Shop",
    deadline: "Tomorrow",
    status: "SCHEDULED",
    priority: "Medium",
    priorityTone: "text-[var(--erp-ink)]",
    statusTone: "bg-[var(--erp-info-muted)] text-[var(--brand-secondary)]",
  },
  {
    task: "Irrigation Log Missing",
    block: "C-02",
    deadline: "Overdue 2h",
    status: "ACTION REQ",
    priority: "Urgent",
    priorityTone: "text-destructive",
    statusTone: "bg-[var(--erp-danger-muted)] text-destructive",
    alert: true,
  },
];

const forecastBars = [
  { label: "W1", value: "45%" },
  { label: "W2", value: "63%" },
  { label: "W3", value: "78%" },
  { label: "Current", value: "86%", active: true },
  { label: "W5", value: "92%" },
  { label: "W6", value: "58%" },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { selectedFarmId } = await resolveSelectedFarmId(session.user.id);

  if (!selectedFarmId) {
    return (
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="border border-[var(--erp-border)] bg-white px-8 py-7 text-center">
          <p className="erp-kicker">Dashboard</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--erp-ink)]">No farm selected</h2>
          <p className="mt-2 max-w-md text-xs leading-5 text-[var(--erp-muted)]">
            Select or create a farm before using the operational dashboard.
          </p>
          <Link
            href="/dashboard/farms"
            className="mt-5 inline-flex h-8 items-center border border-primary bg-primary px-3 text-xs font-semibold text-primary-foreground"
          >
            Go to Farms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,7fr)_minmax(19rem,3fr)]">
        <div className="space-y-3">
          <CurrentConditions />
          <ActivePrograms />
          <RecentTasks />
        </div>

        <div className="space-y-3">
          <BlockUsage />
          <HarvestForecast />
          <FieldStatusMap />
        </div>
      </div>
    </div>
  );
}

function CurrentConditions() {
  return (
    <section className="erp-card relative min-h-44 overflow-hidden p-4">
      <CloudSun className="absolute right-7 top-6 size-28 text-[var(--erp-border)] opacity-70" />
      <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,1.15fr)]">
        <div>
          <p className="erp-kicker">Current Conditions</p>
          <div className="mt-2 flex items-end gap-3">
            <p className="text-5xl font-medium leading-none text-[var(--erp-ink)]">24°C</p>
            <p className="pb-1 text-sm font-bold text-primary">Partly Cloudy</p>
          </div>
          <div className="mt-5 grid max-w-xs grid-cols-2 gap-4 text-[0.68rem] text-[var(--erp-ink)]">
            <div className="flex items-center gap-2">
              <Droplets className="size-4 text-[var(--brand-secondary)]" />
              <div>
                <p className="font-semibold">Humidity:</p>
                <p className="text-[var(--erp-muted)]">64%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="size-4 text-[var(--brand-secondary)]" />
              <div>
                <p className="font-semibold">Wind:</p>
                <p className="text-[var(--erp-muted)]">12 km/h NW</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-l border-[var(--erp-border)] pl-5">
          <p className="mb-3 text-[0.7rem] font-semibold text-[var(--erp-ink)]">7-Day Outlook</p>
          <div className="grid grid-cols-7 gap-1.5">
            {outlook.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.day} className="min-w-0 text-center">
                  <p className="text-[0.55rem] font-semibold text-[var(--erp-muted)]">{item.day}</p>
                  <p className="mt-1 text-[0.65rem] font-semibold text-[var(--erp-ink)]">
                    {item.temp}°
                  </p>
                  <Icon className="mx-auto mt-1 size-4 text-[var(--brand-secondary)]" />
                  <p className="mt-1 text-[0.55rem] text-[var(--erp-muted)]">{item.note}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function BlockUsage() {
  return (
    <section className="erp-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[var(--erp-ink)]">Block Usage</h2>
          <p className="mt-1 text-[0.68rem] font-medium text-[var(--erp-muted)]">Greenhouse A-12</p>
        </div>
        <AlertTriangle className="size-5 text-destructive" />
      </div>

      <div className="mt-4 flex items-center justify-between text-[0.68rem] font-semibold">
        <span>Sector 4 North</span>
        <span>78%</span>
      </div>
      <div className="mt-2 h-2 border border-[var(--erp-border)] bg-[var(--erp-track)]">
        <div className="h-full w-[78%] bg-primary" />
      </div>
      <button
        type="button"
        className="mt-4 flex h-9 w-full items-center justify-center gap-2 border border-primary bg-white text-[0.7rem] font-semibold text-primary"
      >
        Adjust Allocations
        <ArrowRight className="size-3.5" />
      </button>
    </section>
  );
}

function ActivePrograms() {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-bold text-[var(--erp-ink)]">Active Programs</h2>
        <Link
          href="/dashboard/crop-data"
          className="text-[0.68rem] font-semibold text-[var(--brand-secondary)]"
        >
          View All ↗
        </Link>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {programs.map((program) => {
          const Icon = program.icon;
          const isBlue = program.tone === "blue";

          return (
            <article key={program.name} className="erp-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center border",
                      isBlue
                        ? "border-[var(--erp-info-muted)] bg-[var(--erp-info-muted)] text-[var(--brand-secondary)]"
                        : "border-[var(--erp-green-muted)] bg-[var(--erp-green-muted)] text-primary"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-[var(--erp-ink)]">
                      {program.name}
                    </h3>
                    <p className="mt-1 text-[0.68rem] font-medium text-[var(--erp-muted)]">
                      {program.location}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 px-2 py-1 text-[0.55rem] font-bold",
                    isBlue
                      ? "bg-[var(--erp-info-muted)] text-[var(--brand-secondary)]"
                      : "bg-[var(--erp-green-muted)] text-primary"
                  )}
                >
                  {program.badge}
                </span>
              </div>

              <div className="mt-5">
                <div className="mb-1 flex items-center justify-between text-[0.58rem] font-semibold text-[var(--erp-muted)]">
                  <span>Program Progress</span>
                  <span>{program.progress}</span>
                </div>
                <div className="h-1.5 bg-[var(--erp-track)]">
                  <div
                    className={cn("h-full", isBlue ? "bg-[var(--brand-secondary)]" : "bg-primary")}
                    style={{ width: program.progress }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex -space-x-2">
                  <span className="size-4 rounded-full bg-[var(--erp-avatar-a)] ring-1 ring-white" />
                  <span className="size-4 rounded-full bg-[var(--erp-avatar-b)] ring-1 ring-white" />
                </div>
                <p className="text-[0.65rem] font-semibold text-[var(--erp-muted)]">
                  ETA: <span className="text-[var(--erp-ink)]">{program.eta}</span>
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function HarvestForecast() {
  return (
    <section className="erp-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[var(--erp-ink)]">Harvest Forecast</h2>
        <TrendingUp className="size-4 text-[var(--erp-ink)]" />
      </div>

      <div className="mt-4 flex h-28 items-end gap-3 border-b border-[var(--erp-border)] px-2 pb-3">
        {forecastBars.map((bar) => (
          <div key={bar.label} className="flex flex-1 flex-col items-center justify-end gap-1">
            {bar.active && (
              <span className="bg-[var(--erp-ink)] px-1 py-0.5 text-[0.5rem] font-bold text-white">
                Current
              </span>
            )}
            <div
              className={cn("w-full bg-[var(--erp-chart)]", bar.active && "bg-primary")}
              style={{ height: bar.value }}
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="erp-kicker">Predicted Total</p>
          <p className="mt-1 text-base font-bold text-primary">84.2 Tons</p>
        </div>
        <div className="text-right">
          <p className="erp-kicker">Vs Last Year</p>
          <p className="mt-1 text-sm font-bold text-[var(--brand-secondary)]">+12.4%</p>
        </div>
      </div>
    </section>
  );
}

function RecentTasks() {
  return (
    <section className="erp-card overflow-hidden">
      <div className="flex h-11 items-center justify-between border-b border-[var(--erp-border)] px-4">
        <h2 className="text-sm font-bold text-[var(--erp-ink)]">Recent & Upcoming Tasks</h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Filter tasks"
            className="flex size-7 items-center justify-center border border-[var(--erp-border)] bg-white text-[var(--erp-icon)]"
          >
            <Filter className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Refresh tasks"
            className="flex size-7 items-center justify-center border border-[var(--erp-border)] bg-white text-[var(--erp-icon)]"
          >
            <RefreshCcw className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-left text-[0.68rem]">
          <thead>
            <tr className="border-b border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.58rem] uppercase tracking-normal text-[var(--erp-muted)]">
              <th className="px-4 py-2 font-semibold">Task Details</th>
              <th className="px-3 py-2 font-semibold">Block</th>
              <th className="px-3 py-2 font-semibold">Deadline</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 text-right font-semibold">Priority</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.task}
                className={cn(
                  "border-b border-[var(--erp-border)] last:border-b-0",
                  task.alert && "bg-[var(--erp-danger-row)]"
                )}
              >
                <td className="px-4 py-3 font-medium text-[var(--erp-ink)]">
                  <div className="flex items-center gap-2">
                    {task.alert ? (
                      <AlertTriangle className="size-3.5 shrink-0 text-destructive" />
                    ) : (
                      <span className="size-3.5 shrink-0 border border-[var(--erp-border-strong)]" />
                    )}
                    <span>{task.task}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-[var(--erp-ink)]">{task.block}</td>
                <td
                  className={cn(
                    "px-3 py-3 font-medium",
                    task.alert ? "text-destructive" : "text-[var(--erp-ink)]"
                  )}
                >
                  {task.deadline}
                </td>
                <td className="px-3 py-3">
                  <span className={cn("px-2 py-1 text-[0.55rem] font-bold", task.statusTone)}>
                    {task.status}
                  </span>
                </td>
                <td className={cn("px-3 py-3 text-right font-semibold", task.priorityTone)}>
                  {task.priority}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end px-4 py-3">
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 bg-primary px-3 text-[0.68rem] font-semibold text-primary-foreground"
        >
          <span className="text-sm leading-none">+</span>
          Create Task
        </button>
      </div>
    </section>
  );
}

function FieldStatusMap() {
  return (
    <section className="erp-card overflow-hidden">
      <div className="flex h-11 items-center justify-between border-b border-[var(--erp-border)] px-4">
        <h2 className="text-sm font-bold text-[var(--erp-ink)]">Field Status Map</h2>
        <RefreshCcw className="size-4 text-primary" />
      </div>

      <div className="p-3">
        <div className="relative h-44 overflow-hidden border border-[var(--erp-border)] bg-[var(--erp-field-base)]">
          <div className="absolute inset-0 bg-[linear-gradient(155deg,rgba(255,255,255,0.08)_0_8%,transparent_8%_16%),repeating-linear-gradient(150deg,var(--erp-field-row)_0_0.22rem,var(--erp-field-base)_0.22rem_0.7rem)]" />
          <div className="absolute -bottom-8 left-0 h-24 w-48 rotate-[-23deg] bg-[var(--erp-road)] shadow-[0_0_0_0.18rem_var(--erp-road-edge)]" />
          <div className="absolute -bottom-4 right-8 h-20 w-40 rotate-[34deg] bg-[var(--erp-road)] shadow-[0_0_0_0.18rem_var(--erp-road-edge)]" />
          <div className="absolute left-[58%] top-[45%] size-1.5 rounded-full bg-[var(--brand-secondary)] ring-2 ring-white/60" />
          <div className="absolute left-3 top-4 bg-white px-2 py-1 text-[0.55rem] font-bold text-[var(--erp-ink)]">
            BLOCK A-1 OPTIMAL
          </div>
          <div className="absolute left-3 top-12 bg-destructive px-2 py-1 text-[0.55rem] font-bold text-white">
            BLOCK C-2 ALERT
          </div>
        </div>

        <button
          type="button"
          className="mt-3 flex h-9 w-full items-center justify-center gap-2 border border-[var(--erp-border)] bg-white text-[0.68rem] font-semibold text-[var(--erp-ink)]"
        >
          <Sprout className="size-3.5 text-primary" />
          Launch Interactive Map
        </button>
      </div>
    </section>
  );
}
