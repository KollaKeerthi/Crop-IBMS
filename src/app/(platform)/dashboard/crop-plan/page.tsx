import Link from "next/link";
import { Activity, Clock, Grid, Layers, ListChecks, Sunrise } from "lucide-react";

const items = [
  {
    title: "Seasons",
    description: "Track and manage growing seasons for your farm.",
    href: "/dashboard/crop-plan/seasons",
    icon: Sunrise,
  },
  {
    title: "Density Master",
    description: "Define planting density templates for beds and blocks.",
    href: "/dashboard/crop-plan/density-master",
    icon: Grid,
  },
  {
    title: "Block Master",
    description: "Configure field and greenhouse block layouts.",
    href: "/dashboard/crop-plan/block-master",
    icon: Layers,
  },
  {
    title: "Activities",
    description: "Create and review crop planning activities.",
    href: "/dashboard/crop-plan/activities",
    icon: Activity,
  },
  {
    title: "Active Time",
    description: "Manage active time templates and timings.",
    href: "/dashboard/crop-plan/active-time",
    icon: Clock,
  },
  {
    title: "Crop Info",
    description: "View crop reference data and varieties.",
    href: "/dashboard/crop-information",
    icon: ListChecks,
  },
];

export default function CropPlanPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Crop Planning</h1>
        <p className="text-sm text-muted-foreground">
          One place to manage your crop planning setup, growing seasons, activity templates,
          block masters, and more.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-lg border border-border bg-card p-6 transition hover:border-primary/50 hover:bg-secondary"
          >
            <div className="flex items-center gap-3">
              <item.icon className="size-6 text-primary" />
              <div>
                <h2 className="text-lg font-semibold transition group-hover:text-primary">{item.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
