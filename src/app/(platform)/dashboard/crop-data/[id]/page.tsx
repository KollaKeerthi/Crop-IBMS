import { redirect } from "next/navigation";

type Params = { params: Promise<{ id: string }> };

export default async function CropDataDetailRoute({ params }: Params) {
  const { id } = await params;
  redirect(`/dashboard/crop-data/${id}/program-info`);
}
