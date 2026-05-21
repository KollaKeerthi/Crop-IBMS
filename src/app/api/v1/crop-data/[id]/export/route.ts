import { type NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { apiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { getCropDataHandler } from "@/features/crop-data/handlers";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "missing_farm_id", "farmId is required.");

    const record = await getCropDataHandler(ctx, id, farmId);

    const wb = new ExcelJS.Workbook();

    // Sheet 1: Summary
    const summaryData = [
      ["Field", "Value"],
      ["ID", record.id],
      ["Farm ID", record.farmId],
      ["Block", record.block ?? ""],
      ["Field Name", record.fieldName ?? ""],
      ["Sex Expression", record.sexExpression ?? ""],
      ["Contract No", record.contractNo ?? ""],
      ["Status", record.status ?? ""],
      ["Notes", record.notes ?? ""],
      ["Created At", record.createdAt ? new Date(record.createdAt).toLocaleString() : ""],
    ];
    const wsSummary = wb.addWorksheet("Summary");
    wsSummary.addRows(summaryData);

    // Sheet 2: Program Info
    const pi = record.programInfo as Record<string, unknown> | null;
    const programInfoData = [
      ["Field", "Value"],
      ["Batch No", pi?.batchNo ?? ""],
      ["Planting Date", pi?.plantingDate ? new Date(pi.plantingDate as string).toLocaleDateString() : ""],
      ["Male Plant Count", pi?.malePlantCount ?? ""],
      ["Female Plant Count", pi?.femalePlantCount ?? ""],
      ["Surface Area (sqm)", pi?.surfaceAreaSqm ?? ""],
      ["Male Density", pi?.maleDensity ?? ""],
      ["Female Density", pi?.femaleDensity ?? ""],
      ["Notes", pi?.notes ?? ""],
    ];
    const wsProgramInfo = wb.addWorksheet("Program Info");
    wsProgramInfo.addRows(programInfoData);

    // Sheet 3: Nursery
    const nurs = record.nursery as Record<string, unknown> | null;
    const nurseryData = [
      ["Field", "Value"],
      ["Start Date", nurs?.startDate ? new Date(nurs.startDate as string).toLocaleDateString() : ""],
      ["End Date", nurs?.endDate ? new Date(nurs.endDate as string).toLocaleDateString() : ""],
      ["Seedlings Count", nurs?.seedlingsCount ?? ""],
      ["Germination Rate", nurs?.germinationRate ?? ""],
      ["Notes", nurs?.notes ?? ""],
    ];
    // Append flexible nursery data fields
    if (nurs?.data && typeof nurs.data === "object") {
      for (const [k, v] of Object.entries(nurs.data as Record<string, unknown>)) {
        nurseryData.push([k, String(v ?? "")]);
      }
    }
    const wsNursery = wb.addWorksheet("Nursery");
    wsNursery.addRows(nurseryData);

    // One sheet per module
    const modules = record.modules as Array<{ moduleType: string; data: Record<string, unknown> }>;
    for (const mod of modules) {
      const sheetLabel = mod.moduleType
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .slice(0, 31); // Excel sheet name max 31 chars

      const moduleRows: (string | number | boolean | null)[][] = [["Key", "Value"]];
      for (const [k, v] of Object.entries(mod.data ?? {})) {
        moduleRows.push([k, typeof v === "object" ? JSON.stringify(v) : (v as string | number | boolean | null)]);
      }
      const wsMod = wb.addWorksheet(sheetLabel);
      wsMod.addRows(moduleRows);
    }

    const buf = Buffer.from(await wb.xlsx.writeBuffer());

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="crop-data-${id}.xlsx"`,
      },
    });
  } catch (err) {
    return apiError(err);
  }
}
