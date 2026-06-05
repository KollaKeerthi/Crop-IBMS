import { CropInformationTabs } from "./crop-information-tabs";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/ui/section-header";

export default function CropInformationPage() {
  return (
    <PageShell>
      <SectionHeader
        title="Crop Information"
        description="Manage crops, varieties, seasons, activities, and production sites in one place."
      />
      <CropInformationTabs />
    </PageShell>
  );
}
