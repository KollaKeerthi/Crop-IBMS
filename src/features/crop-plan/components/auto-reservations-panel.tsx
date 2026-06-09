"use client";

import { Zap } from "lucide-react";

export function AutoReservationsPanel() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
      <Zap className="mb-2 size-8 opacity-30" />
      <p className="font-medium">Auto Reservations</p>
      <p className="text-xs mt-1 text-center max-w-xs">
        Automatically generate reservations based on block capacity, lead times, and density master.
        Coming soon.
      </p>
    </div>
  );
}
