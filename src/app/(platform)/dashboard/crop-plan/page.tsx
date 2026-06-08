import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { Layers } from "lucide-react";

export default function CropPlanPage() {
  return (
    <PageShell>
      <SectionHeader
        title="Crop Plan"
        description="Plan your crop cycles, schedules, and production targets."
      />
      <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-dashed border-border/60 bg-muted/20 mt-6">
        <Layers className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Crop planning is coming soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Your crop schedules and production targets will appear here.
        </p>
      </div>
    </PageShell>
  );
}
