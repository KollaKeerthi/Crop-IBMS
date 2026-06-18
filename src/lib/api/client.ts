import { z } from "zod";
import { ApiError } from "./errors";
import { rateLimitMessage } from "./rate-limit-message";

type RequestOptions<TResponse> = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  responseSchema?: z.ZodSchema<TResponse>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export async function apiFetch<TResponse>(
  path: string,
  options: RequestOptions<TResponse> = {}
): Promise<TResponse> {
  const { method = "GET", body, responseSchema, headers = {}, signal } = options;

  const res = await fetch(path, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const code = errBody?.error?.code ?? "unknown_error";

    if (res.status === 429 || code === "rate_limited") {
      const parsed = Number(res.headers.get("retry-after"));
      const retryAfter = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
      throw new ApiError(res.status, "rate_limited", rateLimitMessage(retryAfter), retryAfter);
    }

    throw new ApiError(
      res.status,
      code,
      errBody?.error?.message ?? `Request failed: ${res.status}`
    );
  }

  if (res.status === 204) return undefined as TResponse;

  const json = await res.json();
  const data = json?.data ?? json;

  if (responseSchema) {
    const parsed = responseSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError(500, "invalid_response", "API returned unexpected data shape");
    }
    return parsed.data;
  }

  return data as TResponse;
}
