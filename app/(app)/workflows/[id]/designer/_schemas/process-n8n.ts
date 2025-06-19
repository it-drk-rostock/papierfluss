import { requiredFieldMessage } from "@/constants/required-field-message";
import { z } from "zod";

export const connectProcessN8nWorkflowSchema = z.object({
  processId: z.string().min(1),
  workflowType: z.enum([
    "saveN8nWorkflows",
    "completeN8nWorkflows",
    "reactivateN8nWorkflows",
  ]),
  workflows: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
      })
    )
    .min(1, { message: requiredFieldMessage }),
});

export const disconnectProcessN8nWorkflowSchema = z.object({
  processId: z.string().min(1),
  workflowType: z.enum([
    "saveN8nWorkflows",
    "completeN8nWorkflows",
    "reactivateN8nWorkflows",
  ]),
  n8nWorkflowId: z.string().min(1),
});
