import { SeasonsTable } from "@/features/seasons";

export default function SeasonsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Seasons</h1>
        <p className="text-sm text-muted-foreground">Manage growing seasons for your farm.</p>
      </div>
      <SeasonsTable />
    </div>
  );
}
