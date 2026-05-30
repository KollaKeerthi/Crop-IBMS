"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapPin,
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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CropTable, CropTypesTable, CropVarietiesTable } from "@/features/crops";
import { SeasonsTable } from "@/features/seasons";
import { ActivitiesTable } from "@/features/activities";
import { ProductionSitesList } from "@/features/production-sites";
import { ProductionTypesList } from "@/features/production-types";
import { DensityMasterTable } from "@/features/density-master";
import { ActiveTimeTable } from "@/features/active-time";
import { BlockMasterTable } from "@/features/block-master";
import { VariabilityTable } from "@/features/variability";

const TAB_TRIGGER_CLASS =
  "shrink-0 flex-none text-sm font-medium gap-2 px-3 py-2 data-active:text-primary";

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="rounded-xl border bg-card p-10 text-center shadow-sm">
      <p className="text-h4 font-bold text-foreground">{title}</p>
      <p className="text-small text-muted-foreground mt-2">
        This master is not built yet. Backend scaffolding may already exist; ask Claude to wire up
        the UI when you&apos;re ready.
      </p>
    </div>
  );
}

export function CropInformationTabs() {
  const [active, setActive] = useState("production-site");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeEl = list.querySelector<HTMLElement>(`[data-slot="tabs-trigger"][data-active]`);
    if (activeEl) {
      activeEl.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [active]);

  return (
    <Tabs value={active} onValueChange={setActive}>
      <div className="relative">
        <TabsList
          ref={listRef}
          variant="line"
          className="flex h-auto w-full justify-start gap-1 overflow-x-auto whitespace-nowrap border-b rounded-none px-0 scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          <TabsTrigger value="production-site" className={TAB_TRIGGER_CLASS}>
            <MapPin className="h-4 w-4" /> Production Site
          </TabsTrigger>
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
        {/* right-edge fade hint for scrollable overflow */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-linear-to-l from-background to-transparent" />
      </div>

      <TabsContent value="production-site" className="mt-6">
        <ProductionSitesList />
      </TabsContent>

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
