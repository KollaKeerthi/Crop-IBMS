import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function NotificationsPage() {
  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Task assignments, reminders, and farm updates.</p>
      </div>
      <Card className="p-8 flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-muted p-4">
          <Bell className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-medium">No notifications yet</p>
        <p className="text-sm text-muted-foreground">
          When you receive task assignments, due-date reminders, or team updates they will appear here.
        </p>
      </Card>
    </div>
  );
}
