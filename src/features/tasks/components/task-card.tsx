"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays, User, CheckSquare, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Task } from "../schema";
import { TaskDetailDialog } from "./task-detail-dialog";

type Props = {
  task: Task;
  farmId: string;
};

const PRIORITY_COLORS: Record<Task["priority"], string> = {
  Low: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  Medium: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  High: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  Urgent: "bg-red-100 text-red-700 hover:bg-red-100",
};

export function TaskCard({ task, farmId }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);

  const completedCount = task.checklistItems.filter((c) => c.completed).length;
  const totalCount = task.checklistItems.length;

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setDetailOpen(true)}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start gap-2">
            <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40 cursor-grab" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug line-clamp-2">{task.title}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={`text-xs px-1.5 py-0 ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {format(new Date(task.dueDate), "MMM d")}
              </span>
            )}
            {task.assignedTo && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate max-w-[60px] font-mono">
                  {task.assignedTo.slice(0, 8)}
                </span>
              </span>
            )}
            {totalCount > 0 && (
              <span className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                {completedCount}/{totalCount}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {detailOpen && (
        <TaskDetailDialog
          task={task}
          farmId={farmId}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </>
  );
}
