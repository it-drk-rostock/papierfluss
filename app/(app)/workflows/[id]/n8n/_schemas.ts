import { requiredFieldMessage } from "@/constants/required-field-message";
import { z } from "zod";

export const connectN8nWorkflowSchema = z.object({
  workflowId: z.string().min(1),
  workflowType: z.enum([
    "initializeN8nWorkflows",
    "saveN8nWorkflows",
    "completeN8nWorkflows",
    "archiveN8nWorkflows",
    "reactivateN8nWorkflows",
    "lastN8nWorkflows",
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
  workflowId: z.string().min(1),
  workflowType: z.enum([
    "initializeN8nWorkflows",
    "saveN8nWorkflows",
    "completeN8nWorkflows",
    "archiveN8nWorkflows",
    "reactivateN8nWorkflows",
    "lastN8nWorkflows",
  ]),
  n8nWorkflowId: z.string().min(1),
});
