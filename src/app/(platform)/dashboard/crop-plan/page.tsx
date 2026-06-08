import { PlantingsList } from "@/features/plantings";

export default function CropPlanPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Crop Plan</h1>
        <p className="text-sm text-muted-foreground">
          Track individual crop planting instances and their timeline.
        </p>
      </div>
      <PlantingsList />
    </div>
  );
}
