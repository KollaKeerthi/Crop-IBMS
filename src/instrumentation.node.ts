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
    log.info("process.sigterm — shutting down");
    process.exit(0);
  });

  for (const key of REQUIRED) {
    if (!process.env[key]) {
      log.error({ key }, `instrumentation.missing_env — ${key} is not set`);
    }
  }
}
