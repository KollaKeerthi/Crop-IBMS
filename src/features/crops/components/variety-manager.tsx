"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CreateCropVarietyInputSchema, type CreateCropVarietyInput, type Crop } from "../schema";
import { useCreateCropVariety, useDeleteCropVariety } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

type Props = {
  crop: Crop;
};

export function VarietyManager({ crop }: Props) {
  const createMutation = useCreateCropVariety(crop.id);
  const deleteMutation = useDeleteCropVariety(crop.id);

  const form = useForm<CreateCropVarietyInput>({
    resolver: zodResolver(CreateCropVarietyInputSchema),
    defaultValues: { name: "", code: "" },
  });

  async function onSubmit(values: CreateCropVarietyInput) {
    try {
      await createMutation.mutateAsync(values);
      toast.success("Variety added");
      form.reset();
    } catch {
      toast.error("Failed to add variety");
    }
  }

  async function handleDelete(varietyId: string) {
    try {
      await deleteMutation.mutateAsync(varietyId);
      toast.success("Variety removed");
    } catch {
      toast.error("Failed to remove variety");
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {crop.varieties.length === 0 ? (
          <p className="text-sm text-muted-foreground">No varieties yet.</p>
        ) : (
          <ul className="space-y-1">
            {crop.varieties.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{v.name}</span>
                  {v.code && (
                    <Badge variant="secondary" className="text-xs">
                      {v.code}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDelete(v.id)}
                  disabled={deleteMutation.isPending}
                  aria-label={`Delete variety ${v.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input {...field} placeholder="Variety name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="w-28">
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="Code" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="sm" disabled={createMutation.isPending}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </Form>
    </div>
  );
}
