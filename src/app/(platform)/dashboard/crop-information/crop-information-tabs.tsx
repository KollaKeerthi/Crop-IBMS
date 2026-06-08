"use client";

import { useEffect, useRef, useState } from "react";
import {
  Layers,
  Sprout,
  Database,
  Fingerprint,
  CalendarDays,
  ClipboardList,
  Timer,
  LayoutGrid,
  Boxes,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CropTable, CropTypesTable, CropVarietiesTable } from "@/features/crops";
import { SeasonsTable } from "@/features/seasons";
import { ActivitiesTable } from "@/features/activities";
import { ProductionTypesList } from "@/features/production-types";
import { DensityMasterTable } from "@/features/density-master";
import { ActiveTimeTable } from "@/features/active-time";
import { BlockMasterTable } from "@/features/block-master";
import { VariabilityTable } from "@/features/variability";
import { cn } from "@/lib/utils";

const TAB_TRIGGER_CLASS =
  "shrink-0 flex-none text-sm font-medium gap-2 px-3 py-2 data-active:text-primary";

export function CropInformationTabs() {
  const [active, setActive] = useState("production-type");
  const listRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function checkScroll() {
    const el = listRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scrollTabs(direction: "left" | "right") {
    const list = listRef.current;
    if (!list) return;
    list.scrollBy({
      left: direction === "left" ? -list.clientWidth * 0.75 : list.clientWidth * 0.75,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeEl = list.querySelector<HTMLElement>(`[data-slot="tabs-trigger"][data-active]`);
    if (activeEl) {
      activeEl.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
    setTimeout(checkScroll, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <Tabs value={active} onValueChange={setActive}>
      <div className="relative flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 shrink-0 transition-opacity",
            canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => scrollTabs("left")}
          tabIndex={-1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <TabsList
          ref={listRef}
          variant="line"
          className="flex h-auto flex-1 justify-start gap-1 overflow-x-auto whitespace-nowrap border-b rounded-none px-0 scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          <TabsTrigger value="production-type" className={TAB_TRIGGER_CLASS}>
            <Layers className="h-4 w-4" /> Production Type
          </TabsTrigger>
          <TabsTrigger value="crops" className={TAB_TRIGGER_CLASS}>
            <Sprout className="h-4 w-4" /> Crops
          </TabsTrigger>
          <TabsTrigger value="crop-type" className={TAB_TRIGGER_CLASS}>
            <Database className="h-4 w-4" /> Crop Type
          </TabsTrigger>
          <TabsTrigger value="variety-code" className={TAB_TRIGGER_CLASS}>
            <Fingerprint className="h-4 w-4" /> Variety Code
          </TabsTrigger>
          <TabsTrigger value="seasons" className={TAB_TRIGGER_CLASS}>
            <CalendarDays className="h-4 w-4" /> Seasons
          </TabsTrigger>
          <TabsTrigger value="activities" className={TAB_TRIGGER_CLASS}>
            <ClipboardList className="h-4 w-4" /> Activities
          </TabsTrigger>
          <TabsTrigger value="lead-time" className={TAB_TRIGGER_CLASS}>
            <Timer className="h-4 w-4" /> Lead Time
          </TabsTrigger>
          <TabsTrigger value="blocks" className={TAB_TRIGGER_CLASS}>
            <LayoutGrid className="h-4 w-4" /> Blocks
          </TabsTrigger>
          <TabsTrigger value="density" className={TAB_TRIGGER_CLASS}>
            <Boxes className="h-4 w-4" /> Density
          </TabsTrigger>
          <TabsTrigger value="variability" className={TAB_TRIGGER_CLASS}>
            <Activity className="h-4 w-4" /> Variability
          </TabsTrigger>
        </TabsList>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 shrink-0 transition-opacity",
            canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => scrollTabs("right")}
          tabIndex={-1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <TabsContent value="production-type" className="mt-6">
        <ProductionTypesList />
      </TabsContent>

      <TabsContent value="crops" className="mt-6">
        <CropTable />
      </TabsContent>

      <TabsContent value="crop-type" className="mt-6">
        <CropTypesTable />
      </TabsContent>

      <TabsContent value="variety-code" className="mt-6">
        <CropVarietiesTable />
      </TabsContent>

      <TabsContent value="seasons" className="mt-6">
        <SeasonsTable />
      </TabsContent>

      <TabsContent value="activities" className="mt-6">
        <ActivitiesTable />
      </TabsContent>

      <TabsContent value="lead-time" className="mt-6">
        <ActiveTimeTable />
      </TabsContent>

      <TabsContent value="blocks" className="mt-6">
        <BlockMasterTable />
      </TabsContent>

      <TabsContent value="density" className="mt-6">
        <DensityMasterTable />
      </TabsContent>

      <TabsContent value="variability" className="mt-6">
        <VariabilityTable />
      </TabsContent>
    </Tabs>
  );
}
