"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import {
  CreateSubBlockInputSchema,
  UpdateSubBlockInputSchema,
  type CreateSubBlockInput,
  type SubBlock,
} from "../schema";
import { useCreateSubBlock, useUpdateSubBlock } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type Props = {
  blockId: string;
  farmId: string;
  subBlock?: SubBlock;
  onSuccess?: () => void;
};

export function SubBlockForm({ blockId, farmId, subBlock, onSuccess }: Props) {
  const isEdit = !!subBlock;
  const schema = isEdit ? UpdateSubBlockInputSchema : CreateSubBlockInputSchema;

  const form = useForm<CreateSubBlockInput>({
    resolver: zodResolver(schema) as Resolver<CreateSubBlockInput>,
    defaultValues: {
      blockId,
      farmId,
      name: subBlock?.name ?? "",
      rows: subBlock?.rows ?? undefined,
      rowLengthM: subBlock?.rowLengthM ?? undefined,
      rowWidthM: subBlock?.rowWidthM ?? undefined,
      areaSqm: subBlock?.areaSqm ?? undefined,
    },
  });

  const createMutation = useCreateSubBlock();
  const updateMutation = useUpdateSubBlock();
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: CreateSubBlockInput) {
    try {
      if (isEdit && subBlock) {
        await updateMutation.mutateAsync({
          id: subBlock.id,
          blockId,
          farmId,
          input: values,
        });
        toast.success("Sub-block updated");
      } else {
        await createMutation.mutateAsync({ ...values, blockId, farmId });
        toast.success("Sub-block created");
        form.reset({ blockId, farmId, name: "" });
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Section A" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rows"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rows</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="-"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? undefined : parseInt(e.target.value, 10)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="areaSqm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area (m2)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="-"
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rowLengthM"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Row length (m)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="-"
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
          <FormField
            control={form.control}
            name="rowWidthM"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Row width (m)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="-"
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

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save Changes"
              : "Create Sub-block"}
        </Button>
      </form>
    </Form>
  );
}
