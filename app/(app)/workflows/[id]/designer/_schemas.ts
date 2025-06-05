import { requiredFieldMessage } from "@/constants/required-field-message";
import { z } from "zod";

export const processSchema = z.object({
  name: z.string().min(1, {
    message: requiredFieldMessage,
  }),
  description: z.string().optional(),
  isCategory: z.boolean().default(false),
  parentId: z.string().nullable(),
  workflowId: z.string().min(1),
});
