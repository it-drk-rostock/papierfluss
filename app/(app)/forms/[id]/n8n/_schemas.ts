import { requiredFieldMessage } from "@/constants/required-field-message";
import { z } from "zod/v4";

export const connectN8nWorkflowSchema = z.object({
  formId: z.string().min(1),
  workflowType: z.enum([
    "fillOutWorkflows",
    "saveWorkflows",
    "revokeWorkflows",
    "submitWorkflows",
    "reviewWorkflows",
    "reUpdateWorkflows",
    "rejectWorkflows",
    "completeWorkflows",
    "archiveWorkflows",
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

export const disconnectN8nWorkflowSchema = z.object({
  formId: z.string().min(1),
  workflowType: z.enum([
    "fillOutWorkflows",
    "saveWorkflows",
    "revokeWorkflows",
    "submitWorkflows",
    "reviewWorkflows",
    "reUpdateWorkflows",
    "rejectWorkflows",
    "completeWorkflows",
    "archiveWorkflows",
  ]),
  workflowId: z.string().min(1),
});
