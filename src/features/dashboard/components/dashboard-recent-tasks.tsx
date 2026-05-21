import Link from "next/link";
import { Clock, CheckCircle2 } from "lucide-react";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPEN_STATUSES = ["Pending", "InProgress"] as const;

const STATUS_LABEL: Record<string, string> = {
  Pending: "Pending",
  InProgress: "In Progress",
};

type Props = {
  farmId: string;
};

function formatDueDate(date: Date | null): string {
  if (!date) return "No due date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export async function DashboardRecentTasks({ farmId }: Props) {
  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
    })
    .from(tasks)
    .where(and(eq(tasks.farmId, farmId), inArray(tasks.status, [...OPEN_STATUSES])))
    .orderBy(asc(tasks.dueDate))
    .limit(8);

  return (
    <Card className="p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        <h2 className="text-h4 font-bold text-foreground">Recent &amp; Upcoming Tasks</h2>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          compact
          icon={CheckCircle2}
          title="All caught up!"
          description="There are no open or in-progress tasks scheduled for this farm."
          className="border-muted bg-muted/20"
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {rows.map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{task.title}</p>
                <p className="text-caption text-muted-foreground">{formatDueDate(task.dueDate)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className="text-caption">
                  {task.priority}
                </Badge>
                <Badge
                  className={cn(
                    "text-caption",
                    task.status === "InProgress"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {STATUS_LABEL[task.status] ?? task.status}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}

      {rows.length > 0 && (
        <div className="mt-4 flex justify-end">
          <Link href="/dashboard/tasks">
            <Button variant="outline" size="sm">
              View all tasks
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
