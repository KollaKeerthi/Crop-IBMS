import pino, { type Logger, type LoggerOptions } from "pino";

const isProd = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

const PINO_TO_SEVERITY: Record<string, string> = {
  trace: "DEBUG",
  debug: "DEBUG",
  info: "INFO",
  warn: "WARNING",
  error: "ERROR",
  fatal: "CRITICAL",
};

const baseOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  serializers: { err: pino.stdSerializers.err, error: pino.stdSerializers.err },
  formatters: {
    level(label) {
      return { level: label, severity: PINO_TO_SEVERITY[label] ?? label.toUpperCase() };
    },
    bindings() {
      return { service: "crop-management" };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "password",
      "*.password",
      "token",
      "*.token",
      "accessToken",
      "*.accessToken",
      "refreshToken",
      "*.refreshToken",
      "apiKey",
      "*.apiKey",
      "secret",
      "*.secret",
      "authorization",
      "*.authorization",
      "headers.authorization",
      "headers.cookie",
      "privateKey",
      "*.privateKey",
      "credentials",
      "*.credentials",
    ],
    censor: "[REDACTED]",
  },
};

const devTransport: LoggerOptions["transport"] =
  !isProd && !isTest
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss.l",
          ignore: "pid,hostname,service,severity",
        },
      }
    : undefined;

export const log: Logger = pino({
  ...baseOptions,
  ...(devTransport ? { transport: devTransport } : {}),
});

export function getClientIp(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || headers.get("x-real-ip") || null;
}
