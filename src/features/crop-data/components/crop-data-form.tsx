"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import { listBlockMaster } from "@/features/block-master/api";
import { listContracts } from "@/features/contracts/api";
import { listCrops, getCrop } from "@/features/crops/api";
import { listSeasons } from "@/features/seasons/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  CreateCropDataInputSchema,
  SexExpressionSchema,
  type CreateCropDataInput,
} from "../schema";
import { useCreateCropData } from "../hooks";

type Props = {
  farmId: string;
  onSuccess?: () => void;
};

function emptyProgram(farmId: string): Partial<CreateCropDataInput> {
  return { farmId };
}

function contractLabel(contract: {
  id: string;
  contractRef?: string | null;
  absContractNo?: string | null;
  cropName?: string | null;
  blockName?: string | null;
}) {
  const ref = contract.contractRef ?? contract.absContractNo ?? contract.id.slice(0, 8);
  return [ref, contract.cropName, contract.blockName].filter(Boolean).join(" / ");
}

function selectedLabel(value: string | null | undefined, fallback: string) {
  return value ? fallback : <span className="text-muted-foreground">{fallback}</span>;
}

export function CropDataForm({ farmId, onSuccess }: Props) {
  const form = useForm<CreateCropDataInput>({
    resolver: zodResolver(CreateCropDataInputSchema),
    defaultValues: emptyProgram(farmId),
  });

  const selectedContractId = useWatch({ control: form.control, name: "contractId" });
  const selectedCropId = useWatch({ control: form.control, name: "cropId" });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts", farmId],
    queryFn: () => listContracts(farmId),
    enabled: !!farmId,
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ["block-master", farmId],
    queryFn: () => listBlockMaster(farmId),
    enabled: !!farmId,
  });

  const { data: crops = [] } = useQuery({
    queryKey: ["crops"],
    queryFn: () => listCrops(),
  });

  const { data: seasons = [] } = useQuery({
    queryKey: ["seasons", farmId],
    queryFn: () => listSeasons(farmId),
    enabled: !!farmId,
  });

  const { data: selectedCrop } = useQuery({
    queryKey: ["crops", selectedCropId],
    queryFn: () => getCrop(selectedCropId),
    enabled: !!selectedCropId,
  });

  const activeContracts = useMemo(
    () => contracts.filter((contract) => contract.status === "active"),
    [contracts]
  );
  const selectedContract = activeContracts.find((contract) => contract.id === selectedContractId);
  const types = selectedCrop?.types ?? [];
  const varieties = selectedCrop?.varieties ?? [];
  const blockOptions = selectedContract?.blockId
    ? blocks.filter((block) => block.id === selectedContract.blockId)
    : blocks;
  const seasonOptions = selectedContract?.seasonId
    ? seasons.filter((season) => season.id === selectedContract.seasonId)
    : seasons;
  const selectedBlock = blocks.find((block) => block.id === form.watch("blockMasterId"));
  const selectedCropOption = crops.find((crop) => crop.id === form.watch("cropId"));
  const selectedType = types.find((type) => type.id === form.watch("cropTypeId"));
  const selectedVariety = varieties.find((variety) => variety.id === form.watch("varietyId"));
  const selectedSeason = seasons.find((season) => season.id === form.watch("seasonId"));

  const createMutation = useCreateCropData();

  function applyContract(contractId: string | null) {
    if (!contractId) return;
    const contract = activeContracts.find((item) => item.id === contractId);
    form.setValue("contractId", contractId, { shouldValidate: true });
    form.setValue("contractNo", contract?.absContractNo ?? contract?.contractRef ?? "");
    form.setValue("contractRef", contract?.contractRef ?? contract?.absContractNo ?? "");
    form.setValue("headerNo", contract?.absHeaderNo ?? "");

    if (contract?.cropId) form.setValue("cropId", contract.cropId, { shouldValidate: true });
    if (contract?.cropTypeId) {
      form.setValue("cropTypeId", contract.cropTypeId, { shouldValidate: true });
    } else {
      form.resetField("cropTypeId");
    }
    if (contract?.seasonId) form.setValue("seasonId", contract.seasonId, { shouldValidate: true });
    if (contract?.blockId) {
      const block = blocks.find((item) => item.id === contract.blockId);
      form.setValue("blockMasterId", contract.blockId, { shouldValidate: true });
      form.setValue("block", block?.blockName ?? contract.blockName ?? "", {
        shouldValidate: true,
      });
    }
  }

  function applyBlock(blockId: string | null) {
    if (!blockId) return;
    const block = blocks.find((item) => item.id === blockId);
    form.setValue("blockMasterId", blockId, { shouldValidate: true });
    form.setValue("block", block?.blockName ?? "", { shouldValidate: true });
  }

  async function onSubmit(values: CreateCropDataInput) {
    try {
      await createMutation.mutateAsync(values);
      toast.success("Crop program created");
      form.reset(emptyProgram(farmId));
      onSuccess?.();
    } catch (err) {
      if (err instanceof ApiError) {
        form.setError("root", { message: err.message });
      } else {
        form.setError("root", { message: "Something went wrong. Please try again." });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="contractId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contract Ref Number</FormLabel>
              <Select value={field.value ?? ""} onValueChange={applyContract}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value) => {
                        const contract = activeContracts.find((item) => item.id === value);
                        return selectedLabel(
                          value,
                          contract ? contractLabel(contract) : "Select contract ref number"
                        );
                      }}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {activeContracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contractLabel(contract)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="blockMasterId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Block</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={applyBlock}
                  disabled={!selectedContractId}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value) =>
                          selectedLabel(value, selectedBlock?.blockName ?? "Select block")
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {blockOptions.map((block) => (
                      <SelectItem key={block.id} value={block.id}>
                        {block.blockName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    form.resetField("cropTypeId");
                    form.resetField("varietyId");
                  }}
                  disabled={!selectedContractId || !!selectedContract?.cropId}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value) =>
                          selectedLabel(
                            value,
                            selectedCropOption?.name ?? selectedCrop?.name ?? "Select crop"
                          )
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {crops.map((crop) => (
                      <SelectItem key={crop.id} value={crop.id}>
                        {crop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cropTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crop Type</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={!selectedCropId || !!selectedContract?.cropTypeId}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value) => selectedLabel(value, selectedType?.name ?? "Select crop type")}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="varietyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Variety / Product Code</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={!selectedCropId}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value) =>
                          selectedLabel(
                            value,
                            selectedVariety?.name ?? "Select variety/product code"
                          )
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {varieties.map((variety) => (
                      <SelectItem key={variety.id} value={variety.id}>
                        {variety.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sexExpression"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sex Expression</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={!selectedContractId}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value) =>
                          selectedLabel(value, value ? String(value) : "Select sex expression")
                        }
                      </SelectValue>
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

          <FormField
            control={form.control}
            name="seasonId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Season</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={!selectedContractId}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value) => selectedLabel(value, selectedSeason?.name ?? "Select season")}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {seasonOptions.map((season) => (
                      <SelectItem key={season.id} value={season.id}>
                        {season.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fieldName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field Name</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="Optional field name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fieldCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field/Code</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="Optional field/code" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contractNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract No</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="headerNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Header No</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root ? (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        ) : null}

        <Button type="submit" disabled={createMutation.isPending} className="w-full">
          {createMutation.isPending ? "Creating..." : "Create Program"}
        </Button>
      </form>
    </Form>
  );
}
