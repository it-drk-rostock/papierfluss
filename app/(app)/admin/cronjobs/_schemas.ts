import { requiredFieldMessage } from "@/constants/required-field-message";
import { z } from "zod";

export const createWorkflowSchema = z.object({
  workflows: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
      })
    )
    .min(1, { message: requiredFieldMessage }),
});
