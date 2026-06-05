import { ActivitiesTable } from "@/features/activities";

export default function ActivitiesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Activities</h1>
        <p className="text-sm text-muted-foreground">Manage farm activities and task categories.</p>
      </div>
      <ActivitiesTable />
    </div>
  );
}
