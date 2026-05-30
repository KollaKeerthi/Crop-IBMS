import { redirect } from "next/navigation";
import { CropDataDetailPage } from "../crop-data-detail-page";
import { isCropDataTab } from "@/features/crop-data/constants";

type Params = { params: Promise<{ id: string; tab: string }> };

export default async function CropDataTabRoute({ params }: Params) {
  const { id, tab } = await params;
  if (!isCropDataTab(tab)) {
    redirect(`/dashboard/crop-data/${id}/program-info`);
  }
  return <CropDataDetailPage activeTab={tab} />;
}
