import { z } from "zod";

export const AiChatRequestSchema = z.object({
  message: z.string().trim().min(1, { message: "Message is required." }).max(4000),
  farmId: z.string().uuid({ message: "farmId must be a valid UUID." }),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      })
    )
    .max(20)
    .optional()
    .default([]),
});

export const AiChatFallbackResponseSchema = z.object({
  response: z.string(),
});

export type AiChatRequest = z.infer<typeof AiChatRequestSchema>;
export type AiChatFallbackResponse = z.infer<typeof AiChatFallbackResponseSchema>;
