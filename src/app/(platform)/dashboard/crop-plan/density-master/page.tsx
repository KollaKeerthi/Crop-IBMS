import { DensityMasterTable } from "@/features/density-master";

export default function DensityMasterPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Density Master</h1>
        <p className="text-sm text-muted-foreground">
          Configure planting density parameters per crop.
        </p>
      </div>
      <DensityMasterTable />
    </div>
  );
}
