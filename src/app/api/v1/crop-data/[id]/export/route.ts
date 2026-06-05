import { type NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { apiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { getCropDataHandler } from "@/features/crop-data/handlers";
import {
  fmtNum,
  revenueSide,
  pollinationEstimatedYield,
  postHarvestComputations,
} from "@/features/crop-data/compute";
import { formatDateDisplay } from "@/lib/format";

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
      ["Created At", formatDateDisplay(record.createdAt, "")],
    ];
    const wsSummary = wb.addWorksheet("Summary");
    wsSummary.addRows(summaryData);

    const val = (o: Record<string, unknown> | null, k: string): string => {
      const v = o?.[k];
      return v === null || v === undefined ? "" : String(v);
    };
    const dateVal = (o: Record<string, unknown> | null, k: string): string => {
      const v = o?.[k];
      if (!v) return "";
      return formatDateDisplay(v as string, "");
    };

    // Sheet 2: Program Info (Metric / Male / Female)
    const pi = record.programInfo as Record<string, unknown> | null;
    const wsProgramInfo = wb.addWorksheet("Program Info");
    wsProgramInfo.addRows([
      ["Metric", "Male", "Female"],
      ["Batch Number", val(pi, "maleBatchNo"), val(pi, "femaleBatchNo")],
      [
        "Planned Sowing Date",
        dateVal(pi, "malePlannedSowingDate"),
        dateVal(pi, "femalePlannedSowingDate"),
      ],
      [
        "Planned Planting Date",
        dateVal(pi, "malePlannedPlantingDate"),
        dateVal(pi, "femalePlannedPlantingDate"),
      ],
      ["Planned No. of Plants", val(pi, "malePlannedPlants"), val(pi, "femalePlannedPlants")],
      [
        "Planned Plants / Row",
        val(pi, "malePlannedPlantsPerRow"),
        val(pi, "femalePlannedPlantsPerRow"),
      ],
      [
        "Planned Plants / m2",
        val(pi, "malePlannedPlantsPerSqm"),
        val(pi, "femalePlannedPlantsPerSqm"),
      ],
      ["Planned Surface Area", "", val(pi, "plannedSurfaceArea")],
      ["Planned No. of Rows", "", val(pi, "plannedNoOfRows")],
      ["Proposed gram / Plant (Customer)", "", val(pi, "proposedGramPerPlant")],
      ["Agreed gram / Plant", "", val(pi, "agreedGramPerPlant")],
      ["Base Yield (kg)", "", val(pi, "baseYieldKg")],
      ["grams / m2", "", val(pi, "gramsPerSqm")],
      ["Material Arrival Date (Actual)", "", dateVal(pi, "materialArrivalDate")],
      ["Block Prep Start (Actual)", "", dateVal(pi, "blockPrepStartDate")],
      ["Block Prep End (Actual)", "", dateVal(pi, "blockPrepEndDate")],
      ["Production Year", "", val(pi, "productionYear")],
      ["Requested Quantity", val(pi, "maleRequestedQuantity"), val(pi, "femaleRequestedQuantity")],
      ["Agreed Order From Customer (kg)", "", val(pi, "agreedOrderFromCustomerKg")],
      ["Requested Delivery Date (Customer)", "", dateVal(pi, "requestedDeliveryDate")],
      ["Archive Status", "", val(pi, "archiveStatus")],
      ["Remarks From Customer", "", val(pi, "remarksFromCustomer")],
      ["Notes", "", val(pi, "notes")],
    ]);

    // Sheet 3: Revenue (Metric / Planned / Actual)
    const rev = record.revenue as Record<string, unknown> | null;

    const revSidePlanned = revenueSide(rev ?? {}, pi, "male");
    const revSideActual = revenueSide(rev ?? {}, pi, "female");

    const wsRevenue = wb.addWorksheet("Revenue");
    wsRevenue.addRows([
      ["Metric", "Planned", "Actual"],
      ["Total number of Weeks", val(rev, "maleTotalWeeks"), val(rev, "femaleTotalWeeks")],
      ["Agreed Unit Price", val(rev, "maleAgreedUnitPrice"), val(rev, "femaleAgreedUnitPrice")],
      [
        "Contract Revenue",
        fmtNum(revSidePlanned.contractRevenue, 3),
        fmtNum(revSideActual.contractRevenue, 3),
      ],
      ["Additional Revenue", "", val(rev, "additionalRevenue")],
      [
        "Total Revenue",
        fmtNum(revSidePlanned.totalRevenue, 3),
        fmtNum(revSideActual.totalRevenue, 3),
      ],
      [
        "Total Revenue m2",
        fmtNum(revSidePlanned.totalRevenuePerSqm, 9),
        fmtNum(revSideActual.totalRevenuePerSqm, 9),
      ],
      [
        "Total Revenue m2/wk",
        fmtNum(revSidePlanned.totalRevenuePerSqmWk, 9),
        fmtNum(revSideActual.totalRevenuePerSqmWk, 9),
      ],
      ["Planned Remarks", val(rev, "plannedRemarks"), ""],
      ["Actual Remarks", "", val(rev, "actualRemarks")],
    ]);

    // Sheet 4: Nursery (Metric / Male / Female)
    const nurs = record.nursery as Record<string, unknown> | null;
    const wsNursery = wb.addWorksheet("Nursery");
    wsNursery.addRows([
      ["Metric", "Male", "Female"],
      [
        "Actual Sowing Date",
        dateVal(nurs, "maleActualSowingDate"),
        dateVal(nurs, "femaleActualSowingDate"),
      ],
      ["Germination (%)", val(nurs, "maleGerminationPct"), val(nurs, "femaleGerminationPct")],
      [
        "Actual Planting Date",
        dateVal(nurs, "maleActualPlantingDate"),
        dateVal(nurs, "femaleActualPlantingDate"),
      ],
      ["Actual Planting Week", "", val(nurs, "actualPlantingWeek")],
      [
        "Actual No. of Plants Planted",
        val(nurs, "maleActualPlantsPlanted"),
        val(nurs, "femaleActualPlantsPlanted"),
      ],
      [
        "Actual Plants / Row Planted",
        val(nurs, "maleActualPlantsPerRow"),
        val(nurs, "femaleActualPlantsPerRow"),
      ],
      [
        "Actual No. of Rows Planted",
        val(nurs, "maleActualRowsPlanted"),
        val(nurs, "femaleActualRowsPlanted"),
      ],
      [
        "Actual Surface Area Planted",
        val(nurs, "maleActualSurfaceArea"),
        val(nurs, "femaleActualSurfaceArea"),
      ],
      ["Remarks from Customer", "", val(nurs, "remarksFromCustomer")],
      ["Recommendations", "", val(nurs, "recommendations")],
    ]);

    // Phase 2 single-record sections (Metric / Value)
    const sections = (record.sections ?? {}) as Record<string, Record<string, unknown> | null>;
    const prod = sections.production ?? null;
    const wsProd = wb.addWorksheet("Production");
    wsProd.addRows([
      ["Metric", "Value"],
      ["Realized No. of Plants", val(prod, "realizedPlants")],
      ["Realized No. of Rows", val(prod, "realizedRows")],
      ["Realized Surface Area", val(prod, "realizedSurfaceArea")],
      ["Realized Plants / m2", val(prod, "realizedPlantsPerSqm")],
      ["Avg Temperature", val(prod, "avgTemperature")],
      ["Avg Radiation", val(prod, "avgRadiation")],
      ["Avg Humidity", val(prod, "avgHumidity")],
      ["Remarks", val(prod, "remarks")],
      ["Recommendations", val(prod, "recommendations")],
    ]);

    const poll = sections.pollination ?? null;
    const pollEstimatedYield = pollinationEstimatedYield(poll ?? {}, prod);

    const wsPoll = wb.addWorksheet("Pollination");
    wsPoll.addRows([
      ["Metric", "Value"],
      ["Pollination Start", dateVal(poll, "pollinationStart")],
      ["Pollination End", dateVal(poll, "pollinationEnd")],
      ["Supervisor in charge", val(poll, "supervisor")],
      ["Avg. Seeds / Fruit", val(poll, "avgSeedsPerFruit")],
      ["Fruits / Plant", val(poll, "fruitsPerPlant")],
      ["No. of Seeds per Gram", val(poll, "seedsPerGram")],
      ["Expected Harvest Date", dateVal(poll, "expectedHarvestDate")],
      ["Estimated Yield (kg)", fmtNum(pollEstimatedYield)],
      ["Avg. Temp During Pollination", val(poll, "avgTempDuringPollination")],
      ["Light in J/cm² During Pollination", val(poll, "lightDuringPollination")],
      ["Avg Humidity During Pollination", val(poll, "avgHumidityDuringPollination")],
      ["Remarks", val(poll, "remarks")],
      ["Recommendations", val(poll, "recommendations")],
    ]);

    const ph = sections.post_harvest ?? null;

    const phCtx = {
      ...(pi ?? {}),
      ...(prod ?? {}),
      ...(nurs ?? {}),
    };
    const phComp = postHarvestComputations(ph ?? {}, phCtx);

    const wsPh = wb.addWorksheet("Post Harvest");
    wsPh.addRows([
      ["Metric", "Value"],
      ["Harvest Start Date", dateVal(ph, "harvestStartDate")],
      ["Harvest End Date", val(ph, "harvestEndDate")],
      ["Planned Shipping Date", dateVal(ph, "plannedShippingDate")],
      ["Actual Shipping Date", dateVal(ph, "actualShippingDate")],
      ["Total No. of Harvests", val(ph, "totalNoOfHarvests")],
      ["Total KGs", val(ph, "totalKgs")],
      ["Actual Yield (%)", fmtNum(phComp.actualYieldPct, 8)],
      ["Grams per m2", fmtNum(phComp.gramsPerSqm, 8)],
      ["Grams per Plant", fmtNum(phComp.gramsPerPlant, 8)],
      ["Net Crop Cycle Weeks", fmtNum(phComp.netWeeks, 0)],
      ["Actual Gr/m2/wk", fmtNum(phComp.actualGrPerSqmWk, 9)],
      ["% Germination", val(ph, "germinationPct")],
      ["Remarks", val(ph, "remarks")],
      ["Recommendations", val(ph, "recommendations")],
    ]);

    const phs = sections.post_harvest_summary ?? null;
    const wsPhs = wb.addWorksheet("Post Harvest Summary");
    wsPhs.addRows([
      ["Metric", "Value"],
      ["Date", dateVal(phs, "date")],
      ["KGs", val(phs, "kgs")],
      ["Germination (%)", val(phs, "germinationPct")],
      ["Remarks", val(phs, "remarks")],
    ]);

    const sq = sections.seeds_quality ?? null;
    const wsSq = wb.addWorksheet("Seeds Quality");
    wsSq.addRows([
      ["Metric", "Value"],
      ["Total Seeds Sown", val(sq, "totalSeedsSown")],
      ["Good1", val(sq, "good1")],
      ["Good2", val(sq, "good2")],
      ["Abnormal", val(sq, "abnormal")],
      ["Too Small", val(sq, "tooSmall")],
      ["Non Germinated", val(sq, "nonGerminated")],
      ["Crop Assessment Score", val(sq, "cropAssessmentScore")],
      ["KG Customer (After Cleaning)", val(sq, "kgCustomerAfterCleaning")],
      ["Remarks", val(sq, "remarks")],
    ]);

    const sqb = sections.sq_breakdown ?? null;
    const wsSqb = wb.addWorksheet("SQ Breakdown");
    wsSqb.addRows([
      ["Metric", "KG's", "Germination %"],
      ["Germination Good", val(sqb, "germGoodKg"), val(sqb, "germGoodPct")],
      ["Germination Low", val(sqb, "germLowKg"), val(sqb, "germLowPct")],
      [
        "Germination Customer Good",
        val(sqb, "germCustomerGoodKg"),
        val(sqb, "germCustomerGoodPct"),
      ],
      ["Germination Customer Low", val(sqb, "germCustomerLowKg"), val(sqb, "germCustomerLowPct")],
      ["Germination Low Export Date", dateVal(sqb, "germLowExportDate"), ""],
      ["Inbred %", val(sqb, "inbredPct"), ""],
      ["Off Type", val(sqb, "offType"), ""],
      ["Recommendations", val(sqb, "recommendations"), ""],
    ]);

    const gt = sections.germination_test ?? null;
    const wsGt = wb.addWorksheet("Germination Test");
    wsGt.addRows([
      ["Metric", "Value"],
      ["Sown", dateVal(gt, "sownDate")],
      ["Final Count", dateVal(gt, "finalCountDate")],
      ["Sown on", val(gt, "sownOn")],
      ["Good", val(gt, "good")],
      ["Small", val(gt, "small")],
      ["Too small", val(gt, "tooSmall")],
      ["Abnormal", val(gt, "abnormal")],
      ["Rotting", val(gt, "rotting")],
      ["No Ger", val(gt, "noGer")],
      ["Remarks", val(gt, "remarks")],
      ["Emp Name", val(gt, "empName")],
    ]);

    // Multi-row collections
    const collections = (record.collections ?? {}) as Record<string, Record<string, unknown>[]>;
    const harvestRows = collections.harvest_records ?? [];
    const wsHarvest = wb.addWorksheet("Harvest Details");
    wsHarvest.addRows([
      [
        "Date",
        "Block",
        "Variety",
        "Code",
        "Row m2",
        "Row No",
        "Emp Name",
        "Harvest Code",
        "Kg",
        "% Germination",
        "Gr/m2",
        "Remarks",
      ],
      ...harvestRows.map((r) => {
        const kg = Number(r.kg);
        const rowM2 = Number(r.rowM2);
        const grm2 =
          Number.isFinite(kg) && Number.isFinite(rowM2) && rowM2 !== 0 ? (kg * 1000) / rowM2 : "";
        return [
          dateVal(r, "harvestDate"),
          val(r, "block"),
          val(r, "variety"),
          val(r, "code"),
          val(r, "rowM2"),
          val(r, "rowNo"),
          val(r, "empName"),
          val(r, "harvestCode"),
          val(r, "kg"),
          val(r, "germinationPct"),
          grm2 === "" ? "" : Number(grm2.toFixed(2)),
          val(r, "remarks"),
        ];
      }),
    ]);

    const perfRows = collections.performance ?? [];
    const wsPerf = wb.addWorksheet("Performance");
    wsPerf.addRows([
      ["Date", "Employee", "Activity", "Output", "Notes"],
      ...perfRows.map((r) => [
        dateVal(r, "date"),
        val(r, "empName"),
        val(r, "activity"),
        val(r, "outputQty"),
        val(r, "notes"),
      ]),
    ]);

    // One sheet per remaining (JSONB) module
    const modules = record.modules as Array<{ moduleType: string; data: Record<string, unknown> }>;
    for (const mod of modules) {
      const sheetLabel = mod.moduleType
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .slice(0, 31); // Excel sheet name max 31 chars

      const moduleRows: (string | number | boolean | null)[][] = [["Key", "Value"]];
      for (const [k, v] of Object.entries(mod.data ?? {})) {
        moduleRows.push([
          k,
          typeof v === "object" ? JSON.stringify(v) : (v as string | number | boolean | null),
        ]);
      }
      const wsMod = wb.addWorksheet(sheetLabel);
      wsMod.addRows(moduleRows);
    }

    const buf = Buffer.from(await wb.xlsx.writeBuffer());

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="crop-data-${id}.xlsx"`,
      },
    });
  } catch (err) {
    return apiError(err);
  }
}
