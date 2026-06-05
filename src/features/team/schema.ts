import { z } from "zod";

export const MemberRoleSchema = z.enum(["OWNER", "MANAGER", "WORKER"]);

export const InviteMemberInputSchema = z.object({
  farmId: z.string().uuid({ message: "farmId must be a valid UUID" }),
  email: z.string().email({ message: "Valid email is required" }),
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(1, { message: "Name is required" })
    .max(200),
  role: MemberRoleSchema,
  password: z
    .string({ message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" }),
});

export const UpdateMemberRoleInputSchema = z.object({
  role: MemberRoleSchema,
});

export const MemberSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().nullable(),
  email: z.string(),
  role: MemberRoleSchema,
  joinedAt: z.string(),
});

export const MembersResponseSchema = z.array(MemberSchema);

export type MemberRole = z.infer<typeof MemberRoleSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberInputSchema>;
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleInputSchema>;
export type Member = z.infer<typeof MemberSchema>;
