import { randomBytes } from "node:crypto";

export const TOKEN_EXPIRY_HOURS = 24;

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function tokenExpiresAt(): Date {
  const d = new Date();
  d.setHours(d.getHours() + TOKEN_EXPIRY_HOURS);
  return d;
}
