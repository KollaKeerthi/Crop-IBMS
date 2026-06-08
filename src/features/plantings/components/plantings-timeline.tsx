// "use client";

// import type { Planting } from "../schema";

// const STATUS_COLORS: Record<string, string> = {
//   Growing: "bg-green-500",
//   Planned: "bg-yellow-400",
//   Nursery: "bg-blue-400",
//   Planted: "bg-emerald-400",
//   Harvested: "bg-gray-400",
//   Cancelled: "bg-red-300",
// };

// const STATUS_TEXT_COLORS: Record<string, string> = {
//   Growing: "text-white",
//   Planned: "text-yellow-900",
//   Nursery: "text-white",
//   Planted: "text-white",
//   Harvested: "text-white",
//   Cancelled: "text-white",
// };

// function parseDate(s: string | null | undefined): Date | null {
//   if (!s) return null;
//   const d = new Date(s);
//   return isNaN(d.getTime()) ? null : d;
// }

// function startOfMonth(d: Date): Date {
//   return new Date(d.getFullYear(), d.getMonth(), 1);
// }

// function addMonths(d: Date, n: number): Date {
//   return new Date(d.getFullYear(), d.getMonth() + n, 1);
// }

// function monthDiff(from: Date, to: Date): number {
//   return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
// }

// function formatMonth(d: Date): string {
//   return d.toLocaleString("default", { month: "short", year: "2-digit" });
// }

// type Props = {
//   plantings: Planting[];
//   onEdit: (planting: Planting) => void;
// };

// export function PlantingsTimeline({ plantings, onEdit }: Props) {
//   // Compute timeline range from all plantings with dates
//   const allDates: Date[] = [];
//   for (const p of plantings) {
//     const start = parseDate(p.nurseryStartDate) ?? parseDate(p.fieldPlantingDate);
//     const end = parseDate(p.harvestEndDate) ?? parseDate(p.firstHarvestDate);
//     if (start) allDates.push(start);
//     if (end) allDates.push(end);
//   }

//   if (allDates.length === 0) {
//     return (
//       <div className="flex h-40 items-center justify-center rounded-md border text-sm text-muted-foreground">
//         No date data available to display the timeline.
//       </div>
//     );
//   }

//   const minDate = startOfMonth(new Date(Math.min(...allDates.map((d) => d.getTime()))));
//   const maxDate = startOfMonth(
//     addMonths(new Date(Math.max(...allDates.map((d) => d.getTime()))), 1)
//   );
//   const totalMonths = monthDiff(minDate, maxDate) + 1;

//   const months: Date[] = [];
//   for (let i = 0; i < totalMonths; i++) {
//     months.push(addMonths(minDate, i));
//   }

//   const LABEL_COL_WIDTH = 160;
//   const MONTH_WIDTH = 80;

//   function getBarStyle(planting: Planting): { left: number; width: number } | null {
//     const start = parseDate(planting.nurseryStartDate) ?? parseDate(planting.fieldPlantingDate);
//     const end =
//       parseDate(planting.harvestEndDate) ??
//       parseDate(planting.firstHarvestDate) ??
//       (start ? addMonths(start, 1) : null);

//     if (!start || !end) return null;

//     const startMonth = startOfMonth(start);
//     const endMonth = startOfMonth(end);

//     const leftMonths = monthDiff(minDate, startMonth);
//     const widthMonths = Math.max(1, monthDiff(startMonth, endMonth) + 1);

//     // Add partial-month fraction
//     const startFraction = (start.getDate() - 1) / 31;
//     const left = (leftMonths + startFraction) * MONTH_WIDTH;
//     const endFraction = (end.getDate() - 1) / 31;
//     const width = Math.max(
//       MONTH_WIDTH * 0.5,
//       (widthMonths - startFraction + endFraction - 1) * MONTH_WIDTH
//     );

//     return { left, width };
//   }

//   function getRowLabel(planting: Planting): string {
//     const parts = [planting.cropName, planting.varietyName].filter(Boolean);
//     return parts.join(" / ") || "Unknown crop";
//   }

//   return (
//     <div className="overflow-x-auto rounded-md border">
//       <div style={{ minWidth: LABEL_COL_WIDTH + months.length * MONTH_WIDTH }}>
//         {/* Header */}
//         <div className="flex border-b bg-muted/50">
//           <div
//             className="shrink-0 px-3 py-2 text-xs font-medium text-muted-foreground"
//             style={{ width: LABEL_COL_WIDTH }}
//           >
//             Crop
//           </div>
//           {months.map((m, i) => (
//             <div
//               key={i}
//               className="shrink-0 border-l px-1 py-2 text-center text-xs font-medium text-muted-foreground"
//               style={{ width: MONTH_WIDTH }}
//             >
//               {formatMonth(m)}
//             </div>
//           ))}
//         </div>

//         {/* Rows */}
//         {plantings.map((planting) => {
//           const barStyle = getBarStyle(planting);
//           const barColor = STATUS_COLORS[planting.status] ?? "bg-gray-300";
//           const textColor = STATUS_TEXT_COLORS[planting.status] ?? "text-white";
//           const label = getRowLabel(planting);

//           return (
//             <div key={planting.id} className="flex border-b last:border-0 hover:bg-muted/20">
//               <div
//                 className="flex shrink-0 items-center px-3 py-2 text-xs font-medium"
//                 style={{ width: LABEL_COL_WIDTH }}
//               >
//                 <span className="truncate">{label}</span>
//               </div>
//               <div className="relative" style={{ width: months.length * MONTH_WIDTH, height: 40 }}>
//                 {/* Month grid lines */}
//                 {months.map((_, i) => (
//                   <div
//                     key={i}
//                     className="absolute top-0 h-full border-l border-border/40"
//                     style={{ left: i * MONTH_WIDTH }}
//                   />
//                 ))}

//                 {/* Bar */}
//                 {barStyle ? (
//                   <button
//                     type="button"
//                     className={`absolute top-[6px] h-7 cursor-pointer rounded px-2 text-xs font-medium transition-opacity hover:opacity-80 ${barColor} ${textColor}`}
//                     style={{ left: barStyle.left, width: barStyle.width }}
//                     onClick={() => onEdit(planting)}
//                     title={`${label} - ${planting.status}`}
//                   >
//                     <span className="truncate block">{planting.status}</span>
//                   </button>
//                 ) : (
//                   <button
//                     type="button"
//                     className="absolute top-[6px] h-7 cursor-pointer rounded border border-dashed border-muted-foreground/40 px-2 text-xs text-muted-foreground hover:bg-muted/40"
//                     style={{ left: 4, width: MONTH_WIDTH * 1.5 }}
//                     onClick={() => onEdit(planting)}
//                   >
//                     No dates set
//                   </button>
//                 )}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
"use client";

import type { Planting } from "../schema";

const STATUS_COLORS: Record<string, string> = {
  Growing: "bg-green-500",
  Planned: "bg-yellow-400",
  Nursery: "bg-blue-400",
  Planted: "bg-emerald-400",
  Harvested: "bg-gray-400",
  Cancelled: "bg-red-300",
};

// Internal sub-segment color coding matching your old platform layout
const SEGMENT_COLORS = {
  nursery: "bg-blue-400/80 border-r-2 border-dashed border-blue-600",
  growing: "bg-emerald-400/90 border-r-2 border-solid border-emerald-600",
  harvest: "bg-amber-500 font-bold text-white shadow-inner",
};

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function monthDiff(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

type Props = {
  plantings: Planting[];
  onEdit: (planting: Planting) => void;
};

export function PlantingsTimeline({ plantings, onEdit }: Props) {
  const allDates: Date[] = [];
  for (const p of plantings) {
    const start = parseDate(p.nurseryStartDate) ?? parseDate(p.fieldPlantingDate);
    const end = parseDate(p.harvestEndDate) ?? parseDate(p.firstHarvestDate);
    if (start) allDates.push(start);
    if (end) allDates.push(end);
  }

  if (allDates.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border text-sm text-muted-foreground">
        No date data available to display the timeline.
      </div>
    );
  }

  const minDate = startOfMonth(new Date(Math.min(...allDates.map((d) => d.getTime()))));
  const maxDate = startOfMonth(
    addMonths(new Date(Math.max(...allDates.map((d) => d.getTime()))), 1)
  );
  const totalMonths = monthDiff(minDate, maxDate) + 1;

  const months: Date[] = [];
  for (let i = 0; i < totalMonths; i++) {
    months.push(addMonths(minDate, i));
  }

  const LABEL_COL_WIDTH = 160;
  const MONTH_WIDTH = 80;

  function getBarStyle(planting: Planting) {
    const start = parseDate(planting.nurseryStartDate) ?? parseDate(planting.fieldPlantingDate);
    const end = parseDate(planting.harvestEndDate) ?? parseDate(planting.firstHarvestDate);
    if (!start || !end) return null;

    const leftMonths = monthDiff(minDate, startOfMonth(start));
    const startFraction = (start.getDate() - 1) / 31;
    const left = (leftMonths + startFraction) * MONTH_WIDTH;

    const widthMonths = Math.max(1, monthDiff(startOfMonth(start), startOfMonth(end)) + 1);
    const endFraction = (end.getDate() - 1) / 31;
    const width = Math.max(
      MONTH_WIDTH * 0.5,
      (widthMonths - startFraction + endFraction - 1) * MONTH_WIDTH
    );

    // Fragment metrics calculation
    const nurseryStart = parseDate(planting.nurseryStartDate);
    const fieldPlanting = parseDate(planting.fieldPlantingDate);
    const firstHarvest = parseDate(planting.firstHarvestDate);
    const harvestEnd = parseDate(planting.harvestEndDate);

    const totalDays =
      nurseryStart && harvestEnd
        ? differenceInDays(harvestEnd, nurseryStart)
        : fieldPlanting && harvestEnd
          ? differenceInDays(harvestEnd, fieldPlanting)
          : 1;

    const nurseryPct =
      nurseryStart && fieldPlanting
        ? (differenceInDays(fieldPlanting, nurseryStart) / totalDays) * 100
        : 0;
    const growingPct =
      fieldPlanting && firstHarvest
        ? (differenceInDays(firstHarvest, fieldPlanting) / totalDays) * 100
        : 0;
    const harvestPct =
      firstHarvest && harvestEnd
        ? (differenceInDays(harvestEnd, firstHarvest) / totalDays) * 100
        : 0;

    return { left, width, segments: { nurseryPct, growingPct, harvestPct } };
  }

  function differenceInDays(d1: Date, d2: Date): number {
    return Math.abs(Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <div style={{ minWidth: LABEL_COL_WIDTH + months.length * MONTH_WIDTH }}>
        {/* Render Header */}
        <div className="flex border-b bg-muted/50">
          <div
            className="shrink-0 px-3 py-2 text-xs font-medium text-muted-foreground"
            style={{ width: LABEL_COL_WIDTH }}
          >
            Crop
          </div>
          {months.map((m, i) => (
            <div
              key={i}
              className="shrink-0 border-l px-1 py-2 text-center text-xs font-medium text-muted-foreground"
              style={{ width: MONTH_WIDTH }}
            >
              {m.toLocaleString("default", { month: "short", year: "2-digit" })}
            </div>
          ))}
        </div>

        {/* Rows Render */}
        {plantings.map((planting) => {
          const barStyle = getBarStyle(planting);
          const parts = [planting.cropName, planting.varietyName].filter(Boolean);
          const label = parts.join(" / ") || "Unknown crop";

          return (
            <div key={planting.id} className="flex border-b last:border-0 hover:bg-muted/20">
              <div
                className="flex shrink-0 items-center px-3 py-2 text-xs font-medium"
                style={{ width: LABEL_COL_WIDTH }}
              >
                <span className="truncate">{label}</span>
              </div>
              <div className="relative" style={{ width: months.length * MONTH_WIDTH, height: 42 }}>
                {months.map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-l border-border/40"
                    style={{ left: i * MONTH_WIDTH }}
                  />
                ))}

                {barStyle ? (
                  <button
                    type="button"
                    className="absolute top-[6px] h-7 cursor-pointer rounded overflow-hidden flex text-[10px] font-semibold text-foreground border shadow-xs transition-transform active:scale-98"
                    style={{ left: barStyle.left, width: barStyle.width }}
                    onClick={() => onEdit(planting)}
                  >
                    {/* Segment 1: Nursery Propagation */}
                    {barStyle.segments.nurseryPct > 0 && (
                      <div
                        className={`h-full flex items-center justify-center text-blue-900 truncate ${SEGMENT_COLORS.nursery}`}
                        style={{ width: `${barStyle.segments.nurseryPct}%` }}
                        title="Nursery Phase"
                      >
                        Nurs
                      </div>
                    )}
                    {/* Segment 2: Vegetative Growth */}
                    {barStyle.segments.growingPct > 0 && (
                      <div
                        className={`h-full flex items-center justify-center text-emerald-950 truncate ${SEGMENT_COLORS.growing}`}
                        style={{ width: `${barStyle.segments.growingPct}%` }}
                        title="Vegetative Growth Phase"
                      >
                        Grow
                      </div>
                    )}
                    {/* Segment 3: Primary Harvest */}
                    {barStyle.segments.harvestPct > 0 && (
                      <div
                        className={`h-full flex items-center justify-center text-white truncate ${SEGMENT_COLORS.harvest}`}
                        style={{ width: `${barStyle.segments.harvestPct}%` }}
                        title="Harvest Production Phase"
                      >
                        Harvest Window
                      </div>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="absolute top-[6px] h-7 cursor-pointer rounded border border-dashed border-muted-foreground/40 px-2 text-xs text-muted-foreground hover:bg-muted/40"
                    style={{ left: 4, width: MONTH_WIDTH * 1.5 }}
                    onClick={() => onEdit(planting)}
                  >
                    No dates set
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
