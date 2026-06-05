"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdateModule } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type KeyValuePair = { key: string; value: string };

type Props = {
  cropDataId: string;
  farmId: string;
  moduleType: string;
  initialData: Record<string, unknown> | null;
};

function toKVPairs(data: Record<string, unknown> | null): KeyValuePair[] {
  if (!data) return [];
  return Object.entries(data).map(([key, value]) => ({
    key,
    value: typeof value === "object" ? JSON.stringify(value) : String(value ?? ""),
  }));
}

function fromKVPairs(pairs: KeyValuePair[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const { key, value } of pairs) {
    if (key.trim()) {
      // Try to parse as number/boolean, otherwise keep as string
      if (value === "true") result[key] = true;
      else if (value === "false") result[key] = false;
      else if (value !== "" && !isNaN(Number(value))) result[key] = Number(value);
      else result[key] = value;
    }
  }
  return result;
}

export function ModuleEditor({ cropDataId, farmId, moduleType, initialData }: Props) {
  const [pairs, setPairs] = useState<KeyValuePair[]>(() => toKVPairs(initialData));
  const mutation = useUpdateModule(cropDataId, farmId, moduleType);

  function addField() {
    setPairs((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeField(index: number) {
    setPairs((prev) => prev.filter((_, i) => i !== index));
  }

  function updateField(index: number, field: "key" | "value", val: string) {
    setPairs((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: val } : p)));
  }

  async function handleSave() {
    try {
      await mutation.mutateAsync(fromKVPairs(pairs));
      toast.success("Module data saved");
    } catch {
      toast.error("Failed to save module data");
    }
  }

  return (
    <div className="space-y-3">
      {pairs.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No data yet. Click &apos;Add Field&apos; to start entering values.
        </p>
      )}

      {pairs.length > 0 && (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium w-[45%]">Key</th>
                <th className="px-3 py-2 text-left font-medium w-[45%]">Value</th>
                <th className="px-3 py-2 w-[10%]" />
              </tr>
            </thead>
            <tbody>
              {pairs.map((pair, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-2 py-1">
                    <Input
                      value={pair.key}
                      onChange={(e) => updateField(i, "key", e.target.value)}
                      placeholder="key"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      value={pair.value}
                      onChange={(e) => updateField(i, "value", e.target.value)}
                      placeholder="value"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeField(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={addField}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Field
        </Button>
        <Button size="sm" onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
