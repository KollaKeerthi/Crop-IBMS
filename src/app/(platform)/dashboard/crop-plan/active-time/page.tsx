import { ActiveTimeTable } from "@/features/active-time";

export default function ActiveTimePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Active Time</h1>
        <p className="text-sm text-muted-foreground">
          Manage crop lifecycle templates with scheduled activities.
        </p>
      </div>
      <ActiveTimeTable />
    </div>
  );
}
