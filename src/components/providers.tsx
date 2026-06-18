"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { toast } from "sonner";
import { FarmProvider } from "@/lib/farm-context";
import { ApiError } from "@/lib/api/errors";

// Rate limiting is cross-cutting: surface a single, clear notice for any query or
// mutation that gets a 429, even where the local handler shows a generic message.
// The fixed toast id collapses rapid repeats into one toast that updates in place.
function notifyRateLimit(error: unknown) {
  if (error instanceof ApiError && error.code === "rate_limited") {
    toast.error(error.message, { id: "rate-limited" });
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: notifyRateLimit }),
        mutationCache: new MutationCache({ onError: notifyRateLimit }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error: unknown) => {
              if (
                typeof error === "object" &&
                error !== null &&
                "status" in error &&
                typeof error.status === "number" &&
                error.status >= 400 &&
                error.status < 500
              ) {
                return false;
              }
              return failureCount < 1;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <FarmProvider>{children}</FarmProvider>
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
