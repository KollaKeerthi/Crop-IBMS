import { z } from "zod";

export const TaskPriorityEnum = z.enum(["Low", "Medium", "High", "Urgent"]);
export const TaskStatusEnum = z.enum(["Pending", "InProgress", "Completed", "Cancelled"]);

export const TaskChecklistItemSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  completed: z.boolean(),
  order: z.number(),
});

const OptionalUuidSchema = z.preprocess(
  (value) => (value === "" || value === "none" || value === "unassigned" ? undefined : value),
  z.string().uuid().optional()
);

const NullableUuidSchema = z.preprocess(
  (value) => (value === "" || value === "none" || value === "unassigned" ? null : value),
  z.string().uuid().nullable().optional()
);

export const CreateTaskInputSchema = z.object({
  farmId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  assignedTo: OptionalUuidSchema,
  priority: TaskPriorityEnum.default("Medium"),
  status: TaskStatusEnum.default("Pending"),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  estimatedHours: z.number().optional(),
  cropId: OptionalUuidSchema,
  blockMasterId: OptionalUuidSchema,
  locationType: z.string().optional(),
  associatedTo: z.string().optional(),
  repeatRule: z.string().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
  checklistItems: z.array(z.object({ text: z.string() })).optional(),
});

export const UpdateTaskInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  assignedTo: NullableUuidSchema,
  priority: TaskPriorityEnum.optional(),
  status: TaskStatusEnum.optional(),
  dueDate: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  cropId: NullableUuidSchema,
  blockMasterId: NullableUuidSchema,
  locationType: z.string().optional().nullable(),
  associatedTo: z.string().optional().nullable(),
  repeatRule: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  checklistItems: z.array(z.object({ text: z.string() })).optional(),
});

export const UpdateTaskStatusInputSchema = z.object({
  status: TaskStatusEnum,
});

export const TaskSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  assignedTo: z.string().nullable(),
  priority: TaskPriorityEnum,
  status: TaskStatusEnum,
  dueDate: z.string().nullable(),
  startDate: z.string().nullable(),
  estimatedHours: z.number().nullable(),
  cropId: z.string().uuid().nullable(),
  blockMasterId: z.string().uuid().nullable(),
  locationType: z.string().nullable(),
  associatedTo: z.string().nullable(),
  repeatRule: z.string().nullable(),
  color: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  checklistItems: z.array(TaskChecklistItemSchema),
});

export const TasksResponseSchema = z.array(TaskSchema);

export const CreateTaskTemplateInputSchema = z.object({
  farmId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  priority: TaskPriorityEnum.default("Medium"),
  estimatedHours: z.number().optional(),
  checklistItems: z.array(z.object({ text: z.string() })).optional(),
});

export const UpdateTaskTemplateInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  priority: TaskPriorityEnum.optional(),
  estimatedHours: z.number().optional().nullable(),
  checklistItems: z.array(z.object({ text: z.string() })).optional(),
});

export const TaskTemplateSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  priority: TaskPriorityEnum,
  estimatedHours: z.number().nullable(),
  checklistItems: z.array(z.object({ id: z.string().uuid(), text: z.string(), order: z.number() })),
});

export const TaskTemplatesResponseSchema = z.array(TaskTemplateSchema);

export type TaskPriority = z.infer<typeof TaskPriorityEnum>;
export type TaskStatus = z.infer<typeof TaskStatusEnum>;
export type TaskChecklistItem = z.infer<typeof TaskChecklistItemSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>;
export type UpdateTaskStatusInput = z.infer<typeof UpdateTaskStatusInputSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type CreateTaskTemplateInput = z.infer<typeof CreateTaskTemplateInputSchema>;
export type UpdateTaskTemplateInput = z.infer<typeof UpdateTaskTemplateInputSchema>;
export type TaskTemplate = z.infer<typeof TaskTemplateSchema>;
