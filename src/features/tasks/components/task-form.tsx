"use client";

import { useEffect, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import {
  CreateTaskInputSchema,
  UpdateTaskInputSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type Task,
} from "../schema";
import { useCreateTask, useUpdateTask } from "../hooks";
import { useBlockMaster } from "@/features/block-master/hooks";
import { useCrops } from "@/features/crops/hooks";
import { useTeamMembers } from "@/features/team/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  farmId: string;
  task?: Task;
  defaultStatus?: Task["status"];
  onSuccess?: () => void;
};

type FormValues = CreateTaskInput & {
  checklistItems: { text: string }[];
};

const DEFAULT_TASK_COLOR = "#048FC2";
const REPEAT_OPTIONS = [
  { value: "none", label: "Do not Repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;
const STATUS_LABELS: Partial<Record<Task["status"], string>> = {
  Pending: "Open",
  InProgress: "In Progress",
  Completed: "Completed",
};
const REPEAT_LABELS = Object.fromEntries(
  REPEAT_OPTIONS.map((option) => [option.value, option.label])
) as Record<string, string>;

function visibleStatus(status?: Task["status"] | null): Task["status"] {
  if (status === "Pending" || status === "InProgress" || status === "Completed") return status;
  return "Pending";
}

function visibleRepeat(repeatRule?: string | null) {
  return REPEAT_OPTIONS.some((option) => option.value === repeatRule) ? repeatRule! : "daily";
}

function normalizeCropName(value: string) {
  return value.trim().toLowerCase();
}

export function TaskForm({ farmId, task, defaultStatus, onSuccess }: Props) {
  const isEdit = !!task;
  const { data: blocks = [] } = useBlockMaster(farmId);
  const { data: crops = [] } = useCrops();
  const { data: members = [] } = useTeamMembers(farmId);

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateTaskInputSchema) as Resolver<FormValues>,
    defaultValues: {
      farmId,
      title: task?.title ?? "",
      description: task?.description ?? "",
      assignedTo: task?.assignedTo ?? "",
      priority: task?.priority ?? "Medium",
      status: visibleStatus(task?.status ?? defaultStatus),
      dueDate: task?.dueDate ?? "",
      startDate: task?.startDate ?? "",
      estimatedHours: task?.estimatedHours ?? undefined,
      cropId: task?.cropId ?? "",
      blockMasterId: task?.blockMasterId ?? "",
      locationType: task?.locationType ?? "Greenhouse",
      associatedTo: task?.associatedTo ?? "",
      repeatRule: visibleRepeat(task?.repeatRule),
      color: task?.color ?? DEFAULT_TASK_COLOR,
      notes: task?.notes ?? "",
      checklistItems: task?.checklistItems.map((c) => ({ text: c.text })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "checklistItems",
  });

  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const locationType = form.watch("locationType");
  const filteredBlocks = useMemo(() => {
    if (locationType === "Field") return blocks.filter((block) => block.fieldId);
    if (locationType === "Greenhouse") return blocks.filter((block) => block.greenhouseId);
    return blocks;
  }, [blocks, locationType]);
  const blockLabels = useMemo(
    () =>
      Object.fromEntries(
        filteredBlocks.map((block) => [block.id, block.subBlockName ?? block.blockName])
      ),
    [filteredBlocks]
  );
  const cropLabels = useMemo(
    () => Object.fromEntries(crops.map((crop) => [crop.id, crop.name])),
    [crops]
  );
  const assigneeLabels = useMemo(
    () => Object.fromEntries(members.map((member) => [member.userId, member.name ?? member.email])),
    [members]
  );

  function suitableCropId(crop: string | { cropId: string }) {
    return typeof crop === "string" ? crop : crop.cropId;
  }

  function cropForBlock(blockId: string | undefined) {
    if (!blockId) return "";
    const block = blocks.find((item) => item.id === blockId);
    if (!block) return "";

    const suitableCropIds = (block.suitableCrops ?? []).map(suitableCropId);
    const directCropId = suitableCropIds.find((cropId) => crops.some((crop) => crop.id === cropId));
    if (directCropId) return directCropId;

    const cropLine = block.notes
      ?.split("\n")
      .find((line) => line.trim().toLowerCase().startsWith("crops:"));
    const cropNames =
      cropLine
        ?.replace(/^crops:/i, "")
        .split(",")
        .map(normalizeCropName)
        .filter(Boolean) ?? [];
    const matchedCrop = crops.find((crop) => {
      const names = [crop.name, crop.shortName ?? ""].map(normalizeCropName);
      return cropNames.some((name) => names.includes(name));
    });

    return matchedCrop?.id ?? "";
  }

  useEffect(() => {
    const blockId = form.getValues("blockMasterId");
    const cropId = form.getValues("cropId");
    if (!blockId || cropId) return;

    const inferredCropId = cropForBlock(blockId);
    if (inferredCropId) {
      form.setValue("cropId", inferredCropId, { shouldDirty: true, shouldValidate: true });
    }
  }, [blocks, crops, form]);

  function clean(values: FormValues): CreateTaskInput {
    return {
      ...values,
      assignedTo: values.assignedTo || undefined,
      cropId: values.cropId || undefined,
      blockMasterId: values.blockMasterId || undefined,
      associatedTo: values.associatedTo || undefined,
      repeatRule: values.repeatRule || "none",
      color: values.color || DEFAULT_TASK_COLOR,
      description: values.description || undefined,
      dueDate: values.dueDate || undefined,
      startDate: values.startDate || undefined,
      notes: values.notes || undefined,
      checklistItems: values.checklistItems.filter((item) => item.text.trim()),
    };
  }

  async function onSubmit(values: FormValues) {
    try {
      const payload = clean(values);
      if (isEdit && task) {
        const updateInput: UpdateTaskInput = {
          title: payload.title,
          description: payload.description ?? null,
          assignedTo: payload.assignedTo ?? null,
          priority: payload.priority,
          status: payload.status,
          dueDate: payload.dueDate ?? null,
          startDate: payload.startDate ?? null,
          estimatedHours: payload.estimatedHours ?? null,
          cropId: payload.cropId ?? null,
          blockMasterId: payload.blockMasterId ?? null,
          locationType: payload.locationType ?? null,
          associatedTo: payload.associatedTo ?? null,
          repeatRule: payload.repeatRule ?? null,
          color: payload.color ?? null,
          notes: payload.notes ?? null,
          checklistItems: payload.checklistItems,
        };
        await updateMutation.mutateAsync({ farmId, id: task.id, input: updateInput });
        toast.success("Task updated");
      } else {
        await createMutation.mutateAsync({ ...payload, farmId });
        toast.success("Task created");
        form.reset({
          farmId,
          title: "",
          description: "",
          assignedTo: "",
          priority: "Medium",
          status: visibleStatus(defaultStatus),
          dueDate: "",
          startDate: "",
          estimatedHours: undefined,
          cropId: "",
          blockMasterId: "",
          locationType: "Greenhouse",
          associatedTo: "",
          repeatRule: "none",
          color: DEFAULT_TASK_COLOR,
          notes: "",
          checklistItems: [],
        });
      }
      onSuccess?.();
    } catch (err) {
      if (err instanceof ApiError) {
        form.setError("root", { message: err.message });
      } else {
        form.setError("root", { message: "Something went wrong. Please try again." });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Title <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Example: Monitor soil moisture" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  rows={3}
                  placeholder="What needs to be done?"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1.35fr]">
          <FormField
            control={form.control}
            name="locationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? "Greenhouse"}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Greenhouse">Greenhouse</SelectItem>
                    <SelectItem value="Field">Field</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="blockMasterId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sub Block</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const blockId = !value || value === "none" ? "" : value;
                    field.onChange(blockId);
                    form.setValue("cropId", cropForBlock(blockId), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Sub Block">
                        {(value) => blockLabels[String(value)] ?? "Select Sub Block"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Select Sub Block</SelectItem>
                    {filteredBlocks.map((block) => (
                      <SelectItem key={block.id} value={block.id}>
                        {block.subBlockName ?? block.blockName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cropId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crop</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auto-filled or select crop">
                        {(value) => cropLabels[String(value)] ?? "Auto-filled or select crop"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Auto-filled or select crop</SelectItem>
                    {crops.map((crop) => (
                      <SelectItem key={crop.id} value={crop.id}>
                        {crop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="associatedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Associated To</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="e.g. Irrigation" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "unassigned" ? "" : value)}
                  value={field.value || "unassigned"}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Unassigned">
                        {(value) => assigneeLabels[String(value)] ?? "Unassigned"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.name ?? member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status">
                        {(value) => STATUS_LABELS[value as Task["status"]] ?? value}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Pending">Open</SelectItem>
                    <SelectItem value="InProgress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="repeatRule"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repeats</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? "none"}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Do not Repeat">
                        {(value) => REPEAT_LABELS[String(value)] ?? value}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {REPEAT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-5">
          <div className="mb-3 flex items-center justify-between">
            <FormLabel>Checklist Items</FormLabel>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => append({ text: "" })}
              className="h-8 gap-1 text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </Button>
          </div>
          {fields.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">No checklist items added.</p>
          ) : (
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    {...form.register(`checklistItems.${index}.text`)}
                    placeholder={`Item ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Color</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={field.value ?? DEFAULT_TASK_COLOR}
                      onChange={field.onChange}
                      className="h-9 w-11 shrink-0 p-1"
                    />
                    <span className="text-sm text-muted-foreground">
                      {field.value ?? DEFAULT_TASK_COLOR}
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimatedHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Hours</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    placeholder="0.0"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
