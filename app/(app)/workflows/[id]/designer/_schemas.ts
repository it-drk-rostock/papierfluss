import { requiredFieldMessage } from "@/constants/required-field-message";
import { z } from "zod";

export const processSchema = z.object({
  name: z.string().min(1, {
    message: requiredFieldMessage,
  }),
  isCategory: z.boolean().default(false),
  parentId: z.string().nullable(),
  workflowId: z.string().min(1),
});
