import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { tasks, taskChecklistItems, taskTemplates, taskTemplateChecklistItems } from "@/db/schema";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  Task,
  CreateTaskTemplateInput,
  UpdateTaskTemplateInput,
  TaskTemplate,
} from "./schema";
import { getTaskById, getTemplateById } from "./queries";

export async function createTask(farmId: string, input: CreateTaskInput): Promise<Task | null> {
  const [row] = await db
    .insert(tasks)
    .values({
      farmId,
      title: input.title,
      description: input.description ?? null,
      assignedTo: input.assignedTo ?? null,
      priority: input.priority ?? "Medium",
      status: input.status ?? "Pending",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      estimatedHours: input.estimatedHours ?? null,
      cropId: input.cropId ?? null,
      blockMasterId: input.blockMasterId ?? null,
      locationType: input.locationType ?? null,
      associatedTo: input.associatedTo ?? null,
      repeatRule: input.repeatRule ?? null,
      color: input.color ?? null,
      notes: input.notes ?? null,
    })
    .returning();

  if (!row) return null;

  if (input.checklistItems && input.checklistItems.length > 0) {
    await db.insert(taskChecklistItems).values(
      input.checklistItems.map((item, idx) => ({
        taskId: row.id,
        text: item.text,
        completed: false,
        order: idx,
      }))
    );
  }

  return getTaskById(row.id, farmId);
}

export async function updateTask(
  id: string,
  farmId: string,
  input: UpdateTaskInput
): Promise<Task | null> {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.dueDate !== undefined)
    updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  if (input.startDate !== undefined)
    updateData.startDate = input.startDate ? new Date(input.startDate) : null;
  if (input.estimatedHours !== undefined) updateData.estimatedHours = input.estimatedHours;
  if (input.cropId !== undefined) updateData.cropId = input.cropId;
  if (input.blockMasterId !== undefined) updateData.blockMasterId = input.blockMasterId;
  if (input.locationType !== undefined) updateData.locationType = input.locationType;
  if (input.associatedTo !== undefined) updateData.associatedTo = input.associatedTo;
  if (input.repeatRule !== undefined) updateData.repeatRule = input.repeatRule;
  if (input.color !== undefined) updateData.color = input.color;
  if (input.notes !== undefined) updateData.notes = input.notes;

  await db
    .update(tasks)
    .set(updateData)
    .where(and(eq(tasks.id, id), eq(tasks.farmId, farmId)));

  if (input.checklistItems !== undefined) {
    await db.delete(taskChecklistItems).where(eq(taskChecklistItems.taskId, id));
    if (input.checklistItems.length > 0) {
      await db.insert(taskChecklistItems).values(
        input.checklistItems.map((item, idx) => ({
          taskId: id,
          text: item.text,
          completed: false,
          order: idx,
        }))
      );
    }
  }

  return getTaskById(id, farmId);
}

export async function updateTaskStatus(
  id: string,
  farmId: string,
  status: Task["status"]
): Promise<Task | null> {
  await db
    .update(tasks)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.farmId, farmId)));

  return getTaskById(id, farmId);
}

export async function deleteTask(id: string, farmId: string): Promise<void> {
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.farmId, farmId)));
}

export async function toggleChecklistItem(itemId: string, completed: boolean): Promise<void> {
  await db.update(taskChecklistItems).set({ completed }).where(eq(taskChecklistItems.id, itemId));
}

export async function createTaskTemplate(
  farmId: string,
  input: CreateTaskTemplateInput
): Promise<TaskTemplate | null> {
  const [row] = await db
    .insert(taskTemplates)
    .values({
      farmId,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? "Medium",
      estimatedHours: input.estimatedHours ?? null,
    })
    .returning();

  if (!row) return null;

  if (input.checklistItems && input.checklistItems.length > 0) {
    await db.insert(taskTemplateChecklistItems).values(
      input.checklistItems.map((item, idx) => ({
        templateId: row.id,
        text: item.text,
        order: idx,
      }))
    );
  }

  return getTemplateById(row.id, farmId);
}

export async function updateTaskTemplate(
  id: string,
  farmId: string,
  input: UpdateTaskTemplateInput
): Promise<TaskTemplate | null> {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.estimatedHours !== undefined) updateData.estimatedHours = input.estimatedHours;

  await db
    .update(taskTemplates)
    .set(updateData)
    .where(and(eq(taskTemplates.id, id), eq(taskTemplates.farmId, farmId)));

  if (input.checklistItems !== undefined) {
    await db
      .delete(taskTemplateChecklistItems)
      .where(eq(taskTemplateChecklistItems.templateId, id));
    if (input.checklistItems.length > 0) {
      await db.insert(taskTemplateChecklistItems).values(
        input.checklistItems.map((item, idx) => ({
          templateId: id,
          text: item.text,
          order: idx,
        }))
      );
    }
  }

  return getTemplateById(id, farmId);
}

export async function deleteTaskTemplate(id: string, farmId: string): Promise<void> {
  await db
    .delete(taskTemplates)
    .where(and(eq(taskTemplates.id, id), eq(taskTemplates.farmId, farmId)));
}

export async function createTaskFromTemplate(
  templateId: string,
  farmId: string,
  overrides: Partial<CreateTaskInput>
): Promise<Task | null> {
  const template = await getTemplateById(templateId, farmId);
  if (!template) return null;

  const [row] = await db
    .insert(tasks)
    .values({
      farmId,
      title: overrides.title ?? template.title,
      description: overrides.description ?? template.description ?? null,
      assignedTo: overrides.assignedTo ?? null,
      priority: overrides.priority ?? template.priority,
      status: overrides.status ?? "Pending",
      dueDate: overrides.dueDate ? new Date(overrides.dueDate) : null,
      startDate: overrides.startDate ? new Date(overrides.startDate) : null,
      estimatedHours: overrides.estimatedHours ?? template.estimatedHours ?? null,
      notes: overrides.notes ?? null,
    })
    .returning();

  if (!row) return null;

  const checklistSource = overrides.checklistItems
    ? overrides.checklistItems
    : template.checklistItems.map((c) => ({ text: c.text }));

  if (checklistSource.length > 0) {
    await db.insert(taskChecklistItems).values(
      checklistSource.map((item, idx) => ({
        taskId: row.id,
        text: item.text,
        completed: false,
        order: idx,
      }))
    );
  }

  return getTaskById(row.id, farmId);
}
