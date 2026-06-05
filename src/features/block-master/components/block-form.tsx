"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import {
  CreateBlockMasterInputSchema,
  UpdateBlockMasterInputSchema,
  type CreateBlockMasterInput,
  type BlockMaster,
} from "../schema";
import { useCreateBlockMaster, useUpdateBlockMaster } from "../hooks";
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

type Props = {
  farmId: string;
  block?: BlockMaster;
  onSuccess?: () => void;
};

export function BlockForm({ farmId, block, onSuccess }: Props) {
  const isEdit = !!block;
  const schema = isEdit ? UpdateBlockMasterInputSchema : CreateBlockMasterInputSchema;

  const form = useForm<CreateBlockMasterInput>({
    resolver: zodResolver(schema) as Resolver<CreateBlockMasterInput>,
    defaultValues: {
      blockName: block?.blockName ?? "",
      subBlockName: block?.subBlockName ?? "",
      areaSqm: block?.areaSqm ?? undefined,
      rows: block?.rows ?? undefined,
      rowLengthM: block?.rowLengthM ?? undefined,
      rowWidthM: block?.rowWidthM ?? undefined,
      notes: block?.notes ?? "",
    },
  });

  const createMutation = useCreateBlockMaster(farmId);
  const updateMutation = useUpdateBlockMaster(farmId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: CreateBlockMasterInput) {
    try {
      if (isEdit && block) {
        await updateMutation.mutateAsync({ id: block.id, input: values });
        toast.success("Block updated");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Block created");
        form.reset();
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

  const numField = (
    fieldName: keyof CreateBlockMasterInput,
    label: string,
    placeholder?: string
  ) => (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="any"
              {...field}
              value={field.value ?? ""}
              onChange={(e) =>
                field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))
              }
              placeholder={placeholder}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="blockName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Block Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Block A" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subBlockName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sub-Block Name</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="e.g. Row 1" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {numField("areaSqm", "Area (m2)")}
          {numField("rows", "Rows")}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {numField("rowLengthM", "Row Length (m)")}
          {numField("rowWidthM", "Row Width (m)")}
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save Changes"
              : "Create Block"}
        </Button>
      </form>
    </Form>
  );
}
