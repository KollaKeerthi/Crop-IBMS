"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import { CreateBlockInputSchema, type CreateBlockInput, type BlockParentType } from "../schema";
import { useCreateBlock } from "../hooks";
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
  parentId: string;
  parentType: BlockParentType;
  onSuccess?: () => void;
};

export function BlockForm({ farmId, parentId, parentType, onSuccess }: Props) {
  const form = useForm<CreateBlockInput>({
    resolver: zodResolver(CreateBlockInputSchema),
    defaultValues: {
      farmId,
      parentId,
      parentType,
      name: "",
      areaSqm: undefined,
      notes: "",
    },
  });

  const createMutation = useCreateBlock();

  async function onSubmit(values: CreateBlockInput) {
    try {
      await createMutation.mutateAsync(values);
      toast.success("Block created");
      form.reset({ farmId, parentId, parentType, name: "", areaSqm: undefined, notes: "" });
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
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Block 1" />
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
              <FormLabel>Area (m²)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))
                  }
                  placeholder="Optional"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Optional notes"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}

        <Button type="submit" disabled={createMutation.isPending} className="w-full">
          {createMutation.isPending ? "Creating..." : "Create Block"}
        </Button>
      </form>
    </Form>
  );
}
