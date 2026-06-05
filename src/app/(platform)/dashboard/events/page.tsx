import { EventsView } from "@/features/events";

export default function EventsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Events</h1>
        <p className="text-sm text-muted-foreground">Manage farm events and calendar.</p>
      </div>
      <EventsView />
    </div>
  );
}
