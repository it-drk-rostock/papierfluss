import { requiredFieldMessage } from "@/constants/required-field-message";
import { idSchema } from "@/schemas/id-schema";
import { z } from "zod/v4";

export const workflowInformationSchema = z.object({
  fields: z.array(
    z.object({
      label: z.string().min(1),
      fieldKey: z.string().min(1),
    })
  ),
});

export const workflowSchema = z.object({
  name: z.string().min(1, {
    message: requiredFieldMessage,
  }),
  description: z.string().min(1, {
    message: requiredFieldMessage,
  }),
  isPublic: z.boolean().default(false),
  isActive: z.boolean().default(true),
  showInitializeForm: z.boolean().default(false),
  editWorkflowPermissions: z.string().optional(),
  submitProcessPermissions: z.string().optional(),
  information: workflowInformationSchema.optional(),
  initializeProcess: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional()
    .nullable(),
  responsibleTeam: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional()
    .nullable(),
});

export const updateWorkflowSchema = workflowSchema.extend(idSchema.shape);

export const removeTeamSchema = z
  .object({
    teamId: z.string().min(1),
  })
  .extend(idSchema.shape);

export const assignTeamsSchema = z
  .object({
    teams: z.array(
      z.object({
        id: z.string().min(1),
      })
    ),
  })
  .extend(idSchema.shape);
