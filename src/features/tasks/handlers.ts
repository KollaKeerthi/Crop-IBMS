import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { listTasks, getTaskById, listTaskTemplates, getTemplateById } from "./queries";
import {
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  toggleChecklistItem,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
  createTaskFromTemplate,
} from "./mutations";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  Task,
  CreateTaskTemplateInput,
  UpdateTaskTemplateInput,
  TaskTemplate,
} from "./schema";

type TaskFilters = { status?: string; assignedTo?: string; priority?: string };

export async function listTasksHandler(
  ctx: ApiContext,
  farmId: string,
  filters?: TaskFilters
): Promise<Task[]> {
  return listTasks(farmId, filters);
}

export async function getTaskHandler(ctx: ApiContext, id: string, farmId: string): Promise<Task> {
  const task = await getTaskById(id, farmId);
  if (!task) throw new ApiError(404, "not_found", "Task not found.");
  return task;
}

export async function createTaskHandler(
  ctx: ApiContext,
  farmId: string,
  input: CreateTaskInput
): Promise<Task> {
  const task = await createTask(farmId, input);
  if (!task) throw new ApiError(500, "internal_error", "Could not create task.");

  log.info({ userId: ctx.userId, farmId, taskId: task.id }, "tasks.created");
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "task.created",
    resource: task.id,
    resourceName: task.title,
    newData: {
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
    } as Record<string, unknown>,
  });

  return task;
}

export async function updateTaskHandler(
  ctx: ApiContext,
  id: string,
  farmId: string,
  input: UpdateTaskInput
): Promise<Task> {
  const existing = await getTaskById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Task not found.");

  const updated = await updateTask(id, farmId, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update task.");

  log.info({ userId: ctx.userId, taskId: id }, "tasks.updated");
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "task.updated",
    resource: id,
    resourceName: existing.title,
    previousData: {
      title: existing.title,
      status: existing.status,
      priority: existing.priority,
      dueDate: existing.dueDate,
      assignedTo: existing.assignedTo,
      notes: existing.notes,
    } as Record<string, unknown>,
    newData: {
      title: updated.title,
      status: updated.status,
      priority: updated.priority,
      dueDate: updated.dueDate,
      assignedTo: updated.assignedTo,
      notes: updated.notes,
    } as Record<string, unknown>,
  });

  return updated;
}

export async function updateTaskStatusHandler(
  ctx: ApiContext,
  id: string,
  farmId: string,
  status: Task["status"]
): Promise<Task> {
  const existing = await getTaskById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Task not found.");

  const updated = await updateTaskStatus(id, farmId, status);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update task status.");

  log.info({ userId: ctx.userId, taskId: id, status }, "tasks.status_changed");
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "task.status_changed",
    resource: id,
    resourceName: existing.title,
    previousData: { status: existing.status } as Record<string, unknown>,
    newData: { status } as Record<string, unknown>,
  });

  return updated;
}

export async function deleteTaskHandler(
  ctx: ApiContext,
  id: string,
  farmId: string
): Promise<void> {
  const existing = await getTaskById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Task not found.");

  await deleteTask(id, farmId);

  log.info({ userId: ctx.userId, taskId: id }, "tasks.deleted");
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "task.deleted",
    resource: id,
    resourceName: existing.title,
    previousData: {
      title: existing.title,
      status: existing.status,
      priority: existing.priority,
    } as Record<string, unknown>,
  });
}

export async function toggleChecklistItemHandler(
  ctx: ApiContext,
  itemId: string,
  completed: boolean
): Promise<void> {
  await toggleChecklistItem(itemId, completed);
}

export async function listTaskTemplatesHandler(
  ctx: ApiContext,
  farmId: string
): Promise<TaskTemplate[]> {
  return listTaskTemplates(farmId);
}

export async function createTaskTemplateHandler(
  ctx: ApiContext,
  farmId: string,
  input: CreateTaskTemplateInput
): Promise<TaskTemplate> {
  const template = await createTaskTemplate(farmId, input);
  if (!template) throw new ApiError(500, "internal_error", "Could not create task template.");

  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "task_template.created",
    resource: template.id,
    resourceName: template.title,
    newData: { title: template.title } as Record<string, unknown>,
  });
  return template;
}

export async function updateTaskTemplateHandler(
  ctx: ApiContext,
  id: string,
  farmId: string,
  input: UpdateTaskTemplateInput
): Promise<TaskTemplate> {
  const existing = await getTemplateById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Task template not found.");

  const updated = await updateTaskTemplate(id, farmId, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update task template.");

  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "task_template.updated",
    resource: id,
    resourceName: existing.title,
    previousData: { title: existing.title } as Record<string, unknown>,
    newData: { title: updated.title } as Record<string, unknown>,
  });
  return updated;
}

export async function deleteTaskTemplateHandler(
  ctx: ApiContext,
  id: string,
  farmId: string
): Promise<void> {
  const existing = await getTemplateById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Task template not found.");

  await deleteTaskTemplate(id, farmId);
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "task_template.deleted",
    resource: id,
    resourceName: existing.title,
    previousData: { title: existing.title } as Record<string, unknown>,
  });
}

export async function createTaskFromTemplateHandler(
  ctx: ApiContext,
  templateId: string,
  farmId: string,
  overrides: Partial<CreateTaskInput>
): Promise<Task> {
  const task = await createTaskFromTemplate(templateId, farmId, overrides);
  if (!task) throw new ApiError(404, "not_found", "Task template not found.");

  log.info(
    { userId: ctx.userId, farmId, taskId: task.id, templateId },
    "tasks.created_from_template"
  );
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "task.created",
    resource: task.id,
    resourceName: task.title,
    metadata: { templateId },
    newData: { title: task.title, status: task.status, priority: task.priority } as Record<
      string,
      unknown
    >,
  });

  return task;
}
