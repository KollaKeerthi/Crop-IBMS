"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, ClipboardList, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFieldArray } from "react-hook-form";
import { ApiError } from "@/lib/api/errors";
import {
  CreateTaskTemplateInputSchema,
  type CreateTaskTemplateInput,
  type TaskTemplate,
} from "../schema";
import {
  useTaskTemplates,
  useCreateTaskTemplate,
  useDeleteTaskTemplate,
  useCreateTaskFromTemplate,
} from "../hooks";

type Props = {
  farmId: string;
  open: boolean;
  onClose: () => void;
};

const PRIORITY_COLORS: Record<TaskTemplate["priority"], string> = {
  Low: "bg-blue-100 text-blue-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-orange-100 text-orange-700",
  Urgent: "bg-red-100 text-red-700",
};

function TemplateCreateForm({ farmId, onSuccess }: { farmId: string; onSuccess: () => void }) {
  const form = useForm<CreateTaskTemplateInput>({
    resolver: zodResolver(CreateTaskTemplateInputSchema) as Resolver<CreateTaskTemplateInput>,
    defaultValues: {
      farmId,
      title: "",
      description: "",
      priority: "Medium",
      estimatedHours: undefined,
      checklistItems: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "checklistItems",
  });

  const createMutation = useCreateTaskTemplate();

  async function onSubmit(values: CreateTaskTemplateInput) {
    try {
      await createMutation.mutateAsync(values);
      toast.success("Template created");
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        form.setError("root", { message: err.message });
      } else {
        form.setError("root", { message: "Something went wrong." });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Template title" />
              </FormControl>
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
                  <SelectTrigger>
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
          name="estimatedHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Hours</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  placeholder="e.g. 2.5"
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FormLabel>Checklist</FormLabel>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ text: "" })}>
              <Plus className="mr-1 h-3 w-3" />
              Add Item
            </Button>
          </div>
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

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}

        <Button type="submit" disabled={createMutation.isPending} className="w-full">
          {createMutation.isPending ? "Creating..." : "Create Template"}
        </Button>
      </form>
    </Form>
  );
}

export function TemplateManager({ farmId, open, onClose }: Props) {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: templates, isLoading } = useTaskTemplates(farmId);
  const deleteMutation = useDeleteTaskTemplate();
  const useTemplateMutation = useCreateTaskFromTemplate();

  function handleDelete(template: TaskTemplate) {
    if (!confirm(`Delete template "${template.title}"?`)) return;
    deleteMutation.mutate(
      { farmId, id: template.id },
      {
        onSuccess: () => toast.success("Template deleted"),
        onError: () => toast.error("Failed to delete template"),
      }
    );
  }

  function handleUseTemplate(template: TaskTemplate) {
    useTemplateMutation.mutate(
      { farmId, templateId: template.id, overrides: {} },
      {
        onSuccess: () => toast.success(`Task created from template "${template.title}"`),
        onError: () => toast.error("Failed to create task from template"),
      }
    );
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(v) => {
          if (!v) onClose();
        }}
      >
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Task Templates
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            <Button className="w-full" variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>

            <Separator />

            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            )}

            {!isLoading && templates?.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No templates yet. Create one to speed up task creation.
              </div>
            )}

            {templates?.map((template) => (
              <div key={template.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{template.title}</p>
                    {template.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleDelete(template)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`text-xs ${PRIORITY_COLORS[template.priority]}`}>
                    {template.priority}
                  </Badge>
                  {template.estimatedHours !== null && (
                    <span className="text-xs text-muted-foreground">
                      {template.estimatedHours}h est.
                    </span>
                  )}
                  {template.checklistItems.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {template.checklistItems.length} checklist items
                    </span>
                  )}
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleUseTemplate(template)}
                  disabled={useTemplateMutation.isPending}
                >
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={createOpen}
        onOpenChange={(v) => {
          if (!v) setCreateOpen(false);
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Template</DialogTitle>
          </DialogHeader>
          <TemplateCreateForm farmId={farmId} onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
