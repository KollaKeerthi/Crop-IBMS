"use client";

import { TaskCard } from "./task-card";
import type { Task } from "../schema";

type Props = {
  tasks: Task[];
  farmId: string;
};

type Column = {
  status: "Pending" | "InProgress" | "Completed";
  label: string;
  accent: string;
};

const COLUMNS: Column[] = [
  { status: "Pending", label: "Pending", accent: "bg-yellow-400" },
  { status: "InProgress", label: "In Progress", accent: "bg-blue-500" },
  { status: "Completed", label: "Completed", accent: "bg-green-500" },
];

export function TaskKanban({ tasks, farmId }: Props) {
  const visibleTasks = tasks.filter((t) => t.status !== "Cancelled");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {COLUMNS.map((column) => {
        const columnTasks = visibleTasks.filter((t) => t.status === column.status);
        return (
          <div key={column.status} className="min-h-105 rounded-xl border bg-muted/10 p-4">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${column.accent}`} />
                <h2 className="text-sm font-semibold text-muted-foreground">{column.label}</h2>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                {columnTasks.length}
              </span>
            </div>
            <div className="space-y-3">
              {columnTasks.map((task) => (
                <TaskCard key={task.id} task={task} farmId={farmId} />
              ))}
              {columnTasks.length === 0 && (
                <p className="py-8 text-center text-xs italic text-muted-foreground">No tasks</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
