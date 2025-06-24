import { requiredFieldMessage } from "@/constants/required-field-message";
import { idSchema } from "@/schemas/id-schema";
import { z } from "zod";

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
  editWorkflowPermissions: z.string().optional(),
  submitProcessPermissions: z.string().optional(),
  information: workflowInformationSchema.optional(),
  responsibleTeam: z
    .object({
      id: z.string().optional().nullable(),
      name: z.string().optional().nullable(),
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
