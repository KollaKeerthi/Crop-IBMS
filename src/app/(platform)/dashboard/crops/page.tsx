import { CropTable } from "@/features/crops";
import { PageShell } from "@/components/layout/page-shell";

export default function CropsPage() {
  return (
    <PageShell>
      <CropTable />
    </PageShell>
  );
}
