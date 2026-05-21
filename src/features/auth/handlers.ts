import { ApiError } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { log } from "@/lib/log";
import { getUserByEmail, getVerificationToken, getPasswordResetToken } from "./queries";
import {
  createUser,
  markEmailVerified,
  createVerificationToken,
  deleteVerificationToken,
  deleteVerificationTokensByUserId,
  createPasswordResetToken,
  deletePasswordResetToken,
  deletePasswordResetTokensByUserId,
  updateUserPassword,
} from "./mutations";
import { hashPassword } from "./lib/password";
import { generateToken, tokenExpiresAt, TOKEN_EXPIRY_HOURS } from "./lib/tokens";
import { verificationEmailHtml, verificationEmailText } from "./emails/verification";
import { passwordResetEmailHtml, passwordResetEmailText } from "./emails/password-reset";
import type { SignUpInput } from "./schema";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function signUpHandler(input: SignUpInput): Promise<{ email: string }> {
  const existing = await getUserByEmail(input.email);
  if (existing) {
    throw new ApiError(409, "email_taken", "An account with this email already exists.");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({ name: input.name, email: input.email, passwordHash });

  await sendVerificationEmail({ userId: user.id, name: user.name ?? input.name, email: user.email });
  await logAudit({ userId: user.id, action: "auth.signup", resource: user.id });

  return { email: user.email };
}

export async function verifyEmailHandler(token: string): Promise<{ email: string }> {
  const record = await getVerificationToken(token);
  if (!record) {
    throw new ApiError(400, "invalid_token", "This verification link is invalid or has already been used.");
  }
  if (record.expiresAt < new Date()) {
    // Don't delete yet — the failure page looks up the email from this token
    // so the user can resend without re-typing. Expired tokens are cleaned up
    // when a new verification email is sent (deleteVerificationTokensByUserId).
    throw new ApiError(
      400,
      "token_expired",
      "This verification link has expired. Please request a new one."
    );
  }

  const user = await markEmailVerified(record.userId);
  if (!user) {
    throw new ApiError(500, "internal_error", "Could not verify email. Please try again.");
  }

  await deleteVerificationToken(token);
  await logAudit({ userId: user.id, action: "auth.email_verified", resource: user.id });

  return { email: user.email };
}

export async function resendVerificationHandler(email: string): Promise<void> {
  const user = await getUserByEmail(email);
  // Silently succeed when user not found — prevents email enumeration
  if (!user) return;

  if (user.emailVerified) {
    throw new ApiError(400, "already_verified", "This email address is already verified.");
  }

  await deleteVerificationTokensByUserId(user.id);
  await sendVerificationEmail({ userId: user.id, name: user.name ?? email, email: user.email });
}

const RESET_EXPIRY_MINUTES = 30;

export async function forgotPasswordHandler(email: string): Promise<void> {
  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash) return; // silent — no enumeration
  await deletePasswordResetTokensByUserId(user.id);
  const token = generateToken();
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000);
  await createPasswordResetToken({ userId: user.id, token, expiresAt });
  const resetUrl = `${appUrl()}/reset-password?token=${token}`;
  const result = await sendEmail({
    to: user.email,
    subject: "Reset your password — Crop Management",
    html: passwordResetEmailHtml({ name: user.name ?? user.email, resetUrl, expiryMinutes: RESET_EXPIRY_MINUTES }),
    text: passwordResetEmailText({ name: user.name ?? user.email, resetUrl, expiryMinutes: RESET_EXPIRY_MINUTES }),
  });
  if (!result.ok) log.error({ userId: user.id }, "auth.password_reset_email_failed");
}

export async function resetPasswordHandler(token: string, password: string): Promise<void> {
  const record = await getPasswordResetToken(token);
  if (!record) throw new ApiError(400, "invalid_token", "This reset link is invalid or has already been used.");
  if (record.expiresAt < new Date()) {
    await deletePasswordResetToken(token);
    throw new ApiError(400, "token_expired", "This reset link has expired. Please request a new one.");
  }
  const passwordHash = await hashPassword(password);
  await updateUserPassword(record.userId, passwordHash);
  await deletePasswordResetToken(token);
  await logAudit({ userId: record.userId, action: "auth.password_reset", resource: record.userId });
}

async function sendVerificationEmail(opts: {
  userId: string;
  name: string;
  email: string;
}): Promise<void> {
  const token = generateToken();
  const expiresAt = tokenExpiresAt();

  await createVerificationToken({ userId: opts.userId, token, expiresAt });

  const verifyUrl = `${appUrl()}/verify-email?token=${token}`;
  const result = await sendEmail({
    to: opts.email,
    subject: "Verify your email — Crop Management",
    html: verificationEmailHtml({ name: opts.name, verifyUrl, expiryHours: TOKEN_EXPIRY_HOURS }),
    text: verificationEmailText({ name: opts.name, verifyUrl, expiryHours: TOKEN_EXPIRY_HOURS }),
  });

  if (!result.ok) {
    log.error({ userId: opts.userId, email: opts.email }, "auth.verification_email_failed");
  }
}
