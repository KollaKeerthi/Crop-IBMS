/**
 * Builds a friendly, human-readable rate-limit message that tells the user when
 * they can retry. `retryAfter` is the number of seconds from the `Retry-After`
 * header (or the limiter result). Shared by the client fetch wrapper, the global
 * React Query error handler, and the login server action so the wording stays
 * consistent everywhere.
 */
export function rateLimitMessage(retryAfter?: number, lead = "Too many requests."): string {
  if (!retryAfter || retryAfter <= 0) {
    return `${lead} Please wait a moment and try again.`;
  }
  if (retryAfter < 60) {
    return `${lead} Please try again in ${retryAfter} second${retryAfter === 1 ? "" : "s"}.`;
  }
  const minutes = Math.ceil(retryAfter / 60);
  return `${lead} Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
