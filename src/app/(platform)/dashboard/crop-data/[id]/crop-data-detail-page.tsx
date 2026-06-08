"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Download, ChevronRight, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useFarm } from "@/lib/farm-context";
import { useCropDataDetail, useUpdateCropData } from "@/features/crop-data/hooks";
import {
  UpdateCropDataInputSchema,
  SexExpressionSchema,
  type UpdateCropDataInput,
} from "@/features/crop-data/schema";
import { CropDataDetail } from "@/features/crop-data/components/crop-data-detail";
import { listCrops, getCrop } from "@/features/crops/api";
import { listSeasons } from "@/features/seasons/api";
import { useLocationHierarchy } from "@/features/locations/hooks";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FullRecord = {
  id: string;
  farmId: string;
  cropId?: string | null;
  cropTypeId?: string | null;
  varietyId?: string | null;
  seasonId?: string | null;
  cropName?: string | null;
  cropTypeName?: string | null;
  varietyName?: string | null;
  seasonName?: string | null;
  cropImageUrl?: string | null;
  block?: string | null;
  fieldName?: string | null;
  fieldCode?: string | null;
  sexExpression?: string | null;
  contractNo?: string | null;
  headerNo?: string | null;
  customerCode?: string | null;
  contractRef?: string | null;
  status?: string | null;
  notes?: string | null;
  createdAt?: string;
  programInfo: Record<string, unknown> | null;
  nursery: Record<string, unknown> | null;
  revenue: Record<string, unknown> | null;
  sections: Record<string, Record<string, unknown> | null>;
  collections: Record<string, Record<string, unknown>[]>;
  media: Array<{
    id: string;
    url: string;
    name?: string | null;
    mimeType?: string | null;
    sizeBytes?: number | null;
  }>;
  modules: Array<{ moduleType: string; data: Record<string, unknown> }>;
};

export function CropDataDetailPage({ activeTab }: { activeTab: string }) {
  const { id } = useParams<{ id: string }>();
  const { selectedFarmId } = useFarm();
  const { data, isLoading, isError } = useCropDataDetail(id, selectedFarmId);
  const [editOpen, setEditOpen] = useState(false);

  async function handleExport() {
    if (!selectedFarmId) return;
    try {
      const res = await fetch(
        `/api/v1/crop-data/${id}/export?farmId=${encodeURIComponent(selectedFarmId)}`
      );
      if (!res.ok) {
        toast.error("Export failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crop-data-${id}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    }
  }

  if (!selectedFarmId) {
    return <p className="text-sm text-muted-foreground p-8">Select a farm to view crop data.</p>;
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-6xl p-8">
        <p className="text-sm text-destructive">Crop data record not found.</p>
      </div>
    );
  }

  const record = data as FullRecord;

  const displayName =
    record.customerCode ?? record.cropName ?? record.block ?? record.id.slice(0, 8);

  const leftFacts: { label: string; value: string | null | undefined }[] = [
    { label: "Block", value: record.block },
    { label: "Crop Name", value: record.cropName },
    { label: "Crop Type", value: record.cropTypeName },
    { label: "Variety", value: record.varietyName },
    { label: "Sex Expression", value: record.sexExpression },
    { label: "Season", value: record.seasonName },
  ];
  const rightFacts: { label: string; value: string | null | undefined }[] = [
    { label: "Field Name", value: record.fieldName },
    { label: "Field Code", value: record.fieldCode },
    { label: "Contract", value: record.contractNo },
    { label: "Header", value: record.headerNo },
    { label: "Customer Code", value: record.customerCode },
    { label: "Contract Ref", value: record.contractRef },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/dashboard/crop-data" className="hover:text-foreground transition-colors">
            Crop Data
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{displayName}</span>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Details
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Header summary card */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex gap-4 rounded-xl border bg-muted/30 p-5">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-background">
            {record.cropImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={record.cropImageUrl}
                alt={record.cropName ?? "Crop"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl">🌱</div>
            )}
          </div>
          <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            {leftFacts.map((f) => (
              <FactRow key={f.label} label={f.label} value={f.value} />
            ))}
          </dl>
        </div>
        <div className="rounded-xl border bg-muted/30 p-5">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            {rightFacts.map((f) => (
              <FactRow key={f.label} label={f.label} value={f.value} />
            ))}
          </dl>
        </div>
      </div>

      <CropDataDetail record={record} farmId={selectedFarmId} activeTab={activeTab} />

      {/* Edit Details Dialog */}
      <EditCropDataDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        record={record}
        farmId={selectedFarmId}
      />
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <>
      <dt className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="font-semibold text-foreground">{value || "-"}</dd>
    </>
  );
}

function EditCropDataDialog({
  open,
  onOpenChange,
  record,
  farmId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: FullRecord;
  farmId: string;
}) {
  const updateMutation = useUpdateCropData();

  const form = useForm<UpdateCropDataInput>({
    resolver: zodResolver(UpdateCropDataInputSchema),
    defaultValues: {
      cropId: record.cropId ?? undefined,
      cropTypeId: record.cropTypeId ?? undefined,
      varietyId: record.varietyId ?? undefined,
      seasonId: record.seasonId ?? undefined,
      sexExpression: (record.sexExpression as UpdateCropDataInput["sexExpression"]) ?? undefined,
      fieldName: record.fieldName ?? "",
      block: record.block ?? "",
      fieldCode: record.fieldCode ?? "",
      contractNo: record.contractNo ?? "",
      headerNo: record.headerNo ?? "",
      customerCode: record.customerCode ?? "",
      contractRef: record.contractRef ?? "",
    },
  });

  const selectedCropId = useWatch({ control: form.control, name: "cropId" });

  const { data: crops = [] } = useQuery({
    queryKey: ["crops"],
    queryFn: () => listCrops(),
    enabled: open,
  });

  const { data: seasons = [] } = useQuery({
    queryKey: ["seasons", farmId],
    queryFn: () => listSeasons(farmId),
    enabled: open && !!farmId,
  });

  const { data: selectedCrop } = useQuery({
    queryKey: ["crops", selectedCropId],
    queryFn: () => getCrop(selectedCropId!),
    enabled: open && !!selectedCropId,
  });

  const { data: hierarchy } = useLocationHierarchy(farmId);
  const fieldsInDb = hierarchy?.fields ?? [];
  const types = selectedCrop?.types ?? [];
  const varieties = selectedCrop?.varieties ?? [];

  async function onSubmit(values: UpdateCropDataInput) {
    try {
      // Convert empty strings to undefined so we don't wipe existing values.
      // If the crop changed, clear cropTypeId and varietyId so stale FK refs don't persist.
      const cropChanged = values.cropId !== record.cropId;
      const cleanedValues: UpdateCropDataInput = {
        cropId: values.cropId || undefined,
        cropTypeId: cropChanged ? undefined : values.cropTypeId || undefined,
        varietyId: cropChanged ? undefined : values.varietyId || undefined,
        seasonId: values.seasonId || undefined,
        sexExpression: values.sexExpression || undefined,
        fieldName: values.fieldName || undefined,
        block: values.block || undefined,
        fieldCode: values.fieldCode || undefined,
        contractNo: values.contractNo || undefined,
        headerNo: values.headerNo || undefined,
        customerCode: values.customerCode || undefined,
        contractRef: values.contractRef || undefined,
      };
      await updateMutation.mutateAsync({ id: record.id, farmId, input: cleanedValues });
      toast.success("Details updated");
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        form.setError("root", { message: err.message });
      } else {
        form.setError("root", { message: "Something went wrong. Please try again." });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-200 w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Details</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Crop */}
              <FormField
                control={form.control}
                name="cropId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crop</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("cropTypeId", undefined);
                        form.setValue("varietyId", undefined);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a crop" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {crops.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Crop Type */}
              <FormField
                control={form.control}
                name="cropTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crop Type</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("varietyId", undefined);
                      }}
                      disabled={!selectedCropId || types.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={selectedCropId ? "Select a type" : "Select a crop first"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {types.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Variety */}
              <FormField
                control={form.control}
                name="varietyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variety</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      disabled={!selectedCropId || varieties.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              selectedCropId ? "Select a variety" : "Select a crop first"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {varieties.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Season */}
              <FormField
                control={form.control}
                name="seasonId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Season</FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a season" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {seasons.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sex Expression */}
              <FormField
                control={form.control}
                name="sexExpression"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sex Expression</FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select sex expression" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SexExpressionSchema.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Field Name */}
              <FormField
                control={form.control}
                name="fieldName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Name</FormLabel>
                    {fieldsInDb.length > 0 ? (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("block", "");
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fieldsInDb.map((f) => (
                            <SelectItem key={f.id} value={f.name}>
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="e.g. North Field"
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Block */}
              <FormField
                control={form.control}
                name="block"
                render={({ field }) => {
                  const selectedFieldName = form.watch("fieldName");
                  const selectedField = fieldsInDb.find((f) => f.name === selectedFieldName);
                  const blocksInDb = selectedField?.blocks ?? [];
                  return (
                    <FormItem>
                      <FormLabel>Block</FormLabel>
                      {blocksInDb.length > 0 ? (
                        <Select value={field.value ?? ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select block" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {blocksInDb.map((b) => (
                              <SelectItem key={b.id} value={b.name}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} placeholder="e.g. Block A" />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Field Code */}
              <FormField
                control={form.control}
                name="fieldCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Code</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="e.g. FLD-001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contract No */}
              <FormField
                control={form.control}
                name="contractNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract No</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="e.g. CTR-001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Header No */}
              <FormField
                control={form.control}
                name="headerNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Header No</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="e.g. HDR-001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Customer Code */}
              <FormField
                control={form.control}
                name="customerCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Code</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="e.g. CUST-001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contract Ref */}
              <FormField
                control={form.control}
                name="contractRef"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Ref</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="e.g. REF-001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
