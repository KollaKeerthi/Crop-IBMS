import { z } from "zod";
import { ApiError } from "./errors";

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
    throw new ApiError(
      res.status,
      errBody?.error?.code ?? "unknown_error",
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
