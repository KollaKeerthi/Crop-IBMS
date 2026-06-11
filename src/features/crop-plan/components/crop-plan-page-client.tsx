"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Layers, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFarm } from "@/lib/farm-context";
import { useBlockMaster } from "@/features/block-master/hooks";
import { useReservations, useUpdateReservation } from "@/features/reservations/hooks";
import { useContracts, useUpdateContract } from "@/features/contracts/hooks";
import type { Reservation, UpdateReservationInput } from "@/features/reservations/schema";
import type { Contract, UpdateContractInput } from "@/features/contracts/schema";
import { PlanningCalendar } from "./planning-calendar";
import { ReservationNormalForm } from "./reservation-normal-form";
import { ReservationEmptyForm } from "./reservation-empty-form";
import { UnallocatedReservationsPanel } from "./unallocated-reservations-panel";
import { AutoReservationsPanel } from "./auto-reservations-panel";
import { ContractForm } from "./contract-form";
import { UnallocatedContractsPanel } from "./unallocated-contracts-panel";

// ─── Types ───────────────────────────────────────────────────────────────────
type MainTab = "reservation" | "contract" | "field";
type ResSubTab = "manual" | "unallocated" | "auto";
type ManualSubTab = "normal" | "empty";
type ContractSubTab = "manual" | "unallocated";
type OpenSelector = "main" | "reservation-sub" | "contract-sub" | "manual-type" | null;
type CalendarItem =
  | { kind: "reservation"; data: Reservation }
  | { kind: "contract"; data: Contract };

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 3;
const MAX_YEAR = CURRENT_YEAR + 3;

// ─── Tab pill component ───────────────────────────────────────────────────────
function SelectorSegment({
  onClick,
  children,
  badge,
}: {
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 items-center gap-1 rounded px-1.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
    >
      <span className="truncate">{children}</span>
      {badge != null && badge > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

function SelectorDivider() {
  return <span className="text-xs text-muted-foreground/50">-&gt;</span>;
}

// ─── Sub-tab chip ─────────────────────────────────────────────────────────────
function SelectorOption({
  active,
  onClick,
  children,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium capitalize transition-all",
        active
          ? "border border-border bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
      )}
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-100 px-1 text-[9px] font-bold text-amber-700">
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CropPlanPageClient() {
  const { selectedFarmId } = useFarm();
  const farmId = selectedFarmId ?? "";

  const [year, setYear] = useState(CURRENT_YEAR);
  const [mainTab, setMainTab] = useState<MainTab>("reservation");
  const [resSubTab, setResSubTab] = useState<ResSubTab>("manual");
  const [manualSubTab, setManualSubTab] = useState<ManualSubTab>("normal");
  const [contractSubTab, setContractSubTab] = useState<ContractSubTab>("manual");
  const [openSelector, setOpenSelector] = useState<OpenSelector>(null);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [panelMode, setPanelMode] = useState<"create" | "edit">("create");

  const { data: blocks = [] } = useBlockMaster(farmId || null);
  const { data: reservations = [] } = useReservations(farmId || null, year);
  const { data: contracts = [] } = useContracts(farmId || null, year);
  const { data: allReservations = [] } = useReservations(farmId || null);
  const { data: allContracts = [] } = useContracts(farmId || null);
  const updateReservation = useUpdateReservation(farmId);
  const updateContract = useUpdateContract(farmId);

  const unallocRes = reservations.filter((r) => !r.blockId);
  const unallocCon = contracts.filter((c) => !c.blockId);

  // ── Interaction handlers ──
  function handleCalendarItemClick(item: CalendarItem) {
    setSelectedItem(item);
    setPanelMode("edit");
    if (item.kind === "reservation") {
      setMainTab("reservation");
      setResSubTab("manual");
      setManualSubTab(item.data.type === "empty" ? "empty" : "normal");
    } else {
      setMainTab("contract");
      setContractSubTab("manual");
    }
    setOpenSelector(null);
  }

  function clearSelection() {
    setSelectedItem(null);
    setPanelMode("create");
  }

  function selectMainTab(tab: MainTab) {
    setMainTab(tab);
    if (tab === "reservation") {
      setResSubTab("manual");
      setManualSubTab("normal");
    }
    if (tab === "contract") {
      setContractSubTab("manual");
    }
    setOpenSelector(null);
    clearSelection();
  }

  function selectReservationSubTab(tab: ResSubTab) {
    setResSubTab(tab);
    if (tab === "manual") {
      setManualSubTab((current) => current ?? "normal");
    }
    setOpenSelector(null);
    clearSelection();
  }

  function selectContractSubTab(tab: ContractSubTab) {
    setContractSubTab(tab);
    setOpenSelector(null);
    clearSelection();
  }

  function selectManualSubTab(tab: ManualSubTab) {
    setManualSubTab(tab);
    setOpenSelector(null);
    clearSelection();
  }

  function handleSavedReservation(r: Reservation) {
    setSelectedItem({ kind: "reservation", data: r });
    setPanelMode("edit");
  }

  function handleSavedContract(c: Contract) {
    setSelectedItem({ kind: "contract", data: c });
    setPanelMode("edit");
  }

  async function handleReservationScheduleChange(id: string, input: UpdateReservationInput) {
    const updated = await updateReservation.mutateAsync({ id, input });
    if (selectedItem?.kind === "reservation" && selectedItem.data.id === id) {
      setSelectedItem({ kind: "reservation", data: updated });
    }
  }

  async function handleContractScheduleChange(id: string, input: UpdateContractInput) {
    const updated = await updateContract.mutateAsync({ id, input });
    if (selectedItem?.kind === "contract" && selectedItem.data.id === id) {
      setSelectedItem({ kind: "contract", data: updated });
    }
  }

  // ── Stats ──
  const totalSurface = reservations.reduce((sum, r) => sum + (r.totalSurface ?? 0), 0);

  // ── No farm guard ──
  if (!farmId) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-3xl">
            📅
          </div>
          <p className="text-sm font-semibold">No farm selected</p>
          <p className="text-xs opacity-60">Select a farm from the sidebar to start planning</p>
        </div>
      </div>
    );
  }

  // ── Panel editing indicator label ──
  const isEditing = panelMode === "edit" && selectedItem != null;
  const mainLabel =
    mainTab === "reservation" ? "Reservation" : mainTab === "contract" ? "Contract" : "Field";
  const secondaryLabel =
    mainTab === "reservation" ? resSubTab : mainTab === "contract" ? contractSubTab : null;
  const manualLabel = mainTab === "reservation" && resSubTab === "manual" ? manualSubTab : null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* ═══ Top header bar ═════════════════════════════════════════════════ */}
      <div className="flex items-center gap-4 border-b border-border bg-card px-5 py-3 shrink-0">
        {/* Year navigator */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setYear((y) => Math.max(MIN_YEAR, y - 1))}
            disabled={year <= MIN_YEAR}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card hover:bg-muted transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="min-w-[52px] text-center text-base font-bold tracking-tight tabular-nums">
            {year}
          </span>
          <button
            type="button"
            onClick={() => setYear((y) => Math.min(MAX_YEAR, y + 1))}
            disabled={year >= MAX_YEAR}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card hover:bg-muted transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-3.5" />
          </button>
          {year !== CURRENT_YEAR && (
            <button
              type="button"
              onClick={() => setYear(CURRENT_YEAR)}
              className="ml-1 text-[10px] font-medium text-primary hover:underline cursor-pointer"
            >
              Today
            </button>
          )}
        </div>

        {/* Stats chips */}
        <div className="flex items-center gap-2.5 ml-2">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-emerald-700">
              {reservations.length} reservation{reservations.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5">
            <span className="size-1.5 rounded-full bg-violet-500" />
            <span className="text-[11px] font-semibold text-violet-700">
              {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
            </span>
          </div>
          {(unallocRes.length > 0 || unallocCon.length > 0) && (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5">
              <span className="size-1.5 rounded-full bg-amber-500" />
              <span className="text-[11px] font-semibold text-amber-700">
                {unallocRes.length + unallocCon.length} unallocated
              </span>
            </div>
          )}
          {totalSurface > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground">
                {totalSurface.toLocaleString(undefined, { maximumFractionDigits: 0 })} m² planned
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 text-xs"
            onClick={() => {
              setMainTab("reservation");
              setResSubTab("manual");
              setManualSubTab("normal");
              setOpenSelector(null);
              clearSelection();
            }}
          >
            <Plus className="size-3.5" />
            Reservation
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs"
            onClick={() => {
              setMainTab("contract");
              setContractSubTab("manual");
              setOpenSelector(null);
              clearSelection();
            }}
          >
            <Plus className="size-3.5" />
            Contract
          </Button>
        </div>
      </div>

      {/* ═══ Body ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ─── Left form panel ──────────────────────────────────────────── */}
        <div className="flex w-80 xl:w-[340px] shrink-0 flex-col border-r border-border bg-card overflow-hidden">
          {/* Main tabs */}
          <div className="border-b border-border bg-muted/25">
            <div className="flex min-h-11 items-center gap-1 px-3 py-2">
              <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                <SelectorSegment
                  onClick={() => setOpenSelector((current) => (current === "main" ? null : "main"))}
                  badge={
                    mainTab === "reservation"
                      ? unallocRes.length
                      : mainTab === "contract"
                        ? unallocCon.length
                        : undefined
                  }
                >
                  {mainLabel}
                </SelectorSegment>

                {secondaryLabel && (
                  <>
                    <SelectorDivider />
                    <SelectorSegment
                      onClick={() => {
                        const selector: OpenSelector =
                          mainTab === "reservation" ? "reservation-sub" : "contract-sub";
                        setOpenSelector((current) => (current === selector ? null : selector));
                      }}
                      badge={
                        mainTab === "reservation" && resSubTab === "unallocated"
                          ? unallocRes.length
                          : mainTab === "contract" && contractSubTab === "unallocated"
                            ? unallocCon.length
                            : undefined
                      }
                    >
                      {secondaryLabel}
                    </SelectorSegment>
                  </>
                )}

                {manualLabel && (
                  <>
                    <SelectorDivider />
                    <SelectorSegment
                      onClick={() =>
                        setOpenSelector((current) =>
                          current === "manual-type" ? null : "manual-type"
                        )
                      }
                    >
                      {manualLabel}
                    </SelectorSegment>
                  </>
                )}
              </div>

              {isEditing && (
                <div className="ml-2 flex shrink-0 items-center gap-2">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Editing
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenSelector(null);
                      clearSelection();
                    }}
                    className="flex items-center gap-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-3" />
                    New
                  </button>
                </div>
              )}
            </div>

            {openSelector && (
              <div className="flex flex-wrap items-center gap-1 border-t border-border/60 bg-muted/15 px-3 py-2">
                {openSelector === "main" && (
                  <>
                    <SelectorOption
                      active={mainTab === "reservation"}
                      onClick={() => selectMainTab("reservation")}
                      badge={unallocRes.length}
                    >
                      Reservation
                    </SelectorOption>
                    <SelectorOption
                      active={mainTab === "contract"}
                      onClick={() => selectMainTab("contract")}
                      badge={unallocCon.length}
                    >
                      Contract
                    </SelectorOption>
                    <SelectorOption
                      active={mainTab === "field"}
                      onClick={() => selectMainTab("field")}
                    >
                      Field
                    </SelectorOption>
                  </>
                )}

                {openSelector === "reservation-sub" && (
                  <>
                    <SelectorOption
                      active={resSubTab === "manual"}
                      onClick={() => selectReservationSubTab("manual")}
                    >
                      Manual
                    </SelectorOption>
                    <SelectorOption
                      active={resSubTab === "unallocated"}
                      onClick={() => selectReservationSubTab("unallocated")}
                      badge={unallocRes.length}
                    >
                      Unallocated
                    </SelectorOption>
                    <SelectorOption
                      active={resSubTab === "auto"}
                      onClick={() => selectReservationSubTab("auto")}
                    >
                      Auto
                    </SelectorOption>
                  </>
                )}

                {openSelector === "contract-sub" && (
                  <>
                    <SelectorOption
                      active={contractSubTab === "manual"}
                      onClick={() => selectContractSubTab("manual")}
                    >
                      Manual
                    </SelectorOption>
                    <SelectorOption
                      active={contractSubTab === "unallocated"}
                      onClick={() => selectContractSubTab("unallocated")}
                      badge={unallocCon.length}
                    >
                      Unallocated
                    </SelectorOption>
                  </>
                )}

                {openSelector === "manual-type" && (
                  <>
                    <SelectorOption
                      active={manualSubTab === "normal"}
                      onClick={() => selectManualSubTab("normal")}
                    >
                      Normal
                    </SelectorOption>
                    <SelectorOption
                      active={manualSubTab === "empty"}
                      onClick={() => selectManualSubTab("empty")}
                    >
                      Empty
                    </SelectorOption>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Form content ── */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Reservation forms */}
            {mainTab === "reservation" && resSubTab === "manual" && manualSubTab === "normal" && (
              <ReservationNormalForm
                key={selectedItem?.data.id ?? "new-normal"}
                farmId={farmId}
                year={year}
                reservation={
                  selectedItem?.kind === "reservation" && selectedItem.data.type !== "empty"
                    ? selectedItem.data
                    : null
                }
                onSaved={handleSavedReservation}
                onCancel={isEditing ? clearSelection : undefined}
              />
            )}

            {mainTab === "reservation" && resSubTab === "manual" && manualSubTab === "empty" && (
              <ReservationEmptyForm
                key={selectedItem?.data.id ?? "new-empty"}
                farmId={farmId}
                year={year}
                reservation={
                  selectedItem?.kind === "reservation" && selectedItem.data.type === "empty"
                    ? selectedItem.data
                    : null
                }
                onSaved={handleSavedReservation}
                onCancel={isEditing ? clearSelection : undefined}
              />
            )}

            {mainTab === "reservation" && resSubTab === "unallocated" && (
              <UnallocatedReservationsPanel
                farmId={farmId}
                reservations={reservations}
                onEdit={(r) => {
                  setSelectedItem({ kind: "reservation", data: r });
                  setPanelMode("edit");
                  setResSubTab("manual");
                  setManualSubTab(r.type === "empty" ? "empty" : "normal");
                }}
              />
            )}

            {mainTab === "reservation" && resSubTab === "auto" && <AutoReservationsPanel />}

            {/* Contract forms */}
            {mainTab === "contract" && contractSubTab === "manual" && (
              <ContractForm
                key={selectedItem?.kind === "contract" ? selectedItem.data.id : "new-contract"}
                farmId={farmId}
                year={year}
                contract={selectedItem?.kind === "contract" ? selectedItem.data : null}
                onSaved={handleSavedContract}
                onCancel={isEditing ? clearSelection : undefined}
              />
            )}

            {mainTab === "contract" && contractSubTab === "unallocated" && (
              <UnallocatedContractsPanel
                farmId={farmId}
                contracts={contracts}
                onEdit={(c) => {
                  setSelectedItem({ kind: "contract", data: c });
                  setPanelMode("edit");
                  setContractSubTab("manual");
                }}
              />
            )}

            {/* Field module placeholder */}
            {mainTab === "field" && (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center text-muted-foreground">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Layers className="size-6 opacity-40" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Field Module</p>
                  <p className="text-xs mt-1 opacity-60">Coming in Phase 3</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Panel footer: selected item info ── */}
          {isEditing && selectedItem && (
            <div className="border-t border-border px-4 py-3 bg-muted/20 shrink-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                    {selectedItem.kind === "reservation" ? "Reservation" : "Contract"}
                  </p>
                  <p className="text-xs font-semibold text-foreground truncate mt-0.5">
                    {selectedItem.data.cropName ?? "—"}
                    {selectedItem.data.cropTypeName ? ` · ${selectedItem.data.cropTypeName}` : ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {selectedItem.kind === "reservation"
                      ? `W${(selectedItem.data as Reservation).pollinationStartWeek ?? (selectedItem.data as Reservation).startWeek ?? "?"}–${(selectedItem.data as Reservation).endWeek ?? "?"} · ${(selectedItem.data as Reservation).status}`
                      : `W${(selectedItem.data as Contract).pollinationStartWeek ?? "?"}–${(selectedItem.data as Contract).endWeek ?? "?"} · ${(selectedItem.data as Contract).status}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Calendar ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
          <PlanningCalendar
            blocks={blocks}
            reservations={allReservations}
            contracts={allContracts}
            year={year}
            onItemClick={handleCalendarItemClick}
            onReservationScheduleChange={handleReservationScheduleChange}
            onContractScheduleChange={handleContractScheduleChange}
            selectedId={selectedItem?.data.id ?? null}
          />
        </div>
      </div>
    </div>
  );
}
