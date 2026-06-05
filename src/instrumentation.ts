export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { registerNode } = await import("./instrumentation.node");
  registerNode();
}

export async function onRequestError(
  err: unknown,
  request: {
    path: string;
    method: string;
    headers: { [key: string]: string | undefined };
  },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
  }
): Promise<void> {
  const { log } = await import("./lib/log");
  const error = err instanceof Error ? err : new Error(String(err));
  const digest = (error as Error & { digest?: string }).digest;

  const xff = request.headers["x-forwarded-for"];
  const ip = xff?.split(",")[0]?.trim() ?? request.headers["x-real-ip"] ?? null;

  log.error(
    {
      err: error,
      digest,
      request: { path: request.path, method: request.method, ip },
      route: { kind: context.routerKind, path: context.routePath, type: context.routeType },
    },
    "request.error"
  );
}
