"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { FarmProvider } from "@/lib/farm-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
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
      <FarmProvider>
        {children}
      </FarmProvider>
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
