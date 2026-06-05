import { BlockMasterTable } from "@/features/block-master";

export default function BlockMasterPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Block Master</h1>
        <p className="text-sm text-muted-foreground">
          Define farm blocks, sub-blocks, and their dimensions.
        </p>
      </div>
      <BlockMasterTable />
    </div>
  );
}
