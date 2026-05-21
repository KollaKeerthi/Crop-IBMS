import { eq, and, asc, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { tasks, taskChecklistItems, taskTemplates, taskTemplateChecklistItems } from "@/db/schema";
import type { Task, TaskTemplate } from "./schema";

type TaskRow = typeof tasks.$inferSelect;
type ChecklistRow = typeof taskChecklistItems.$inferSelect;
type TemplateRow = typeof taskTemplates.$inferSelect;
type TemplateChecklistRow = typeof taskTemplateChecklistItems.$inferSelect;

function toTask(row: TaskRow, checklist: ChecklistRow[]): Task {
  return {
    id: row.id,
    farmId: row.farmId,
    title: row.title,
    description: row.description ?? null,
    assignedTo: row.assignedTo ?? null,
    priority: row.priority,
    status: row.status,
    dueDate: row.dueDate ? (row.dueDate.toISOString().split("T")[0] ?? null) : null,
    startDate: row.startDate ? (row.startDate.toISOString().split("T")[0] ?? null) : null,
    estimatedHours: row.estimatedHours ?? null,
    cropId: row.cropId ?? null,
    blockMasterId: row.blockMasterId ?? null,
    locationType: row.locationType ?? null,
    associatedTo: row.associatedTo ?? null,
    repeatRule: row.repeatRule ?? null,
    color: row.color ?? null,
    notes: row.notes ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    checklistItems: checklist
      .sort((a, b) => a.order - b.order)
      .map((c) => ({ id: c.id, text: c.text, completed: c.completed, order: c.order })),
  };
}

function toTemplate(row: TemplateRow, checklist: TemplateChecklistRow[]): TaskTemplate {
  return {
    id: row.id,
    farmId: row.farmId,
    title: row.title,
    description: row.description ?? null,
    priority: row.priority,
    estimatedHours: row.estimatedHours ?? null,
    checklistItems: checklist
      .sort((a, b) => a.order - b.order)
      .map((c) => ({ id: c.id, text: c.text, order: c.order })),
  };
}

type TaskFilters = {
  status?: string;
  assignedTo?: string;
  priority?: string;
};

export async function listTasks(farmId: string, filters?: TaskFilters): Promise<Task[]> {
  const conditions = [eq(tasks.farmId, farmId)];

  if (filters?.status) {
    conditions.push(eq(tasks.status, filters.status as Task["status"]));
  }
  if (filters?.assignedTo) {
    conditions.push(eq(tasks.assignedTo, filters.assignedTo));
  }
  if (filters?.priority) {
    conditions.push(eq(tasks.priority, filters.priority as Task["priority"]));
  }

  const taskRows = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(asc(tasks.dueDate), desc(tasks.createdAt));

  if (taskRows.length === 0) return [];

  const taskIds = taskRows.map((t) => t.id);
  const allChecklist = await db
    .select()
    .from(taskChecklistItems)
    .where(inArray(taskChecklistItems.taskId, taskIds));

  return taskRows.map((row) => {
    const checklist = allChecklist.filter((c) => c.taskId === row.id);
    return toTask(row, checklist);
  });
}

export async function getTaskById(id: string, farmId: string): Promise<Task | null> {
  const [row] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.farmId, farmId)));

  if (!row) return null;

  const checklist = await db
    .select()
    .from(taskChecklistItems)
    .where(eq(taskChecklistItems.taskId, id))
    .orderBy(asc(taskChecklistItems.order));

  return toTask(row, checklist);
}

export async function listTaskTemplates(farmId: string): Promise<TaskTemplate[]> {
  const templateRows = await db
    .select()
    .from(taskTemplates)
    .where(eq(taskTemplates.farmId, farmId))
    .orderBy(asc(taskTemplates.title));

  if (templateRows.length === 0) return [];

  const templateIds = templateRows.map((t) => t.id);
  const allChecklist = await db
    .select()
    .from(taskTemplateChecklistItems)
    .where(inArray(taskTemplateChecklistItems.templateId, templateIds));

  return templateRows.map((row) => {
    const checklist = allChecklist.filter((c) => c.templateId === row.id);
    return toTemplate(row, checklist);
  });
}

export async function getTemplateById(id: string, farmId: string): Promise<TaskTemplate | null> {
  const [row] = await db
    .select()
    .from(taskTemplates)
    .where(and(eq(taskTemplates.id, id), eq(taskTemplates.farmId, farmId)));

  if (!row) return null;

  const checklist = await db
    .select()
    .from(taskTemplateChecklistItems)
    .where(eq(taskTemplateChecklistItems.templateId, id))
    .orderBy(asc(taskTemplateChecklistItems.order));

  return toTemplate(row, checklist);
}
