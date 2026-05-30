"use client";

import { Trash2, Plus, Mars, Venus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CreateCropVarietyInputSchema, type CreateCropVarietyInput, type Crop } from "../schema";
import { useCreateCropVariety, useDeleteCropVariety } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  crop: Crop;
};

const GENDER_CONFIG = {
  Male: { icon: Mars, className: "bg-blue-100 text-blue-700 border-blue-200" },
  Female: { icon: Venus, className: "bg-pink-100 text-pink-700 border-pink-200" },
} as const;

export function VarietyManager({ crop }: Props) {
  const createMutation = useCreateCropVariety(crop.id);
  const deleteMutation = useDeleteCropVariety(crop.id);

  const form = useForm<CreateCropVarietyInput>({
    resolver: zodResolver(CreateCropVarietyInputSchema),
    defaultValues: { name: "", gender: undefined, colourDescription: "" },
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
            {crop.varieties.map((v) => {
              const genderCfg = v.gender ? GENDER_CONFIG[v.gender] : null;
              const GenderIcon = genderCfg?.icon;
              return (
                <li
                  key={v.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{v.name}</span>
                    {v.gender && genderCfg && (
                      <Badge variant="outline" className={`gap-1 text-xs ${genderCfg.className}`}>
                        {GenderIcon && <GenderIcon className="h-3 w-3" />}
                        {v.gender}
                      </Badge>
                    )}
                    {v.colourDescription && (
                      <Badge variant="secondary" className="text-xs">
                        {v.colourDescription}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleDelete(v.id)}
                    disabled={deleteMutation.isPending}
                    aria-label={`Delete variety ${v.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Variety name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v || undefined)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Gender (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Male">
                      <span className="flex items-center gap-2">
                        <Mars className="h-3.5 w-3.5 text-blue-600" /> Male
                      </span>
                    </SelectItem>
                    <SelectItem value="Female">
                      <span className="flex items-center gap-2">
                        <Venus className="h-3.5 w-3.5 text-pink-600" /> Female
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="colourDescription"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Colour description (optional)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="sm" disabled={createMutation.isPending} className="w-full">
            <Plus className="h-4 w-4 mr-1" />
            Add Variety
          </Button>
        </form>
      </Form>
    </div>
  );
}
