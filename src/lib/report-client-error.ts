export function reportClientError(err: unknown, context?: Record<string, unknown>): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  fetch("/api/log/client-error", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, stack, context }),
  }).catch(() => {});
}
