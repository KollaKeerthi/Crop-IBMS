"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import type { Season } from "@/features/seasons/schema";
import type { PlantingStatus } from "../schema";

const ALL_STATUSES: PlantingStatus[] = [
  "Planned",
  "Nursery",
  "Planted",
  "Growing",
  "Harvested",
  "Cancelled",
];

export type PlantingFilters = {
  seasonId: string | null;
  statuses: PlantingStatus[];
};

type Props = {
  seasons: Season[];
  filters: PlantingFilters;
  onChange: (filters: PlantingFilters) => void;
};

export function PlantingFilters({ seasons, filters, onChange }: Props) {
  const [statusOpen, setStatusOpen] = useState(false);

  function toggleStatus(status: PlantingStatus) {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses: next });
  }

  const statusLabel =
    filters.statuses.length === 0
      ? "All statuses"
      : filters.statuses.length === ALL_STATUSES.length
      ? "All statuses"
      : filters.statuses.join(", ");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-[180px]">
        <Select
          value={filters.seasonId ?? "all"}
          onValueChange={(v) =>
            onChange({ ...filters, seasonId: v === "all" ? null : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All seasons" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All seasons</SelectItem>
            {seasons.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} ({s.year})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Popover open={statusOpen} onOpenChange={setStatusOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" className="min-w-[160px] justify-between">
              <span className="truncate">{statusLabel}</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          }
        />
        <PopoverContent className="w-48 p-3" align="start">
          <div className="space-y-2">
            {ALL_STATUSES.map((status) => (
              <div key={status} className="flex items-center gap-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={filters.statuses.includes(status)}
                  onCheckedChange={() => toggleStatus(status)}
                />
                <Label htmlFor={`status-${status}`} className="cursor-pointer font-normal">
                  {status}
                </Label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
