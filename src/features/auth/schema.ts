import { z } from "zod";

export const SignUpInputSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be 100 characters or fewer" }),
  email: z
    .string({ message: "Email is required" })
    .trim()
    .email({ message: "Enter a valid email address" }),
  password: z
    .string({ message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" })
    .max(72, { message: "Password must be 72 characters or fewer" }),
});

export const ResendVerificationInputSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .trim()
    .email({ message: "Enter a valid email address" }),
});

export type SignUpInput = z.infer<typeof SignUpInputSchema>;
export type ResendVerificationInput = z.infer<typeof ResendVerificationInputSchema>;

export const ForgotPasswordInputSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address" }),
});

export const ResetPasswordInputSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(72),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;
