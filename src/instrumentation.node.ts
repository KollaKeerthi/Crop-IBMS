import { log } from "./lib/log";

const REQUIRED = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "GMAIL_USER",
  "GMAIL_APP_PASSWORD",
];

export function registerNode(): void {
  process.on("uncaughtException", (err) => {
    log.fatal({ err }, "process.uncaught_exception");
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    log.fatal({ reason }, "process.unhandled_rejection");
  });

  process.on("SIGTERM", () => {
    log.info("process.sigterm - shutting down");
    process.exit(0);
  });

  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    const msg = `instrumentation.missing_env - missing required: ${missing.join(", ")}`;
    log.error({ missing }, msg);
    // Fail fast in production: a missing AUTH_SECRET / DATABASE_URL means the app
    // would boot in a broken or insecure state. Dev still logs and continues so a
    // partial local env isn't blocking.
    if (process.env.NODE_ENV === "production") {
      throw new Error(msg);
    }
  }
}
