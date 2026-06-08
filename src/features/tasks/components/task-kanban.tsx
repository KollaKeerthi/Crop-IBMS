"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { formatDateDisplay } from "@/lib/format";
import { TaskDetailDialog } from "./task-detail-dialog";
import type { Task } from "../schema";
import { useTeamMembers } from "@/features/team/hooks";

type Props = {
  tasks: Task[];
  farmId: string;
};

type Column = {
  priority: Task["priority"];
  label: string;
  aliases?: Task["priority"][];
};

const COLUMNS: Column[] = [
  { priority: "High", label: "High Priority", aliases: ["Urgent"] },
  { priority: "Medium", label: "Medium Priority" },
  { priority: "Low", label: "Low Priority" },
];

function BoardTaskCard({ task, farmId }: { task: Task; farmId: string }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const { data: members = [] } = useTeamMembers(farmId);
  const member = members.find((m) => m.userId === task.assignedTo);
  const assigneeDisplay = member
    ? (member.name ?? member.email)
    : task.assignedTo
      ? `${task.assignedTo.slice(0, 8)}...`
      : "unassigned";

  return (
    <>
      <button
        type="button"
        className="w-full rounded-lg border bg-background p-4 text-left shadow-sm transition-shadow hover:shadow-md"
        onClick={() => setDetailOpen(true)}
      >
        <div className="mb-5 flex items-center gap-3">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: task.color ?? "#048FC2" }}
          />
          <span className="text-base font-semibold">{task.title}</span>
        </div>
        {task.dueDate && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>Due: {formatDateDisplay(task.dueDate)}</span>
          </div>
        )}
        <div className="border-t pt-3 text-sm italic text-muted-foreground">{assigneeDisplay}</div>
      </button>

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

export function TaskKanban({ tasks, farmId }: Props) {
  const visibleTasks = tasks.filter((task) => task.status !== "Cancelled");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {COLUMNS.map((column) => {
        const priorities = [column.priority, ...(column.aliases ?? [])];
        const columnTasks = visibleTasks.filter((task) => priorities.includes(task.priority));
        return (
          <div key={column.priority} className="min-h-[420px] rounded-xl border bg-muted/10 p-4">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">{column.label}</h2>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                {columnTasks.length}
              </span>
            </div>
            <div className="space-y-4">
              {columnTasks.map((task) => (
                <BoardTaskCard key={task.id} task={task} farmId={farmId} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
